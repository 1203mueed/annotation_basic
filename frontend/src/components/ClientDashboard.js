// frontend/src/components/ClientDashboard.js
import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { removeToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/ClientDashboard.css';
import RequestAnnotationForm from './RequestAnnotationForm';

function ClientDashboard() {
  const [message, setMessage] = useState('Loading...');
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);

  // Controls whether we show the "Request Annotation" form
  const [showRequestForm, setShowRequestForm] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
    fetchRequests();
    fetchProjects();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await API.get('/auth/dashboard');
      setMessage(res.data.message);
      setUser(res.data.user);
    } catch (err) {
      console.error('[ClientDashboard] Error fetching dashboard:', err);
      setMessage('Error fetching dashboard');
    }
  }

  async function fetchRequests() {
    try {
      const res = await API.get('/auth/requests');
      setRequests(res.data.requests);
    } catch (err) {
      console.error('[ClientDashboard] Error fetching requests:', err);
    }
  }

  async function fetchProjects() {
    try {
      const res = await API.get('/auth/projects');
      setProjects(res.data.projects);
    } catch (err) {
      console.error('[ClientDashboard] Error fetching projects:', err);
    }
  }

  const handleLogout = () => {
    removeToken();
    navigate('/signin');
  };

  const handleRequestAnnotation = () => {
    setShowRequestForm(true);
  };

  const handleRequestFormClose = () => {
    setShowRequestForm(false);
    // Optionally refetch requests if a new one was created
    fetchRequests();
  };

  return (
    <div>
      {/* Top Navbar */}
      <div className="navbar">
        <h2>Annotation Platform</h2>
        <div className="navbar-right">
          {user && <span>{user.name} ({user.email})</span>}
          <button 
            className="request-annotation-button"
            onClick={handleRequestAnnotation}
          >
            Request Annotation
          </button>
          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-summary">
          <h2>{message}</h2>
        </div>

        {/* Grid layout for requests and projects */}
        <div className="dashboard-grid">
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

      {/* Conditional rendering of the Request Annotation Form (Modal or inline) */}
      {showRequestForm && (
        <RequestAnnotationForm onClose={handleRequestFormClose} />
      )}
    </div>
  );
}

export default ClientDashboard;
