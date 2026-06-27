import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { CircularGauge } from '../components/SVGCharts';
import { Award, Compass, FileText, ChevronRight, Activity, Terminal, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [gapData, setGapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : {};

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Fetch placement and readiness metrics
        const placementRes = await fetch('http://localhost:5000/api/placement', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const placementData = await placementRes.json();
        
        if (!placementRes.ok) throw new Error(placementData.message);
        setData(placementData);

        // Fetch skill gap metrics
        const gapRes = await fetch('http://localhost:5000/api/skills/gap', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const skillGapData = await gapRes.json();
        setGapData(skillGapData);

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Could not retrieve dashboard information.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
        <Sidebar />
        <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: '#ff9900', fontWeight: '600' }}>Syncing Cloud Dashboard...</div>
        </div>
      </div>
    );
  }

  const readinessScore = data?.readinessScore || 0;
  const matchPct = gapData?.hasTargetRole ? gapData.matchPercentage : 0;
  const targetRole = gapData?.hasTargetRole ? gapData.targetRoleName : 'No target career role set';

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {/* Top Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Hello, {user.name}</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '4px' }}>
              Target Role: <strong style={{ color: '#ff9900' }}>{targetRole}</strong> | {user.college} &bull; {user.branch}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/tracker')} className="btn btn-secondary">
              Update Counters
            </button>
            <button onClick={() => navigate('/skill-gap')} className="btn btn-primary">
              Run Skill Analyzer
            </button>
          </div>
        </header>

        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '500' }}>
            {error}
          </div>
        )}

        {/* Activity heatmap removed from main dashboard, moved to Leaderboard -> Consistency */}

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Gauges */}
          <div className="col-4 card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <CircularGauge value={readinessScore} size={160} color="#0ea5e9" label="Readiness" />
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', marginTop: '16px', lineHeight: 1.4 }}>
              Placement Readiness Score combines DSA progress, projects, certifications, mock interviews, and skill matching.
            </p>
          </div>

          <div className="col-4 card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <CircularGauge value={matchPct} size={160} color="#ff9900" label="Skill Match" />
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', marginTop: '16px', lineHeight: 1.4 }}>
              Target Role Skill Match Score determines overlap between your acquired skills and role requirements.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card metric-card" style={{ padding: '16px 24px' }}>
              <div>
                <span className="metric-label">DSA Progress</span>
                <div className="metric-value">{data?.metrics?.dsaCount || 0}</div>
                <div style={{ width: '150px', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(((data?.metrics?.dsaCount || 0) / 300) * 100, 100)}%`, backgroundColor: '#0ea5e9' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>Target: 300 problems</span>
              </div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                <Award size={24} />
              </div>
            </div>

            <div className="card metric-card" style={{ padding: '16px 24px' }}>
              <div>
                <span className="metric-label">Projects Completed</span>
                <div className="metric-value">{data?.metrics?.projectsCount || 0} / 3</div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>Weight: 25% of total score</span>
              </div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <Compass size={24} />
              </div>
            </div>

            <div className="card metric-card" style={{ padding: '16px 24px' }}>
              <div>
                <span className="metric-label">Resume Sync Status</span>
                <div className="metric-value" style={{ fontSize: '1.4rem', color: data?.metrics?.resumeStatus === 'Uploaded' ? '#10b981' : '#ef4444' }}>
                  {data?.metrics?.resumeStatus || 'Not Uploaded'}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>Automated keyword scan</span>
              </div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: data?.metrics?.resumeStatus === 'Uploaded' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: data?.metrics?.resumeStatus === 'Uploaded' ? '#10b981' : '#ef4444' }}>
                <FileText size={24} />
              </div>
            </div>
          </div>

          {/* Missing Skills Section */}
          <div className="col-8 card">
            <h3 className="card-title">
              <Terminal size={18} style={{ color: '#ff9900' }} />
              Missing Career Skill Targets
            </h3>
            {gapData?.hasTargetRole ? (
              <div>
                {gapData.missingSkills && gapData.missingSkills.length > 0 ? (
                  <>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
                      To align fully with the <strong style={{ color: '#ff9900' }}>{gapData.targetRoleName}</strong> requirements, acquire the following missing competencies:
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                      {gapData.missingSkills.map((skill, index) => (
                        <span key={index} className="badge badge-danger" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                    <button onClick={() => navigate('/skill-gap')} className="btn btn-secondary" style={{ gap: '4px', fontSize: '0.85rem' }}>
                      Open Gap Analyzer & View Learning Path <ChevronRight size={16} />
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', background: 'rgba(16, 185, 129, 0.08)', padding: '16px', borderRadius: '8px' }}>
                    <ShieldCheck size={20} />
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Congratulations! You match 100% of the skills required for {gapData.targetRoleName}!</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '0.9rem' }}>No target career role has been selected yet. Select a target role to perform analysis.</p>
                <button onClick={() => navigate('/profile')} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>Select Target Role</button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="col-4 card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title">
              <Activity size={18} style={{ color: '#0ea5e9' }} />
              Recent Logs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.map((act, index) => (
                  <div key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '12px' }}>
                    <p style={{ fontSize: '0.88rem', color: '#f8fafc', fontWeight: '500' }}>{act.activity_text}</p>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', margin: 'auto 0' }}>
                  No recent activities logged yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
