import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Dynamic API interceptor for local vs production routing
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  if (typeof url === 'string' && url.startsWith('http://localhost:5000/api')) {
    const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : '/api';
    url = url.replace('http://localhost:5000/api', apiBase);
  }
  return originalFetch(url, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
