import React, { useState } from 'react';
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
