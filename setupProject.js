/**
 * setupProject.js
 *
 * Usage:
 *   1. In an empty directory, create this file.
 *   2. Run "node setupProject.js".
 *   3. Install packages in backend and frontend folders, then start them.
 */

const fs = require('fs');
const path = require('path');

// Utility function to ensure a directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/* ---------------- BACKEND FILE CONTENTS ---------------- */

// server.js (with minor debug logs)
const serverJsContent = `const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Debug log to confirm server started
console.log('Initializing server.js...');

// The prefix "/api/auth" merges with the endpoints inside authRoutes.js
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\\\`Server running on port \${PORT}\\\`);
});
`;

// db.js
const dbJsContent = `const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'annotation_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'annotation_db',
  password: process.env.DB_PASSWORD || 'some_secure_password',
  port: process.env.DB_PORT || 5432
});

module.exports = pool;
`;

// userModel.js
const userModelJsContent = `const pool = require('../config/db');

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
`;

// userService.js
const userServiceJsContent = `const bcrypt = require('bcrypt');
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
`;

// authController.js
const authControllerJsContent = `const { registerUser, loginUser } = require('../services/userService');
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
      message: \`Welcome to your client dashboard, \${user.name}!\`,
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
`;

// authRoutes.js
const authRoutesJsContent = `const express = require('express');
const router = express.Router();
const { signup, signin, dashboard } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Debug log whenever the route file is loaded
console.log('Loading authRoutes...');

router.post('/signup', (req, res, next) => {
  console.log('Incoming POST /api/auth/signup');
  next();
}, signup);

router.post('/signin', (req, res, next) => {
  console.log('Incoming POST /api/auth/signin');
  next();
}, signin);

router.get('/dashboard', (req, res, next) => {
  console.log('Incoming GET /api/auth/dashboard');
  next();
}, verifyToken, dashboard);

module.exports = router;
`;

// authMiddleware.js
const authMiddlewareJsContent = `const { verifyToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('[authMiddleware] No token provided.');
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    console.log('[authMiddleware] Valid token for user:', decoded.id);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('[authMiddleware] Invalid token:', error.message);
    return res.status(403).json({ error: 'Invalid token.' });
  }
}

module.exports = { verifyToken: authMiddleware };
`;

// jwt.js
const jwtJsContent = `const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'supersecretkey';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '1d' });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
`;

/* ---------------- FRONTEND FILE CONTENTS ---------------- */

// package.json for the frontend
const frontendPackageJson = `{
  "name": "frontend",
  "version": "1.0.0",
  "private": true,
  "main": "index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  },
  "dependencies": {
    "axios": "^1.7.9",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.28.1",
    "react-scripts": "5.0.1"
  }
}
`;

// public/index.html
const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
`;

// src/index.js
const indexJsContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

// src/index.css
const indexCssContent = `body {
  margin: 0;
  font-family: Arial, sans-serif;
}
`;

// App.js
const appJsContent = `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignupPage from './pages/SignupPage';
import SigninPage from './pages/SigninPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signin" element={<SigninPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ClientDashboardPage />
            </ProtectedRoute>
          }
        />
        {/* Default route -> Signin */}
        <Route path="/" element={<SigninPage />} />
      </Routes>
    </Router>
  );
}

export default App;
`;

// src/services/api.js
const apiJsContent = `import axios from 'axios';

// Adjust baseURL if your backend runs on a different port or IP
const API = axios.create({
  baseURL: 'http://localhost:5000/api', 
});

// Intercept requests to attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

export default API;
`;

// src/utils/auth.js
const authJsContent = `export function setToken(token) {
  localStorage.setItem('token', token);
}

export function getToken() {
  return localStorage.getItem('token');
}

export function removeToken() {
  localStorage.removeItem('token');
}
`;

/* ---------------- SIGNUP COMPONENT & PAGE ---------------- */

// components/Signup.js
const signupJsContent = `import React, { useState } from 'react';
import API from '../services/api';
import '../styles/Signup.css';

function Signup({ onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  // Debug: see form data changes
  const handleChange = (e) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    console.log('[Signup] Updating formData:', newData);
    setFormData(newData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Signup] Form submitted!', formData);
    setError('');
    try {
      const res = await API.post('/auth/signup', formData);
      console.log('[Signup] Server response:', res.data);
      onSuccess();
    } catch (err) {
      console.error('[Signup] Error:', err);
      setError(err.response?.data?.error || 'Signup failed.');
    }
  };

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <h2>Sign Up</h2>
      {error && <div className="error">{error}</div>}
      <input
        name="name"
        placeholder="Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}

export default Signup;
`;

// pages/SignupPage.js
const signupPageJsContent = `import React from 'react';
import Signup from '../components/Signup';
import { useNavigate } from 'react-router-dom';

function SignupPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    console.log('[SignupPage] Signup success, navigating to /signin');
    navigate('/signin');
  };

  return <Signup onSuccess={handleSuccess} />;
}

