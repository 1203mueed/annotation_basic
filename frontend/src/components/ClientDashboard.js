// frontend/src/components/ClientDashboard.js
import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { removeToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/ClientDashboard.css';

function ClientDashboard() {
  const [message, setMessage] = useState('Loading...');
  const [user, setUser] = useState(null);

  // State for requests and projects
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    // 1) Fetch the basic dashboard info (e.g., user data, welcome msg).
    const fetchDashboard = async () => {
      try {
        const res = await API.get('/auth/dashboard');
        setMessage(res.data.message);
        setUser(res.data.user);
      } catch (err) {
        console.error('[ClientDashboard] Error fetching dashboard:', err);
        setMessage('Error fetching dashboard');
      }
    };

    // 2) Fetch all requests
    const fetchRequests = async () => {
      try {
        const res = await API.get('/auth/requests');
        setRequests(res.data.requests);
      } catch (err) {
        console.error('[ClientDashboard] Error fetching requests:', err);
      }
    };

    // 3) Fetch all projects
    const fetchProjects = async () => {
      try {
        const res = await API.get('/auth/projects');
        setProjects(res.data.projects);
      } catch (err) {
        console.error('[ClientDashboard] Error fetching projects:', err);
      }
    };

    fetchDashboard();
    fetchRequests();
    fetchProjects();
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate('/signin');
  };

  return (
    <div className="client-dashboard">
      <div className="dashboard-header">
        <h2>{message}</h2>
        {user && (
          <div className="dashboard-user-info">
            <span>{user.name} ({user.email})</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        )}
      </div>

      <div className="dashboard-content">
        {/* Requests Table */}
        <div className="dashboard-section">
          <h3>All Requests</h3>
          <div className="table-wrapper">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Delivery Type</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.id}</td>
                    <td>{req.client_name}</td>
                    <td>{req.description || 'N/A'}</td>
                    <td>{req.status}</td>
                    <td>{req.delivery_type}</td>
                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Projects Table */}
        <div className="dashboard-section">
          <h3>All Projects</h3>
          <div className="table-wrapper">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Project Manager</th>
                  <th>Status</th>
                  <th>Completion %</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => (
                  <tr key={proj.id}>
                    <td>{proj.id}</td>
                    <td>{proj.project_manager_name || 'Unassigned'}</td>
                    <td>{proj.status}</td>
                    <td>{proj.completion_percentage}%</td>
                    <td>{new Date(proj.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;
