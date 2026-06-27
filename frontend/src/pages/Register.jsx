import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, User, Mail, Lock, School, BookOpen, Calendar, ArrowRight } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    branch: '',
    graduation_year: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, email, password, college, branch, graduation_year } = formData;
    
    if (!name || !email || !password || !college || !branch || !graduation_year) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.05) 0%, transparent 60%), #0f172a'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Target size={28} style={{ color: '#0ea5e9' }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', textAlign: 'center' }}>Create Account</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '6px' }}>Join SkillBridge to track your skills gaps</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: '#64748b' }} />
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                style={{ paddingLeft: '44px' }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: '#64748b' }} />
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="john.doe@college.edu"
                value={formData.email}
                onChange={handleChange}
                style={{ paddingLeft: '44px' }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: '#64748b' }} />
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                style={{ paddingLeft: '44px' }}
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">College Name</label>
              <div style={{ position: 'relative' }}>
                <School size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: '#64748b' }} />
                <input
                  type="text"
                  name="college"
                  className="form-input"
                  placeholder="State University"
                  value={formData.college}
                  onChange={handleChange}
                  style={{ paddingLeft: '44px' }}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Branch / Major</label>
              <div style={{ position: 'relative' }}>
                <BookOpen size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: '#64748b' }} />
                <input
                  type="text"
                  name="branch"
                  className="form-input"
                  placeholder="Computer Science"
                  value={formData.branch}
                  onChange={handleChange}
                  style={{ paddingLeft: '44px' }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Graduation Year</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: '#64748b' }} />
                <input
                  type="number"
                  name="graduation_year"
                  className="form-input"
                  placeholder="2027"
                  value={formData.graduation_year}
                  onChange={handleChange}
                  style={{ paddingLeft: '44px' }}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Account Role</label>
              <select
                name="role"
                className="form-select"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Creating...' : 'Register'} <ArrowRight size={16} />
          </button>
        </form>

        <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem', marginTop: '24px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#ff9900', textDecoration: 'none', fontWeight: '600' }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
