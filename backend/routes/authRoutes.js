// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // <-- Import the db pool here

const { signup, signin, dashboard } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { getAllRequests } = require('../controllers/requestsController');
const { getAllProjects } = require('../controllers/projectsController');
const { upload, moveUploadedFiles } = require('../middleware/uploadMiddleware');

// Existing routes
router.post('/signup', signup);
router.post('/signin', signin);
router.get('/dashboard', verifyToken, dashboard);

// Fetching all requests and projects (must be logged in)
router.get('/requests', verifyToken, getAllRequests);
router.get('/projects', verifyToken, getAllProjects);

// Handle new annotation requests + file uploads
router.post('/requests-with-upload', verifyToken, upload.array('files'), async (req, res) => {
  try {
    // 1) Extract form data
    const { description, delivery_type, special_instructions } = req.body;
    const userId = req.user.id; // The authenticated client's user ID

    // 2) Insert a new "request" record
    const insertResult = await pool.query(`
      INSERT INTO requests (client_id, description, delivery_type, status, special_requirements)
      VALUES ($1, $2, $3, 'Pending', $4)
      RETURNING id
    `, [userId, description, delivery_type, special_instructions]);

    const newRequestId = insertResult.rows[0].id;

    // 3) Optionally create a project immediately (demo)
    const projectInsert = await pool.query(`
      INSERT INTO projects (request_id, status)
      VALUES ($1, 'Annotation_Started')
      RETURNING id
    `, [newRequestId]);

    const projectId = projectInsert.rows[0].id;

    // 4) Move the uploaded folder(s) to "ClientDataUpload/<projectId>"
    moveUploadedFiles(projectId, req.files);

    return res.json({
      message: 'Annotation request created successfully.',
      requestId: newRequestId,
      projectId
    });
  } catch (error) {
    console.error('[requests-with-upload] error:', error);
    return res.status(500).json({ error: 'Failed to create request and upload data' });
  }
});

module.exports = router;
