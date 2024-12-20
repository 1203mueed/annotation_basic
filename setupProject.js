const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/* ---------------- BACKEND FILE CONTENTS ---------------- */
const serverJsContent = `const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

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

const userModelJsContent = `const pool = require('../config/db');

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

module.exports = {
  findUserByEmail,
  createUser
};
`;

const userServiceJsContent = `const bcrypt = require('bcrypt');
const { findUserByEmail, createUser } = require('../models/userModel');
const { signToken } = require('../utils/jwt');

async function registerUser(name, email, password) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already in use.');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await createUser(name, email, passwordHash);
  return newUser;
}

async function loginUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) throw new Error('Invalid email or password.');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error('Invalid email or password.');

  const token = signToken({ id: user.id, email: user.email, role_id: user.role_id });
  return { user, token };
}

module.exports = {
  registerUser,
  loginUser
};
`;

const authControllerJsContent = `const { registerUser, loginUser } = require('../services/userService');

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
  res.json({ message: \`Welcome to your dashboard, user #\${req.user.id}\` });
}

module.exports = {
  signup,
  signin,
  dashboard
};
`;

const authRoutesJsContent = `const express = require('express');
const router = express.Router();
const { signup, signin, dashboard } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/dashboard', verifyToken, dashboard);

module.exports = router;
`;

const authMiddlewareJsContent = `const { verifyToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided.' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token.' });
  }
}

module.exports = { verifyToken: authMiddleware };
`;

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

const indexCssContent = `body {
  margin: 0;
  font-family: Arial, sans-serif;
}
`;

const appJsContent = `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignupPage from './pages/SignupPage';
import SigninPage from './pages/SigninPage';
import DashboardPage from './pages/DashboardPage';
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
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<SigninPage />} />
      </Routes>
    </Router>
  );
}

export default App;
`;

const apiJsContent = `import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

export default API;
`;

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

const signupJsContent = `import React, { useState } from 'react';
import API from '../services/api';
import '../styles/Signup.css';

function Signup({ onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/auth/signup', formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed.');
    }
  };

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <h2>Sign Up</h2>
      {error && <div className="error">{error}</div>}
      <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
      <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
      <button type="submit">Sign Up</button>
    </form>
  );
}

export default Signup;
`;

const signinJsContent = `import React, { useState } from 'react';
import API from '../services/api';
import { setToken } from '../utils/auth';
import { Link } from 'react-router-dom';
import '../styles/Signin.css';

function Signin({ onSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.post('/auth/signin', formData);
      setToken(res.data.token);
      onSuccess(); 
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    }
  };

  return (
    <form className="signin-form" onSubmit={handleSubmit}>
      <h2>Sign In</h2>
      {error && <div className="error">{error}</div>}
      <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
      <button type="submit">Sign In</button>

      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Don't have an account? <Link to="/signup" style={{ color: '#5563DE', textDecoration: 'none', fontWeight: 'bold' }}>Sign Up</Link>
      </p>
    </form>
  );
}

export default Signin;
`;

const dashboardJsContent = `import React, { useEffect, useState } from 'react';
import API from '../services/api';
import '../styles/Dashboard.css';
import { removeToken } from '../utils/auth'; 
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [message, setMessage] = useState('Loading...');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get('/auth/dashboard');
        setMessage(res.data.message);
      } catch (err) {
        setMessage('Error fetching dashboard');
      }
    };
    fetchDashboard();
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate('/signin');
  };

  return (
    <div className="dashboard">
      <h2>{message}</h2>
      <button onClick={handleLogout} style={{
        marginTop: '20px', 
        padding: '10px 20px', 
        background:'#5563DE', 
        color:'#fff', 
        border:'none', 
        borderRadius:'4px', 
        cursor:'pointer'
      }}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
`;

const protectedRouteJsContent = `import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken } from '../utils/auth';

function ProtectedRoute({ children }) {
  const isAuth = Boolean(getToken());
  return isAuth ? children : <Navigate to="/signin" />;
}

export default ProtectedRoute;
`;

const signupPageJsContent = `import React from 'react';
import Signup from '../components/Signup';
import { useNavigate } from 'react-router-dom';

function SignupPage() {
  const navigate = useNavigate();
  const handleSuccess = () => {
    navigate('/signin');
  };
  return <Signup onSuccess={handleSuccess} />;
}

export default SignupPage;
`;

const signinPageJsContent = `import React from 'react';
import Signin from '../components/Signin';
import { useNavigate } from 'react-router-dom';

function SigninPage() {
  const navigate = useNavigate();
  const handleSuccess = () => {
    navigate('/dashboard');
  };
  return <Signin onSuccess={handleSuccess} />;
}

export default SigninPage;
`;

const dashboardPageJsContent = `import React from 'react';
import Dashboard from '../components/Dashboard';

function DashboardPage() {
  return <Dashboard />;
}

export default DashboardPage;
`;

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

const dashboardCssContent = `.dashboard {
  text-align: center;
  margin-top: 50px;
}`;


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
fs.writeFileSync(path.join('frontend', 'src', 'components', 'Signin.js'), signinJsContent);
fs.writeFileSync(path.join('frontend', 'src', 'components', 'Dashboard.js'), dashboardJsContent);
fs.writeFileSync(path.join('frontend', 'src', 'components', 'ProtectedRoute.js'), protectedRouteJsContent);

fs.writeFileSync(path.join('frontend', 'src', 'pages', 'SignupPage.js'), signupPageJsContent);
fs.writeFileSync(path.join('frontend', 'src', 'pages', 'SigninPage.js'), signinPageJsContent);
fs.writeFileSync(path.join('frontend', 'src', 'pages', 'DashboardPage.js'), dashboardPageJsContent);

fs.writeFileSync(path.join('frontend', 'src', 'styles', 'Signup.css'), signupCssContent);
fs.writeFileSync(path.join('frontend', 'src', 'styles', 'Signin.css'), signinCssContent);
fs.writeFileSync(path.join('frontend', 'src', 'styles', 'Dashboard.css'), dashboardCssContent);

console.log('Project structure and initial files have been created successfully!');
