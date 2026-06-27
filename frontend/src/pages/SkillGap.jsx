import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Compass, BookOpen, AlertCircle, Save, CheckCircle, ArrowRight, ArrowDown } from 'lucide-react';

export default function SkillGap() {
  const [skills, setSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [gapData, setGapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // 1. Fetch all skills
      const allRes = await fetch('http://localhost:5000/api/skills', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allSkillsData = await allRes.json();
      setSkills(allSkillsData);

      // 2. Fetch user's current skills
      const myRes = await fetch('http://localhost:5000/api/skills/my-skills', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const mySkillsData = await myRes.json();
      setUserSkills(mySkillsData.map(us => us.skill_id));

      // 3. Fetch Skill Gap Analysis
      const gapRes = await fetch('http://localhost:5000/api/skills/gap', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const gapDataObj = await gapRes.json();
      setGapData(gapDataObj);

    } catch (err) {
      console.error('Error fetching skill gap data:', err);
      setError('Could not retrieve skill analyzer info.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleCheckboxChange = (skillId) => {
    if (userSkills.includes(skillId)) {
      setUserSkills(userSkills.filter(id => id !== skillId));
    } else {
      setUserSkills([...userSkills, skillId]);
    }
  };

  const handleSaveSkills = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expired. Please log in again.');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      console.log('Attempting to save skills array:', userSkills);
      const response = await fetch('http://localhost:5000/api/skills/my-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skillIds: userSkills })
      });

      console.log('Save response HTTP status:', response.status);
      const result = await response.json();
      console.log('Save response body content:', result);

      if (!response.ok) throw new Error(result.message || 'Server error occurred.');

      setMessage('Skills inventory saved successfully!');
      
      // Refresh gap calculations immediately
      const gapRes = await fetch('http://localhost:5000/api/skills/gap', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const gapDataObj = await gapRes.json();
      setGapData(gapDataObj);

    } catch (err) {
      console.error('Error saving user skills:', err);
      setError(err.message || 'Error occurred while saving skills.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
        <Sidebar />
        <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: '#ff9900', fontWeight: '600' }}>Running Skill Gap Analysis...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Skill Gap Analysis</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '4px' }}>
            Check off the technologies you possess to analyze compatibility with your target job role.
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
          {/* Left Panel: Skill Inventory Checklist */}
          <div className="col-6 card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title">
              <Compass size={18} style={{ color: '#ff9900' }} />
              Your Skill Inventory
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Select all programming languages, databases, tools, and practices you have learned.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px', flex: 1, marginBottom: '20px' }}>
              {skills.map((skill) => {
                const isChecked = userSkills.includes(skill.skill_id);
                return (
                  <label
                    key={skill.skill_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isChecked ? 'rgba(255, 153, 0, 0.4)' : 'var(--border)',
                      backgroundColor: isChecked ? 'rgba(255, 153, 0, 0.05)' : 'rgba(255,255,255,0.01)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: isChecked ? '600' : '400',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(skill.skill_id)}
                      style={{
                        accentColor: '#ff9900',
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer'
                      }}
                    />
                    <span>{skill.skill_name}</span>
                  </label>
                );
              })}
            </div>

            <button onClick={handleSaveSkills} className="btn btn-primary" style={{ alignSelf: 'flex-start', gap: '6px' }} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving Inventory...' : 'Save Skill Inventory'}
            </button>
          </div>

          {/* Right Panel: Skill Gap Analysis Output */}
          <div className="col-6 card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 className="card-title">
              <BookOpen size={18} style={{ color: '#0ea5e9' }} />
              Gap Analysis Report
            </h3>

            {gapData?.hasTargetRole ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Target Job Profile</span>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ff9900', marginTop: '2px' }}>{gapData.targetRoleName}</h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Match Percentage</span>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: '800', color: gapData.matchPercentage >= 70 ? '#10b981' : gapData.matchPercentage >= 40 ? '#f59e0b' : '#ef4444', marginTop: '2px' }}>
                      {gapData.matchPercentage}%
                    </h4>
                  </div>
                </div>

                {/* Existing Skills */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Acquired Required Skills ({gapData.existingSkills.length})
                  </h4>
                  {gapData.existingSkills.length > 0 ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {gapData.existingSkills.map((sk, i) => (
                        <span key={i} className="badge badge-success">{sk}</span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>None acquired yet. Start learning!</p>
                  )}
                </div>

                {/* Missing Skills */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={16} /> Missing Required Skills ({gapData.missingSkills.length})
                  </h4>
                  {gapData.missingSkills.length > 0 ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {gapData.missingSkills.map((sk, i) => (
                        <span key={i} className="badge badge-danger">{sk}</span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', background: 'rgba(16, 185, 129, 0.08)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                      <CheckCircle size={16} /> <strong>All skills matched!</strong> Your inventory aligns 100% with requirements.
                    </div>
                  )}
                </div>

                {/* Suggested Roadmap */}
                {gapData.suggestedRoadmap && gapData.suggestedRoadmap.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '12px', color: '#ff9900' }}>
                      Suggested Learning Roadmap
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '16px' }}>
                      We recommend mastering your missing skills in the following order (Foundations &rarr; Frameworks &rarr; Tools & Cloud):
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {gapData.suggestedRoadmap.map((sk, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border)',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            width: '100%',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                          }}>
                            <span style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(255, 153, 0, 0.15)',
                              color: '#ff9900',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem'
                            }}>
                              {idx + 1}
                            </span>
                            <span>{sk}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '0.9rem', maxWidth: '300px' }}>
                  Select a career role in your Profile to generate career skill match scores and roadmaps.
                </p>
                <button onClick={() => navigate('/profile')} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  Go to Profile Setup
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
