const pool = require('../config/db');

// Debug: log queries if needed
// e.g., console.log("Querying user by email", email);

async function findUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
}

async function createUser(name, email, passwordHash, role_id = 2) { 
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role_id',
    [name, email, passwordHash, role_id]
  );
  return rows[0];
}

// For fetching user details after login
async function findUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
}

module.exports = {
  findUserByEmail,
  createUser,
  findUserById
};
