// backend/controllers/projectsController.js
const pool = require('../config/db');

/**
 * Fetch all projects from the database.
 * This is a simple example; adapt fields as needed.
 */
async function getAllProjects(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        p.request_id,
        p.project_manager_id,
        pm.name AS project_manager_name,
        p.status,
        p.completion_percentage,
        p.created_at
      FROM projects p
      LEFT JOIN users pm ON p.project_manager_id = pm.id
      ORDER BY p.created_at DESC
    `);
    return res.json({ projects: rows });
  } catch (error) {
    console.error('[projectsController] Error fetching projects:', error.message);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
}

module.exports = {
  getAllProjects
};
