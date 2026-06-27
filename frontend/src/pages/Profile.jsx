import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { User, Save, UserCheck, Calendar, BookOpen, School, Target } from 'lucide-react';

export default function Profile() {
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    branch: '',
    graduation_year: '',
    target_role_id: ''
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileAndRoles = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // 1. Fetch available career roles
        const rolesRes = await fetch('http://localhost:5000/api/skills/roles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const rolesData = await rolesRes.json();
        setRoles(rolesData);

        // 2. Fetch user profile
        const profileRes = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();

        if (!profileRes.ok) throw new Error(profileData.message);

        setFormData({
          name: profileData.name || '',
          college: profileData.college || '',
          branch: profileData.branch || '',
          graduation_year: profileData.graduation_year || '',
          target_role_id: profileData.target_role_id || ''
        });

      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Could not retrieve user profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndRoles();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setMessage('Profile settings updated successfully!');
      
      // Update local storage user information to keep sidebar synced
      localStorage.setItem('user', JSON.stringify(data.user));

      // Update form state with new DB returned fields
      setFormData({
        name: data.user.name,
        college: data.user.college,
        branch: data.user.branch,
        graduation_year: data.user.graduation_year,
        target_role_id: data.user.target_role_id || ''
      });

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Error occurred while saving profile details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
        <Sidebar />
        <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: '#ff9900', fontWeight: '600' }}>Loading Profile Setup...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Profile Settings</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '4px' }}>
            Modify your user details and choose a target career path to analyze skill alignments.
          </p>
        </header>

        {message && (
          <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '500' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <div className="dashboard-grid">
          <div className="col-8 card">
            <h3 className="card-title">
              <UserCheck size={18} style={{ color: '#ff9900' }} />
              Manage Student Details
            </h3>

            <form onSubmit={handleProfileUpdate} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: '#64748b' }} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="John Doe"
                    style={{ paddingLeft: '44px' }}
                    disabled={saving}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">College / University</label>
                  <div style={{ position: 'relative' }}>
                    <School size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: '#64748b' }} />
                    <input
                      type="text"
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="State University"
                      style={{ paddingLeft: '44px' }}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Branch / Specialization</label>
                  <div style={{ position: 'relative' }}>
                    <BookOpen size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: '#64748b' }} />
                    <input
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Computer Science"
                      style={{ paddingLeft: '44px' }}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Graduation Year</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: '#64748b' }} />
                    <input
                      type="number"
                      name="graduation_year"
                      value={formData.graduation_year}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="2027"
                      style={{ paddingLeft: '44px' }}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Career Role</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      name="target_role_id"
                      value={formData.target_role_id}
                      onChange={handleChange}
                      className="form-select"
                      disabled={saving}
                    >
                      <option value="">-- Select Target Career Role --</option>
                      {roles.map(r => (
                        <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ gap: '6px', padding: '12px 24px', marginTop: '10px' }} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving Profile...' : 'Save Profile Settings'}
              </button>
            </form>
          </div>

          <div className="col-4 card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 className="card-title">
              <Target size={18} style={{ color: '#0ea5e9' }} />
              Role Guidance Notes
            </h3>

            <div style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '14px', lineHeight: 1.5 }}>
              <p>
                <strong>Software Development Engineer (SDE)</strong> focuses on solid algorithm foundations (DSA) and building application frameworks.
              </p>
              <p>
                <strong>Java Backend Developer</strong> requires enterprise frameworks like Spring Boot, database ORMs (Hibernate), and secure microservices.
              </p>
              <p>
                <strong>AWS DevOps Engineer</strong> involves infrastructure provisioning (Terraform), virtual containers (Docker), and automated CodePipelines.
              </p>
              <p>
                <strong>Cloud Engineer</strong> deals with secure cloud infrastructure networkings, Docker containers orchestrations, and linux servers.
              </p>
              <p>
                <strong>Data Analyst</strong> is centered around parsing tables, computing statistics, databases (SQL), and visualizations (Tableau/Excel).
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
