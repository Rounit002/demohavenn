// ownerAuth.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const mainPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.SESSION_SECRET || "secret";

// Utility: create a tenant pool safely
function createTenantPool({ user, host, database, password }) {
  const encodedPassword = encodeURIComponent(password);
  return new Pool({
    connectionString: `postgresql://${user}:${encodedPassword}@${host}/${database}`,
    ssl: { rejectUnauthorized: false }
  });
}

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  const { name, code, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const checkCode = await mainPool.query(
      "SELECT * FROM owners WHERE code = $1",
      [code]
    );
    if (checkCode.rows.length > 0) {
      return res.status(400).json({ message: "Library code already exists" });
    }

    const newOwner = await mainPool.query(
      "INSERT INTO owners (name, code, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, code, email, hashedPassword]
    );

    console.log("[OWNER_AUTH] New library registered:", name, `(${code})`);
    res.status(201).json({ message: "Registration successful", owner: newOwner.rows[0] });

  } catch (err) {
    console.error("[OWNER_AUTH] Registration error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  const { code, email, password } = req.body;

  try {
    // Get library info from main DB
    const ownerRes = await mainPool.query(
      "SELECT * FROM owners WHERE code = $1 AND email = $2",
      [code, email]
    );

    if (ownerRes.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const owner = ownerRes.rows[0];
    const isMatch = await bcrypt.compare(password, owner.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // If tenant DB connection is needed:
    try {
      const tenantPool = createTenantPool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD
      });
      await tenantPool.query("SELECT 1"); // Test connection
      tenantPool.end();
    } catch (dbErr) {
      console.error("[OWNER_AUTH] Tenant DB connection error:", dbErr);
      return res.status(500).json({ message: "Tenant DB connection failed" });
    }

    const token = jwt.sign(
      { ownerId: owner.id, code: owner.code },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, owner });

  } catch (err) {
    console.error("[OWNER_AUTH] Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ================= CHECK LIBRARY CODE =================
router.post("/check-library-code", async (req, res) => {
  const { code } = req.body;

  try {
    const result = await mainPool.query(
      "SELECT * FROM owners WHERE code = $1",
      [code]
    );

    if (result.rows.length === 0) {
      return res.json({ exists: false });
    }

    res.json({ exists: true });

  } catch (err) {
    console.error("[OWNER_AUTH] Error checking library code:", err);
    res.status(500).json({ message: "Error checking library code" });
  }
});

module.exports = router;
