const bcrypt = require('bcrypt');
const { findUserByEmail, createUser } = require('../models/userModel');
const { signToken } = require('../utils/jwt');

async function registerUser(name, email, password) {
  // Debug
  console.log('[userService] registerUser called:', { name, email });
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already in use.');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await createUser(name, email, passwordHash);
  console.log('[userService] User registered:', newUser);
  return newUser;
}

async function loginUser(email, password) {
  console.log('[userService] loginUser called:', { email });
  const user = await findUserByEmail(email);
  if (!user) throw new Error('Invalid email or password.');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error('Invalid email or password.');

  const token = signToken({ id: user.id, email: user.email, role_id: user.role_id });
  console.log('[userService] loginUser success, token generated.');
  return { user, token };
}

module.exports = {
  registerUser,
  loginUser
};
