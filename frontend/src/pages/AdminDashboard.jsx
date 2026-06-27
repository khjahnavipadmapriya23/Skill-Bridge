import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Users, FileText, Settings, Award, Plus, Trash2, Edit2, LogOut, Check, X, ShieldAlert } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [rolesSkills, setRolesSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Role Editor state
  const [isEditing, setIsEditing] = useState(false); // false = viewing/creating, true = editing existing
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleNameInput, setRoleNameInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : {};

  const fetchAdminData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // 1. Fetch analytics
      const statsRes = await fetch('http://localhost:5000/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (!statsRes.ok) throw new Error(statsData.message);
      setStats(statsData);

      // 2. Fetch roles config
      const rolesRes = await fetch('http://localhost:5000/api/admin/roles-skills', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rolesData = await rolesRes.json();
      setRolesSkills(rolesData);

      // 3. Fetch all skills list
      const skillsRes = await fetch('http://localhost:5000/api/skills', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const skillsData = await skillsRes.json();
      setAllSkills(skillsData);

    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Could not retrieve administrator dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleSkillToggle = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter(id => id !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  const handleResetEditor = () => {
    setIsEditing(false);
    setEditingRoleId(null);
    setRoleNameInput('');
    setSelectedSkills([]);
  };

  const handleLoadEdit = (roleObj) => {
    setIsEditing(true);
    setEditingRoleId(roleObj.role_id);
    setRoleNameInput(roleObj.role_name);
    setSelectedSkills(roleObj.skills.map(s => s.id));
    setMessage('');
    setError('');
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleNameInput || selectedSkills.length === 0) {
      setError('Role name and at least one required skill are required.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setError('');
    setMessage('');

    try {
      const url = isEditing 
        ? `http://localhost:5000/api/admin/roles/${editingRoleId}` 
        : 'http://localhost:5000/api/admin/roles';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role_name: roleNameInput, skillIds: selectedSkills })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message);

      setMessage(isEditing ? 'Target career role updated successfully!' : 'Target career role created successfully!');
      handleResetEditor();
      await fetchAdminData();

    } catch (err) {
      console.error('Error saving role:', err);
      setError(err.message || 'Error occurred while saving target career role.');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this target career role? All linked student references will be cleared.')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setError('');
    setMessage('');

    try {
      const response = await fetch(`http://localhost:5000/api/admin/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message);

      setMessage('Target career role deleted successfully.');
      handleResetEditor();
      await fetchAdminData();

    } catch (err) {
      console.error('Error deleting role:', err);
      setError(err.message || 'Error occurred while deleting career role.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: '#ff9900', fontWeight: '600' }}>Accessing Admin Portal...</div>
      </div>
    );
  }

  const platform = stats?.platformStats || {
    totalStudents: 0, totalResumes: 0, totalDsa: 0, totalProjects: 0, totalCerts: 0, totalMocks: 0, averageReadiness: 0
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc' }}>
      {/* Admin Navbar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: '#0c111d'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: '800' }}>
          <Target style={{ color: '#ff9900' }} />
          <span>SkillBridge <span className="badge badge-warning" style={{ marginLeft: '6px' }}>Admin Portal</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Administrator: <strong>{user.name}</strong></span>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', gap: '6px', fontSize: '0.85rem' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Admin Content */}
      <main style={{ padding: '40px' }}>
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Platform Analytics & Config</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '4px' }}>
            Manage the career roles matrices, configure skill requirements, and track overall student readiness statistics.
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

        {/* Platform Stat Cards */}
        <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
          <div className="col-3 card metric-card">
            <div>
              <span className="metric-label">Registered Students</span>
              <div className="metric-value">{platform.totalStudents}</div>
            </div>
            <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
              <Users size={22} />
            </div>
          </div>

          <div className="col-3 card metric-card">
            <div>
              <span className="metric-label">Average Readiness</span>
              <div className="metric-value" style={{ color: '#ff9900' }}>{platform.averageReadiness}%</div>
            </div>
            <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 153, 0, 0.1)', color: '#ff9900' }}>
              <Award size={22} />
            </div>
          </div>

          <div className="col-3 card metric-card">
            <div>
              <span className="metric-label">Resumes Synced</span>
              <div className="metric-value">{platform.totalResumes}</div>
            </div>
            <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <FileText size={22} />
            </div>
          </div>

          <div className="col-3 card metric-card">
            <div>
              <span className="metric-label">DSA Solved (All)</span>
              <div className="metric-value">{platform.totalDsa}</div>
            </div>
            <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <Settings size={22} />
            </div>
          </div>
        </div>

        {/* Split Grid for Management and Analytics */}
        <div className="dashboard-grid">
          {/* Target Roles Configuration Panel */}
          <div className="col-8 card">
            <h3 className="card-title">
              <Settings size={18} style={{ color: '#ff9900' }} />
              Manage Target Career Roles
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Configure target job profiles and specify which core technical competencies are required.
            </p>

            <div className="table-container" style={{ marginBottom: '30px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Target Role Name</th>
                    <th>Required Competencies</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rolesSkills.map((r) => (
                    <tr key={r.role_id}>
                      <td>
                        <strong style={{ color: '#f8fafc' }}>{r.role_name}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '400px' }}>
                          {r.skills.map(s => (
                            <span key={s.id} className="badge badge-info" style={{ fontSize: '0.72rem' }}>{s.name}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button onClick={() => handleLoadEdit(r)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', gap: '4px' }}>
                            <Edit2 size={12} /> Edit
                          </button>
                          <button onClick={() => handleDeleteRole(r.role_id)} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.8rem', gap: '4px' }}>
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dynamic Role Creator/Editor Form */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isEditing ? <Edit2 size={16} style={{ color: '#ff9900' }} /> : <Plus size={18} style={{ color: '#ff9900' }} />}
                {isEditing ? 'Edit Target Career Role Matrix' : 'Create New Target Career Role'}
              </h4>

              <form onSubmit={handleSaveRole}>
                <div className="form-group">
                  <label className="form-label">Role Name</label>
                  <input
                    type="text"
                    value={roleNameInput}
                    onChange={(e) => setRoleNameInput(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Frontend Development Engineer"
                    style={{ maxWidth: '400px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '12px' }}>Map Required Technical Skills</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', backgroundColor: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {allSkills.map(skill => {
                      const isChecked = selectedSkills.includes(skill.skill_id);
                      return (
                        <label key={skill.skill_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', color: isChecked ? 'white' : '#94a3b8' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleSkillToggle(skill.skill_id)}
                            style={{ accentColor: '#ff9900' }}
                          />
                          <span>{skill.skill_name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="submit" className="btn btn-primary" style={{ gap: '4px', fontSize: '0.88rem' }}>
                    <Check size={14} /> {isEditing ? 'Update Role Matrix' : 'Create Role Matrix'}
                  </button>
                  {isEditing && (
                    <button type="button" onClick={handleResetEditor} className="btn btn-secondary" style={{ gap: '4px', fontSize: '0.88rem' }}>
                      <X size={14} /> Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Student Analytics & Demographics */}
          <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Branch Distribution */}
            <div className="card">
              <h3 className="card-title">
                <Users size={16} style={{ color: '#0ea5e9' }} />
                Branch Enrollment
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                {stats?.branchDistribution && stats.branchDistribution.length > 0 ? (
                  stats.branchDistribution.map((branch, i) => (
                    <div key={i} style={{ fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{branch.branch}</span>
                        <strong>{branch.count} student(s)</strong>
                      </div>
                      <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.round((branch.count / platform.totalStudents) * 100)}%`,
                          backgroundColor: '#0ea5e9'
                        }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No student branches logged yet.</p>
                )}
              </div>
            </div>

            {/* College Placement Counts */}
            <div className="card">
              <h3 className="card-title">
                <Users size={16} style={{ color: '#10b981' }} />
                College Statistics
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                {stats?.collegeDistribution && stats.collegeDistribution.length > 0 ? (
                  stats.collegeDistribution.map((col, i) => (
                    <div key={i} style={{ fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>{col.college}</span>
                        <strong>{col.count}</strong>
                      </div>
                      <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.round((col.count / platform.totalStudents) * 100)}%`,
                          backgroundColor: '#10b981'
                        }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No student colleges registered.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