export default SignupPage;
`;

/* ---------------- SIGNIN COMPONENT & PAGE WITH DEBUG ---------------- */

// components/Signin.js
const signinJsContent = `import React, { useState } from 'react';
import API from '../services/api';
import { setToken } from '../utils/auth';
import { Link } from 'react-router-dom';
import '../styles/Signin.css';

function Signin({ onSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  // Debug: log form data changes
  const handleChange = (e) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    console.log('[Signin] Updating form data:', newData);
    setFormData(newData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Signin] Form submitted with:', formData);
    setError('');

    try {
      console.log('[Signin] Sending POST request to /auth/signin...');
      const res = await API.post('/auth/signin', formData);
      console.log('[Signin] Response from /auth/signin:', res.data);

      setToken(res.data.token);
      console.log('[Signin] Token saved. Calling onSuccess()...');
      onSuccess();
    } catch (err) {
      console.error('[Signin] Error during sign in:', err);
      if (err.response) {
        console.log('[Signin] Status:', err.response.status, 'Data:', err.response.data);
      } else {
        console.log('[Signin] No response, possibly network error or server down.');
      }
      setError(err.response?.data?.error || 'Login failed.');
    }
  };

  return (
    <form className="signin-form" onSubmit={handleSubmit}>
      <h2>Sign In</h2>
      {error && <div className="error">{error}</div>}
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <button type="submit">Sign In</button>

      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          style={{
            color: '#5563DE',
            textDecoration: 'none',
            fontWeight: 'bold',
          }}
        >
          Sign Up
        </Link>
      </p>
    </form>
  );
}

export default Signin;
`;

// pages/SigninPage.js
const signinPageJsContent = `import React from 'react';
import Signin from '../components/Signin';
import { useNavigate } from 'react-router-dom';

function SigninPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    console.log('[SigninPage] Sign in success, navigating to /dashboard');
    navigate('/dashboard');
  };

  return <Signin onSuccess={handleSuccess} />;
}

export default SigninPage;
`;

/* ---------------- CLIENT DASHBOARD COMPONENT & PAGE ---------------- */

// components/ClientDashboard.js
const clientDashboardJsContent = `import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { removeToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/ClientDashboard.css';

function ClientDashboard() {
  const [message, setMessage] = useState('Loading...');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[ClientDashboard] Fetching /auth/dashboard');
        const res = await API.get('/auth/dashboard');
        console.log('[ClientDashboard] Dashboard response:', res.data);
        setMessage(res.data.message);
        setUser(res.data.user);
      } catch (err) {
        console.error('[ClientDashboard] Error fetching dashboard:', err);
        setMessage('Error fetching dashboard');
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    removeToken();
    console.log('[ClientDashboard] Logging out, removing token, navigating to /signin');
    navigate('/signin');
  };

  return (
    <div className="client-dashboard">
      <h2>{message}</h2>
      {user && (
        <div className="user-info">
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      )}
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}

export default ClientDashboard;
`;

// pages/ClientDashboardPage.js
const clientDashboardPageJsContent = `import React from 'react';
import ClientDashboard from '../components/ClientDashboard';

function ClientDashboardPage() {
  return <ClientDashboard />;
}

export default ClientDashboardPage;
`;

/* ---------------- PROTECTED ROUTE ---------------- */

// ProtectedRoute.js
const protectedRouteJsContent = `import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken } from '../utils/auth';

// If token is missing, redirect to sign in
function ProtectedRoute({ children }) {
  const isAuth = Boolean(getToken());
  if (!isAuth) {
    console.log('[ProtectedRoute] No token found, redirecting to /signin');
    return <Navigate to="/signin" />;
  }
  console.log('[ProtectedRoute] Token found, rendering child component.');
  return children;
}

