const express = require('express');
const router = express.Router();
const { authenticateOwner, ensureOwnerDataIsolation } = require('./ownerAuth');
const { authenticateAny } = require('./auth');

module.exports = (pool) => {
  // GET /api/announcements - Fetch announcements (with optional branch filter)
  router.get('/', authenticateAny, async (req, res) => {
    try {
      const library_id = req.session.owner?.id || req.session.student?.libraryId;
      const student_branch_id = req.session.student?.branchId;

      if (!library_id) {
        return res.status(400).json({ message: 'Library ID is required' });
      }

      let query = `
        SELECT a.*, u.username as created_by_name 
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.library_id = $1 AND a.is_active = true
      `;
      let params = [library_id];

      // If a student is making the request, filter by their branch
      if (student_branch_id) {
        query += ` AND (a.branch_id = $2 OR a.is_global = true)`;
        params.push(student_branch_id);
      }

      // Check if announcement is within date range
      query += ` AND (a.start_date IS NULL OR a.start_date <= NOW())
                 AND (a.end_date IS NULL OR a.end_date >= NOW())
                 ORDER BY a.created_at DESC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // POST /api/announcements - Create new announcement (admin/staff only)
  router.post('/', authenticateOwner, ensureOwnerDataIsolation, async (req, res) => {
    try {
      const { title, content, branch_id, is_global, start_date, end_date } = req.body;
      const library_id = req.libraryId;
      // If an owner is creating, created_by (user_id) can be null.
      // If a staff/admin is creating, use their user ID.
      const created_by = req.session.user?.id || null;

      if (!library_id) {
        return res.status(400).json({ message: 'Authentication required: Library ID is missing.' });
      }

      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
      }

      const query = `
        INSERT INTO announcements (library_id, title, content, branch_id, is_global, start_date, end_date, created_by, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING *
      `;

      const params = [
        library_id,
        title,
        content,
        branch_id || null,
        is_global || false,
        start_date || new Date(), // Default to now() if start_date is not provided
        end_date || null,
        created_by
      ];

      const result = await pool.query(query, params);
      res.status(201).json({ 
        message: 'Announcement created successfully',
        announcement: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // PUT /api/announcements/:id - Update announcement (admin/staff only)
  router.put('/:id', authenticateOwner, ensureOwnerDataIsolation, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, branch_id, is_global, start_date, end_date, is_active } = req.body;
      const library_id = req.libraryId;

      if (!library_id) {
        return res.status(400).json({ message: 'Authentication required' });
      }

      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
      }

      const query = `
        UPDATE announcements 
        SET title = $1, content = $2, branch_id = $3, is_global = $4, 
            start_date = $5, end_date = $6, is_active = $7, updated_at = NOW()
        WHERE id = $8 AND library_id = $9
        RETURNING *
      `;

      const params = [
        title,
        content,
        branch_id || null,
        is_global || false,
        start_date || null,
        end_date || null,
        is_active !== undefined ? is_active : true,
        id,
        library_id
      ];

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Announcement not found' });
      }

      res.json({ 
        message: 'Announcement updated successfully',
        announcement: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // DELETE /api/announcements/:id - Delete announcement (admin/staff only)
  router.delete('/:id', authenticateOwner, ensureOwnerDataIsolation, async (req, res) => {
    try {
      const { id } = req.params;
      const library_id = req.libraryId;

      if (!library_id) {
        return res.status(400).json({ message: 'Authentication required' });
      }

      const query = `
        DELETE FROM announcements 
        WHERE id = $1 AND library_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [id, library_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Announcement not found' });
      }

      res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  return router;
};
