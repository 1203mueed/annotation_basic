const { registerUser, loginUser } = require('../services/userService');
const { findUserById } = require('../models/userModel');

async function signup(req, res) {
  try {
    console.log('[authController] signup endpoint called. body:', req.body);
    const { name, email, password } = req.body;
    const user = await registerUser(name, email, password);
    return res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('[authController] signup error:', error.message);
    return res.status(400).json({ error: error.message });
  }
}

async function signin(req, res) {
  try {
    console.log('[authController] signin endpoint called. body:', req.body);
    const { email, password } = req.body;
    const { user, token } = await loginUser(email, password);
    console.log('[authController] signin success, returning user & token.');
    return res.json({ message: 'Login successful', user, token });
  } catch (error) {
    console.error('[authController] signin error:', error.message);
    return res.status(400).json({ error: error.message });
  }
}

async function dashboard(req, res) {
  try {
    console.log('[authController] dashboard endpoint called for userID:', req.user.id);
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({
      message: `Welcome to your client dashboard, ${user.name}!`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id
      },
    });
  } catch (error) {
    console.error('[authController] dashboard error:', error.message);
    return res.status(500).json({ error: 'Unable to fetch user data.' });
  }
}

module.exports = {
  signup,
  signin,
  dashboard
};
