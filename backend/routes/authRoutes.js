const express = require('express');
const router = express.Router();
const { signup, signin, dashboard } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/dashboard', verifyToken, dashboard);

module.exports = router;
