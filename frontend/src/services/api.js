import axios from 'axios';

// Adjust baseURL if your backend runs on a different port or IP
const API = axios.create({
  baseURL: 'http://localhost:5000/api', 
});

// Intercept requests to attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