export default ProtectedRoute;
`;

/* ---------------- CSS FILES ---------------- */

// Signup.css
const signupCssContent = `body {
  margin: 0;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #74ABE2, #5563DE);
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.signup-form {
  background: #fff;
  border-radius: 8px;
  padding: 30px 40px;
  box-shadow: 0px 4px 25px rgba(0,0,0,0.1);
  width: 300px;
  animation: fadeInUp 0.5s ease forwards;
}

.signup-form h2 {
  margin: 0 0 20px;
  text-align: center;
  color: #333;
  font-weight: 600;
}

.signup-form input {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ddd;
  width: 100%;
  border-radius: 4px;
  transition: border-color 0.3s;
  font-size: 14px;
}

.signup-form input:focus {
  border-color: #5563DE;
  outline: none;
}

.signup-form button {
  width: 100%;
  background: #5563DE;
  border: none;
  color: #fff;
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
  font-weight: 600;
}

.signup-form button:hover {
  background: #4451b8;
}

.error {
  color: #ff4d4d;
  margin-bottom: 10px;
  text-align: center;
  font-size: 14px;
}
`;

// Signin.css
const signinCssContent = `body {
  margin: 0;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #74ABE2, #5563DE);
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.signin-form {
  background: #fff;
  border-radius: 8px;
  padding: 30px 40px;
  box-shadow: 0px 4px 25px rgba(0,0,0,0.1);
  width: 300px;
  animation: fadeInUp 0.5s ease forwards;
}

.signin-form h2 {
  margin: 0 0 20px;
  text-align: center;
  color: #333;
  font-weight: 600;
}

.signin-form input {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ddd;
  width: 100%;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.signin-form input:focus {
  border-color: #5563DE;
  outline: none;
}

.signin-form button {
  width: 100%;
  background: #5563DE;
  border: none;
  color: #fff;
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
  font-weight: 600;
}

.signin-form button:hover {
  background: #4451b8;
}

.error {
  color: #ff4d4d;
  margin-bottom: 10px;
  text-align: center;
  font-size: 14px;
}
`;

// ClientDashboard.css
const clientDashboardCssContent = `body {
  margin: 0;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #74ABE2, #5563DE);
  min-height: 100vh;
}

.client-dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
  animation: fadeInUp 0.5s ease forwards;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.client-dashboard h2 {
  color: #fff;
  margin-bottom: 30px;
  font-weight: 600;
}

.user-info {
  background: #fff;
  border-radius: 8px;
  padding: 20px 30px;
  box-shadow: 0px 4px 25px rgba(0,0,0,0.1);
  color: #333;
  width: 300px;
  margin-bottom: 20px;
}

.user-info p {
  margin: 0 0 10px;
  line-height: 1.5;
}

.logout-button {
  background: #5563DE;
  color: #fff;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.3s;
}

.logout-button:hover {
  background: #4451b8;
}
`;

/* ---------------- CREATE DIRECTORIES ---------------- */

ensureDir('backend');
ensureDir(path.join('backend', 'config'));
ensureDir(path.join('backend', 'controllers'));
ensureDir(path.join('backend', 'models'));
ensureDir(path.join('backend', 'routes'));
ensureDir(path.join('backend', 'services'));
ensureDir(path.join('backend', 'middleware'));
ensureDir(path.join('backend', 'utils'));

ensureDir('frontend');
ensureDir(path.join('frontend', 'public'));
ensureDir(path.join('frontend', 'src'));
ensureDir(path.join('frontend', 'src', 'components'));
ensureDir(path.join('frontend', 'src', 'pages'));
ensureDir(path.join('frontend', 'src', 'services'));
ensureDir(path.join('frontend', 'src', 'styles'));
ensureDir(path.join('frontend', 'src', 'utils'));

/* ---------------- WRITE BACKEND FILES ---------------- */

fs.writeFileSync(path.join('backend', 'server.js'), serverJsContent);
fs.writeFileSync(path.join('backend', 'config', 'db.js'), dbJsContent);
fs.writeFileSync(path.join('backend', 'models', 'userModel.js'), userModelJsContent);
fs.writeFileSync(path.join('backend', 'services', 'userService.js'), userServiceJsContent);
fs.writeFileSync(path.join('backend', 'controllers', 'authController.js'), authControllerJsContent);
fs.writeFileSync(path.join('backend', 'routes', 'authRoutes.js'), authRoutesJsContent);
fs.writeFileSync(path.join('backend', 'middleware', 'authMiddleware.js'), authMiddlewareJsContent);
fs.writeFileSync(path.join('backend', 'utils', 'jwt.js'), jwtJsContent);

/* ---------------- WRITE FRONTEND FILES ---------------- */

fs.writeFileSync(path.join('frontend', 'package.json'), frontendPackageJson);
fs.writeFileSync(path.join('frontend', 'public', 'index.html'), indexHtmlContent);
fs.writeFileSync(path.join('frontend', 'src', 'index.js'), indexJsContent);
fs.writeFileSync(path.join('frontend', 'src', 'index.css'), indexCssContent);
fs.writeFileSync(path.join('frontend', 'src', 'App.js'), appJsContent);

fs.writeFileSync(path.join('frontend', 'src', 'services', 'api.js'), apiJsContent);
fs.writeFileSync(path.join('frontend', 'src', 'utils', 'auth.js'), authJsContent);

fs.writeFileSync(path.join('frontend', 'src', 'components', 'Signup.js'), signupJsContent);
fs.writeFileSync(path.join('frontend', 'src', 'pages', 'SignupPage.js'), signupPageJsContent);

fs.writeFileSync(path.join('frontend', 'src', 'components', 'Signin.js'), signinJsContent);
fs.writeFileSync(path.join('frontend', 'src', 'pages', 'SigninPage.js'), signinPageJsContent);

fs.writeFileSync(path.join('frontend', 'src', 'components', 'ClientDashboard.js'), clientDashboardJsContent);
fs.writeFileSync(path.join('frontend', 'src', 'pages', 'ClientDashboardPage.js'), clientDashboardPageJsContent);

fs.writeFileSync(path.join('frontend', 'src', 'components', 'ProtectedRoute.js'), protectedRouteJsContent);

fs.writeFileSync(path.join('frontend', 'src', 'styles', 'Signup.css'), signupCssContent);
fs.writeFileSync(path.join('frontend', 'src', 'styles', 'Signin.css'), signinCssContent);
fs.writeFileSync(path.join('frontend', 'src', 'styles', 'ClientDashboard.css'), clientDashboardCssContent);

console.log('Project structure and initial files have been created successfully!');
