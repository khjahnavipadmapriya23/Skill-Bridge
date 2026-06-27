import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Award, Flame, BookOpen, Trophy } from 'lucide-react';

export default function Leaderboard() {
  const [students, setStudents] = useState([]);
  const [sortBy, setSortBy] = useState('readiness'); // 'readiness' or 'streak'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await fetch(`http://localhost:5000/api/leaderboard?sortBy=${sortBy}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.message);
        setStudents(data);

      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Could not retrieve leaderboard standings.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [sortBy, navigate]);

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Leaderboard</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '4px' }}>
              Compete with your peers and track rankings based on readiness scores or streaks.
            </p>
          </div>

          {/* Sort Filters */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '4px'
          }}>
            <button
              onClick={() => setSortBy('readiness')}
              className="btn"
              style={{
                backgroundColor: sortBy === 'readiness' ? 'var(--primary)' : 'transparent',
                color: sortBy === 'readiness' ? 'var(--bg-dark)' : 'var(--text-muted)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem'
              }}
            >
              <Trophy size={14} style={{ marginRight: '4px' }} /> Readiness Score
            </button>
            <button
              onClick={() => setSortBy('streak')}
              className="btn"
              style={{
                backgroundColor: sortBy === 'streak' ? 'var(--primary)' : 'transparent',
                color: sortBy === 'streak' ? 'var(--bg-dark)' : 'var(--text-muted)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem'
              }}
            >
              <Flame size={14} style={{ marginRight: '4px' }} /> Consistency Streak
            </button>
          </div>
        </header>

        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '500' }}>
            {error}
          </div>
        )}

        {/* Consistency streak ranking layout */}

        <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', fontSize: '1.1rem', color: '#ff9900', fontWeight: '600' }}>
              Calculating campus rankings...
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student Name</th>
                    <th>College & Branch</th>
                    <th style={{ textAlign: 'center' }}>Streak</th>
                    <th style={{ textAlign: 'center' }}>DSA Solved</th>
                    <th style={{ textAlign: 'center' }}>Projects</th>
                    <th style={{ textAlign: 'center' }}>Mocks</th>
                    <th style={{ textAlign: 'center' }}>Certs</th>
                    <th style={{ textAlign: 'right' }}>Readiness Score</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.map((student) => {
                      // Highlight top 3
                      let medalColor = 'transparent';
                      let rankBadge = <span>#{student.rank}</span>;
                      
                      if (student.rank === 1) {
                        medalColor = 'rgba(255, 215, 0, 0.15)'; // Gold
                        rankBadge = <span style={{ color: '#ffd700', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>🥇 Gold</span>;
                      } else if (student.rank === 2) {
                        medalColor = 'rgba(192, 192, 192, 0.15)'; // Silver
                        rankBadge = <span style={{ color: '#c0c0c0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>🥈 Silver</span>;
                      } else if (student.rank === 3) {
                        medalColor = 'rgba(205, 127, 50, 0.15)'; // Bronze
                        rankBadge = <span style={{ color: '#cd7f32', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>🥉 Bronze</span>;
                      }

                      return (
                        <tr key={student.id} style={{ backgroundColor: medalColor }}>
                          <td style={{ fontWeight: '700', paddingLeft: '24px' }}>
                            {rankBadge}
                          </td>
                          <td>
                            <strong style={{ color: '#f8fafc', fontSize: '0.98rem' }}>{student.name}</strong>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{student.college}</div>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{student.branch}</span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '600' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: student.streak > 0 ? '#ff9900' : '#94a3b8' }}>
                              <Flame size={14} style={{ fill: student.streak > 0 ? '#ff9900' : 'transparent' }} />
                              <span>{student.streak} days</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', color: '#e2e8f0', fontWeight: '600' }}>{student.dsaCount}</td>
                          <td style={{ textAlign: 'center', color: '#e2e8f0', fontWeight: '600' }}>{student.projectsCount}</td>
                          <td style={{ textAlign: 'center', color: '#e2e8f0', fontWeight: '600' }}>{student.mockInterviews}</td>
                          <td style={{ textAlign: 'center', color: '#e2e8f0', fontWeight: '600' }}>{student.certificationsCount}</td>
                          <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                            <span className="badge badge-info" style={{ fontSize: '0.9rem', fontWeight: '700', padding: '6px 14px' }}>
                              {student.readinessScore}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                        No students listed in the leaderboard.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
