import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Target, LayoutDashboard, Compass, CheckSquare, FileText, Award, User, LogOut, Flame } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { name: 'Student', streak: 0 };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <Target style={{ color: '#ff9900' }} />
        <span>Skill<span className="brand-orange">Bridge</span></span>
      </div>

      <ul className="nav-links">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/skill-gap" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Compass size={20} />
            <span>Skill Gap</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/tracker" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <CheckSquare size={20} />
            <span>Placement Tracker</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/resume" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            <span>Resume Sync</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/leaderboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Award size={20} />
            <span>Leaderboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <User size={20} />
            <span>Profile</span>
          </NavLink>
        </li>
      </ul>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingLeft: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
          <Flame size={18} style={{ color: '#ff9900', fill: '#ff9900' }} />
          <span>Active Streak: <strong style={{ color: '#f8fafc' }}>{user.streak || 0} days</strong></span>
        </div>
        <div style={{ padding: '0 8px', fontSize: '0.9rem', fontWeight: '600', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '12px' }}>
          {user.name}
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', gap: '8px', padding: '10px' }}>
          <LogOut size={16} /> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
