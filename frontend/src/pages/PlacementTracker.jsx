import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { CircularGauge, ReadinessBarChart } from '../components/SVGCharts';
import { CheckSquare, Save, Flame, ShieldAlert, Award } from 'lucide-react';

export default function PlacementTracker() {
  const [formData, setFormData] = useState({
    dsaCount: 0,
    projectsCount: 0,
    certificationsCount: 0,
    mockInterviews: 0
  });
  const [readinessScore, setReadinessScore] = useState(0);
  const [breakdown, setBreakdown] = useState(null);
  const [skillMatchPct, setSkillMatchPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [todayUpdate, setTodayUpdate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [allSkills, setAllSkills] = useState([]);
  const [dailyForm, setDailyForm] = useState({
    problems_solved: 0,
    topics_learned: '',
    skills_updated: [],
    notes: ''
  });
  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // 1. Fetch placement metrics
      const response = await fetch('http://localhost:5000/api/placement', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setFormData({
        dsaCount: data.metrics.dsaCount,
        projectsCount: data.metrics.projectsCount,
        certificationsCount: data.metrics.certificationsCount,
        mockInterviews: data.metrics.mockInterviews
      });
      setReadinessScore(data.readinessScore);
      setBreakdown(data.readinessBreakdown);
      setSkillMatchPct(data.skillMatchPct || 0);

      // 2. Fetch today's check-in status
      const todayRes = await fetch('http://localhost:5000/api/daily-updates/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const todayData = await todayRes.json();
      
      if (todayRes.ok && todayData) {
        setTodayUpdate(todayData);
        
        let parsedTopics = '';
        try {
          const parsed = JSON.parse(todayData.topics_learned);
          parsedTopics = Array.isArray(parsed) ? parsed.join(', ') : todayData.topics_learned;
        } catch (e) {
          parsedTopics = todayData.topics_learned || '';
        }

        let parsedSkills = [];
        try {
          const parsed = JSON.parse(todayData.skills_updated);
          parsedSkills = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          parsedSkills = [];
        }

        setDailyForm({
          problems_solved: todayData.problems_solved,
          topics_learned: parsedTopics,
          skills_updated: parsedSkills,
          notes: todayData.notes || ''
        });
      } else {
        setTodayUpdate(null);
      }

      // 3. Fetch all skills list
      const skillsRes = await fetch('http://localhost:5000/api/skills', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const skillsData = await skillsRes.json();
      if (skillsRes.ok) {
        setAllSkills(skillsData);
      }

    } catch (err) {
      console.error('Error fetching placement stats:', err);
      setError('Could not retrieve preparation statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const rawVal = e.target.value;
    setFormData({ ...formData, [e.target.name]: rawVal });
  };

  const handleIncrement = (name, maxVal = 9999) => {
    setFormData(prev => {
      const current = parseInt(prev[name]) || 0;
      return {
        ...prev,
        [name]: Math.min(current + 1, maxVal)
      };
    });
  };

  const handleDecrement = (name) => {
    setFormData(prev => {
      const current = parseInt(prev[name]) || 0;
      return {
        ...prev,
        [name]: Math.max(current - 1, 0)
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const parsedData = {
        dsaCount: parseInt(formData.dsaCount) || 0,
        projectsCount: parseInt(formData.projectsCount) || 0,
        certificationsCount: parseInt(formData.certificationsCount) || 0,
        mockInterviews: parseInt(formData.mockInterviews) || 0
      };

      const response = await fetch('http://localhost:5000/api/placement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(parsedData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setMessage('Placement logs updated successfully!');
      setReadinessScore(data.readinessScore);
      
      // Re-fetch to get fresh breakdown calculations
      await fetchData();

    } catch (err) {
      console.error('Error updating placement metrics:', err);
      setError(err.message || 'Error occurred while saving progress logs.');
    } finally {
      setSaving(false);
    }
  };

  const handleDailySubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const parsedForm = {
        ...dailyForm,
        problems_solved: parseInt(dailyForm.problems_solved) || 0
      };

      const response = await fetch('http://localhost:5000/api/daily-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(parsedForm)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setMessage('Daily updates submitted and consistency streak updated!');
      setShowModal(false);
      
      // Refresh stats
      await fetchData();

    } catch (err) {
      console.error('Error submitting daily update:', err);
      setError(err.message || 'Error occurred while saving your daily updates.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
        <Sidebar />
        <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: '#ff9900', fontWeight: '600' }}>Loading Placement Tracker...</div>
        </div>
      </div>
    );
  }

  // Target goals
  const dsaTarget = 300;
  const projectTarget = 3;
  const mockTarget = 3;
  const certTarget = 2;

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Placement Tracker</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '4px' }}>
            Log preparation metrics to compute your real-time campus Readiness Score.
          </p>
        </header>

        {/* Daily Update Warning / Confirmation Banners */}
        {!todayUpdate ? (
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            color: '#f59e0b',
            padding: '16px 20px',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={20} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Daily Update Pending!</strong>
                <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>You haven't logged your daily check-in yet today. Submit today's update to maintain your streak and light up your leaderboard heatmap!</span>
              </div>
            </div>
            <button
              onClick={() => { setError(''); setMessage(''); setShowModal(true); }}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#0f172a' }}
            >
              Log Today's Update
            </button>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            padding: '16px 20px',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={20} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Daily Update Submitted!</strong>
                <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>You solved {todayUpdate.problems_solved} problems and logged your topics. Your consistency streak is secure!</span>
              </div>
            </div>
            <button
              onClick={() => { setError(''); setMessage(''); setShowModal(true); }}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              Edit Today's Log
            </button>
          </div>
        )}

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
          {/* Left Column: Form Counters */}
          <div className="col-6 card">
            <h3 className="card-title">
              <CheckSquare size={18} style={{ color: '#ff9900' }} />
              Log Preparation Progress
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '24px' }}>
              Keep these values accurate to ensure your campus profile is placement-ready.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* DSA Problems */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>DSA Problems Solved</h4>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Target: {dsaTarget} problems (leetcode, gfg, etc.)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={() => handleDecrement('dsaCount')} className="btn btn-secondary" style={{ padding: '6px 12px' }}>-</button>
                  <input
                    type="number"
                    name="dsaCount"
                    value={formData.dsaCount}
                    onChange={handleInputChange}
                    style={{ width: '70px', textAlign: 'center', padding: '6px', border: '1px solid var(--border)', background: '#0f172a', color: 'white', borderRadius: '4px' }}
                  />
                  <button type="button" onClick={() => handleIncrement('dsaCount')} className="btn btn-secondary" style={{ padding: '6px 12px' }}>+</button>
                </div>
              </div>

              {/* Projects */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Projects Completed</h4>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Target: {projectTarget} production-grade projects</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={() => handleDecrement('projectsCount')} className="btn btn-secondary" style={{ padding: '6px 12px' }}>-</button>
                  <input
                    type="number"
                    name="projectsCount"
                    value={formData.projectsCount}
                    onChange={handleInputChange}
                    style={{ width: '70px', textAlign: 'center', padding: '6px', border: '1px solid var(--border)', background: '#0f172a', color: 'white', borderRadius: '4px' }}
                  />
                  <button type="button" onClick={() => handleIncrement('projectsCount', 50)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>+</button>
                </div>
              </div>

              {/* Mock Interviews */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Mock Interviews Attended</h4>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Target: {mockTarget} formal mock sessions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={() => handleDecrement('mockInterviews')} className="btn btn-secondary" style={{ padding: '6px 12px' }}>-</button>
                  <input
                    type="number"
                    name="mockInterviews"
                    value={formData.mockInterviews}
                    onChange={handleInputChange}
                    style={{ width: '70px', textAlign: 'center', padding: '6px', border: '1px solid var(--border)', background: '#0f172a', color: 'white', borderRadius: '4px' }}
                  />
                  <button type="button" onClick={() => handleIncrement('mockInterviews', 50)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>+</button>
                </div>
              </div>

              {/* Certifications */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Certifications Earned</h4>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Target: {certTarget} cloud / tech credentials</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={() => handleDecrement('certificationsCount')} className="btn btn-secondary" style={{ padding: '6px 12px' }}>-</button>
                  <input
                    type="number"
                    name="certificationsCount"
                    value={formData.certificationsCount}
                    onChange={handleInputChange}
                    style={{ width: '70px', textAlign: 'center', padding: '6px', border: '1px solid var(--border)', background: '#0f172a', color: 'white', borderRadius: '4px' }}
                  />
                  <button type="button" onClick={() => handleIncrement('certificationsCount', 50)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>+</button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', gap: '6px' }} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving Logs...' : 'Update Logs'}
              </button>
            </form>
          </div>

          {/* Right Column: Score Breakdown & Gauges */}
          <div className="col-6 card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
            <h3 className="card-title" style={{ alignSelf: 'flex-start' }}>
              <Award size={18} style={{ color: '#0ea5e9' }} />
              Placement Readiness Insights
            </h3>

            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <CircularGauge value={readinessScore} size={150} color="#0ea5e9" label="Readiness" />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0ea5e9' }} />
                  <span>DSA solved: <strong>{Math.round(Math.min((formData.dsaCount / dsaTarget) * 100, 100))}%</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span>Projects: <strong>{Math.round(Math.min((formData.projectsCount / projectTarget) * 100, 100))}%</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff9900' }} />
                  <span>Skills gap: <strong>{skillMatchPct}% match</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  <span>Mocks: <strong>{Math.round(Math.min((formData.mockInterviews / mockTarget) * 100, 100))}%</strong></span>
                </div>
              </div>
            </div>

            {breakdown ? (
              <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '16px', color: '#f8fafc' }}>
                  Readiness Score Breakdown (Weighted Points)
                </h4>
                <ReadinessBarChart breakdown={breakdown} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem', borderTop: '1px solid var(--border)', paddingTop: '20px', width: '100%' }}>
                <ShieldAlert size={16} /> Save your counters above to see weighted readiness details.
              </div>
            )}
          </div>
        </div>

        {/* Daily Update Modal Backdrop */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}>
            <div className="card" style={{
              width: '100%',
              maxWidth: '540px',
              padding: '32px',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
              border: '1px solid var(--border)'
            }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Flame size={20} style={{ color: '#ff9900' }} />
                Submit Daily Update
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
                Log today's coding milestones, learning topics, and skill focus to compute your heatmap weights and streaks.
              </p>

              {error && (
                <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: '500' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleDailySubmit}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Problems Solved (DSA / Coding today)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={dailyForm.problems_solved}
                    onChange={(e) => setDailyForm({ ...dailyForm, problems_solved: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Topics Learned (separated by commas)</label>
                  <input
                    type="text"
                    placeholder="e.g. Binary Search, Dynamic Programming, AWS VPC"
                    className="form-input"
                    value={dailyForm.topics_learned}
                    onChange={(e) => setDailyForm({ ...dailyForm, topics_learned: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Skills Improved Today</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '8px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    border: '1px solid var(--border)',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.01)'
                  }}>
                    {allSkills.map(sk => {
                      const isSelected = dailyForm.skills_updated.includes(sk.skill_name);
                      return (
                        <label key={sk.skill_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: isSelected ? '#ff9900' : '#e2e8f0' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            style={{ accentColor: '#ff9900' }}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDailyForm({ ...dailyForm, skills_updated: [...dailyForm.skills_updated, sk.skill_name] });
                              } else {
                                setDailyForm({ ...dailyForm, skills_updated: dailyForm.skills_updated.filter(name => name !== sk.skill_name) });
                              }
                            }}
                          />
                          <span>{sk.skill_name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Optional Notes / Reflection</label>
                  <textarea
                    placeholder="e.g. Solved two medium tree problems. Found the DFS traversal trick tricky at first."
                    className="form-input"
                    rows="3"
                    style={{ resize: 'none' }}
                    value={dailyForm.notes}
                    onChange={(e) => setDailyForm({ ...dailyForm, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={() => { setError(''); setShowModal(false); }} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Daily Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
