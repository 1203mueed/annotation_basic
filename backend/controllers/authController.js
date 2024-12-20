const { registerUser, loginUser } = require('../services/userService');

async function signup(req, res) {
  try {
    const { name, email, password } = req.body;
    const user = await registerUser(name, email, password);
    return res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function signin(req, res) {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser(email, password);
    return res.json({ message: 'Login successful', user, token });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

function dashboard(req, res) {
  res.json({ message: `Welcome to your dashboard, user #${req.user.id}` });
}

module.exports = {
  signup,
  signin,
  dashboard
};
