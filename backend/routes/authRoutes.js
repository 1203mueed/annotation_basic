// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { signup, signin, dashboard } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Import new controllers
const { getAllRequests } = require('../controllers/requestsController');
const { getAllProjects } = require('../controllers/projectsController');

// Existing routes
router.post('/signup', signup);
router.post('/signin', signin);
router.get('/dashboard', verifyToken, dashboard);

// NEW routes:
router.get('/requests', verifyToken, getAllRequests);
router.get('/projects', verifyToken, getAllProjects);

module.exports = router;
