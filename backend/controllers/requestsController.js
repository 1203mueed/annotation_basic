// backend/controllers/requestsController.js
const pool = require('../config/db');

/**
 * Fetch all requests from the database.
 * This is a simple example; adapt fields as needed.
 */
async function getAllRequests(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        r.id,
        r.client_id,
        u.name AS client_name,
        r.description,
        r.special_requirements,
        r.delivery_type,
        r.status,
        r.reason_for_rejection,
        r.estimated_delivery_date,
        r.created_at
      FROM requests r
      JOIN users u ON r.client_id = u.id
      ORDER BY r.created_at DESC
    `);
    return res.json({ requests: rows });
  } catch (error) {
    console.error('[requestsController] Error fetching requests:', error.message);
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
}

module.exports = {
  getAllRequests
};
