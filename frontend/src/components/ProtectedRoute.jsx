import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  
  if (!token || !userJson) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userJson);
    if (requireAdmin && user.role !== 'admin') {
      // If admin is required but user is a student, redirect to student dashboard
      return <Navigate to="/dashboard" replace />;
    }
  } catch (e) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return children;
}
