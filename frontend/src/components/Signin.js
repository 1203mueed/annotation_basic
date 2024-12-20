// frontend/src/components/Signin.js
import React, { useState } from 'react';
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
