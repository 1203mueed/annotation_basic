import React, { useState } from 'react';
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
