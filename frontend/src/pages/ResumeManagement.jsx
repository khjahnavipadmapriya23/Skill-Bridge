import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FileText, Upload, CheckCircle2, AlertTriangle, FileCode, Check } from 'lucide-react';

export default function ResumeManagement() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchResumeData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/resume', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await response.json();

      if (!response.ok) throw new Error(resData.message);
      setData(resData);

    } catch (err) {
      console.error('Error fetching resume status:', err);
      setError('Could not retrieve resume analysis details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumeData();
  }, [navigate]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setMessage('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload first.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setUploading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('http://localhost:5000/api/resume/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message);

      setMessage('Resume uploaded and parsed successfully!');
      setFile(null);
      await fetchResumeData();

    } catch (err) {
      console.error('Error uploading resume:', err);
      setError(err.message || 'Error occurred while uploading file.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
        <Sidebar />
        <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: '#ff9900', fontWeight: '600' }}>Running Resume Keyword Matcher...</div>
        </div>
      </div>
    );
  }

  const hasResume = data && data.uploaded;
  const isMatched = data?.comparison;

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Resume Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '4px' }}>
            Upload your resume (PDF or TXT) to parse technical keywords and align them with target career roles.
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
          {/* Left Column: Upload Box */}
          <div className="col-5 card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title">
              <Upload size={18} style={{ color: '#ff9900' }} />
              Upload Resume
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              Supported formats: <strong>PDF, TXT</strong>. Max file size: 5MB.
            </p>

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                padding: '30px 20px',
                textAlign: 'center',
                backgroundColor: 'rgba(255,255,255,0.01)',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}>
                <FileText size={40} style={{ color: '#64748b', marginBottom: '12px' }} />
                <input
                  type="file"
                  id="resume-file"
                  onChange={handleFileChange}
                  accept=".pdf,text/plain"
                  style={{ display: 'none' }}
                />
                <label htmlFor="resume-file" style={{ cursor: 'pointer', display: 'block' }}>
                  <span style={{ color: '#ff9900', fontWeight: '600', textDecoration: 'underline' }}>Click to select file</span>
                  {file ? (
                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#f8fafc', fontWeight: '600' }}>
                      Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  ) : (
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>or drag & drop here</span>
                  )}
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={uploading}>
                {uploading ? 'Processing File...' : 'Upload & Scan Resume'}
              </button>
            </form>

            {hasResume && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '24px', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileCode size={32} style={{ color: '#0ea5e9' }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Active Resume</span>
                    <strong style={{ fontSize: '0.9rem', color: '#f8fafc', wordBreak: 'break-all' }}>{data.fileName}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Scan & Match Outputs */}
          <div className="col-7 card">
            <h3 className="card-title">
              <CheckCircle2 size={18} style={{ color: '#0ea5e9' }} />
              Resume Keywords Optimizer
            </h3>

            {hasResume ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {isMatched ? (
                  <>
                    {/* Score Bar */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                        <span>Target Role: <strong style={{ color: '#ff9900' }}>{data.comparison.targetRole}</strong></span>
                        <strong style={{ color: '#0ea5e9' }}>{data.comparison.matchScore}% Match</strong>
                      </div>
                      <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${data.comparison.matchScore}%`, backgroundColor: '#0ea5e9', borderRadius: '4px' }} />
                      </div>
                    </div>

                    {/* Matched Keywords */}
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={16} /> Matched Resume Keywords ({data.comparison.matchedSkills.length})
                      </h4>
                      {data.comparison.matchedSkills.length > 0 ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {data.comparison.matchedSkills.map((sk, i) => (
                            <span key={i} className="badge badge-success" style={{ fontSize: '0.78rem' }}>{sk}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No matching keywords found.</span>
                      )}
                    </div>

                    {/* Missing Keywords */}
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={16} /> Missing Target Keywords ({data.comparison.missingSkills.length})
                      </h4>
                      {data.comparison.missingSkills.length > 0 ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {data.comparison.missingSkills.map((sk, i) => (
                            <span key={i} className="badge badge-danger" style={{ fontSize: '0.78rem' }}>{sk}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '600' }}>None! Your resume maps perfectly.</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ backgroundColor: 'rgba(245,158,11,0.08)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.88rem', color: '#f59e0b' }}>
                    Set a target career role in your Profile to perform keyword matching analysis.
                  </div>
                )}

                {/* Suggestions List */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '12px', color: '#ff9900' }}>
                    Improvement Suggestions
                  </h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '20px', fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    {data.suggestions.map((sug, idx) => (
                      <li key={idx} style={{ color: '#cbd5e1' }}>{sug}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '240px', color: '#64748b' }}>
                <FileText size={48} style={{ strokeWidth: 1.5, marginBottom: '12px' }} />
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center', maxWidth: '280px' }}>
                  No resume uploaded yet. Select a file on the left to extract keywords.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
