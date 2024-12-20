// frontend/src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
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
      <button onClick={handleLogout} style={{marginTop: '20px', padding: '10px 20px', background:'#5563DE', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer'}}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
