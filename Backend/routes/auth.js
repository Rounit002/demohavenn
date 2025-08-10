// ./routes/auth.js
const express = require('express');

// Permission-checking middleware
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.session.user) {
      if (req.session.user.role === 'admin' || req.session.user.role === 'staff') {
        return next();
      }
      const userPermissions = req.session.user.permissions || [];
      if (userPermissions.includes(permission)) {
        return next();
      }
    }
    if (req.session.owner) {
      return next(); // Owners have all permissions
    }
    return res.status(401).json({ message: 'Unauthorized - Please log in' });
  };
};

const checkPermissions = (permissions = [], logic = 'OR') => {
  return (req, res, next) => {
    if (req.session.owner) {
      return next(); // Owners have all permissions
    }
    if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized - Please log in' });
    }
    if (req.session.user.role === 'admin') {
      return next(); // Admins have all permissions
    }
    const userPermissions = req.session.user.permissions || [];
    let hasPermission;
    if (logic.toUpperCase() === 'AND') {
      hasPermission = permissions.every(p => userPermissions.includes(p));
    } else {
      hasPermission = permissions.some(p => userPermissions.includes(p));
    }
    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }
    return next();
  };
};

// Role-checking middleware
const checkAdmin = (req, res, next) => {
  if (req.session.owner) {
    return next(); // Owners are considered admins
  }
  if (!req.session.user) {
    console.warn('[AUTH.JS] Admin Check Failed: No user in session for path:', req.path);
    return res.status(401).json({ message: 'Unauthorized - Please log in' });
  }
  if (req.session.user.role !== 'admin') {
    console.warn(`[AUTH.JS] Admin Check Failed: User ${req.session.user.username} (role: ${req.session.user.role}) is not an admin for path: ${req.path}`);
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  return next();
};

const checkAdminOrStaff = (req, res, next) => {
  if (req.session.owner) {
    return next(); // Owners are considered admins/staff
  }
  if (!req.session.user) {
    console.warn('[AUTH.JS] Admin/Staff Check Failed: No user in session for path:', req.path);
    return res.status(401).json({ message: 'Unauthorized - Please log in' });
  }
  if (req.session.user.role === 'admin' || req.session.user.role === 'staff') {
    return next();
  }
  console.warn(`[AUTH.JS] Admin/Staff Check Failed: User ${req.session.user.username} (role: ${req.session.user.role}) is not admin/staff for path: ${req.path}`);
  return res.status(403).json({ message: 'Forbidden: Admin or Staff access required' });
};

// Authentication middleware
const authenticateOwner = (req, res, next) => {
  if (req.session && req.session.owner && req.session.owner.id) {
    req.owner = req.session.owner;
    req.libraryId = req.session.owner.id; // Set libraryId for owner
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized: Owner access required.' });
};

const authenticateStudent = (req, res, next) => {
  if (req.session && req.session.student && req.session.student.id) {
    req.student = req.session.student;
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized: Student access required.' });
};

const authenticateUser = (req, res, next) => {
    // This middleware is for general user (admin/staff) access
    if (req.session && req.session.user && req.session.user.id) {
        return next();
    }
    console.warn('[AUTH.JS] User not authenticated for path:', req.path);
    return res.status(401).json({ message: 'Unauthorized - Please log in' });
};

const authenticateAny = (req, res, next) => {
  if ((req.session && req.session.owner && req.session.owner.id) || 
      (req.session && req.session.user && req.session.user.id) ||
      (req.session && req.session.student && req.session.student.id)) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized: Please log in.' });
};

// Data isolation middleware
const ensureOwnerDataIsolation = (req, res, next) => {
  // This middleware should run *after* authenticateOwner
  if (!req.owner) {
    return res.status(401).json({ message: 'Unauthorized. Owner context is missing.' });
  }
  req.libraryId = req.owner.id;
  next();
};

// Auth router factory
const authRouter = (pool) => {
  const router = express.Router();

  // User login (admin/staff)
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      const result = await pool.query(
        'SELECT id, username, password, role, permissions FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result.rows[0];
      // In a real app, use bcrypt.compare(password, user.password)
      const isPasswordValid = (password === user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions || []
      };

      console.log(`[AUTH.JS] User ${user.username} logged in successfully`);
      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          permissions: user.permissions || []
        }
      });
    } catch (err) {
      console.error('[AUTH.JS] Login error:', err.stack);
      return res.status(500).json({ message: 'Server error during login', error: err.message });
    }
  });

  // Logout for all user types
  router.get('/logout', (req, res) => {
    const username = req.session?.user?.username || req.session?.owner?.name || 'Unknown';
    req.session.destroy((err) => {
      if (err) {
        console.error('[AUTH.JS] Logout error for user:', username, err.stack);
        return res.status(500).json({ message: 'Could not log out, please try again.' });
      }
      res.clearCookie('connect.sid');
      console.log(`[AUTH.JS] User ${username} logged out successfully.`);
      return res.json({ message: 'Logout successful' });
    });
  });

  // Get current session status
  router.get('/status', (req, res) => {
    try {
      if (req.session && req.session.owner) {
        return res.json({
          isAuthenticated: true,
          userType: 'owner',
          owner: {
            id: req.session.owner.id,
            name: req.session.owner.name,
            email: req.session.owner.email,
            library_code: req.session.owner.library_code
          }
        });
      }
      
      if (req.session && req.session.user) {
        return res.json({
          isAuthenticated: true,
          userType: 'user',
          user: {
            id: req.session.user.id,
            username: req.session.user.username,
            role: req.session.user.role,
            permissions: req.session.user.permissions || []
          }
        });
      }
      
      return res.json({ isAuthenticated: false, user: null, owner: null });
    } catch (error) {
      console.error('[AUTH.JS] Error in /api/auth/status:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // Refresh session with up-to-date DB values
  router.get('/refresh', authenticateAny, async (req, res) => {
    try {
      if (req.session.owner && req.session.owner.id) {
        const result = await pool.query(
          'SELECT id, library_code, library_name, owner_name, owner_email FROM libraries WHERE id = $1',
          [req.session.owner.id]
        );
        const library = result.rows[0];
        if (!library) {
          return res.status(404).json({ message: 'Library owner not found' });
        }

        req.session.owner = {
          id: library.id,
          libraryCode: library.library_code,
          libraryName: library.library_name,
          ownerName: library.owner_name,
          ownerEmail: library.owner_email,
          role: 'owner'
        };

        console.log(`[AUTH.JS] Owner session refreshed for: ${library.owner_name}`);
        return res.json({
          message: 'Session refreshed',
          owner: req.session.owner
        });
      }
      
      if (req.session.user && req.session.user.id) {
        const result = await pool.query(
          'SELECT id, username, role, permissions FROM users WHERE id = $1',
          [req.session.user.id]
        );
        const user = result.rows[0];
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        req.session.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          permissions: user.permissions || []
        };

        console.log(`[AUTH.JS] User session refreshed for: ${user.username}`);
        return res.json({
          message: 'Session refreshed',
          user: req.session.user
        });
      }

      return res.status(400).json({ message: 'No active session to refresh.' });
    } catch (error) {
      console.error('[AUTH.JS] Error in /api/auth/refresh:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  return router;
};

// Export all middleware and the router factory
module.exports = {
  checkPermission,
  checkPermissions,
  checkAdmin,
  checkAdminOrStaff,
  authenticateOwner,
  authenticateStudent,
  authenticateUser,
  authenticateAny,
  ensureOwnerDataIsolation,
  authRouter,
};