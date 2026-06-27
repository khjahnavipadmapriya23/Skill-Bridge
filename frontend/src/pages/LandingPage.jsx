import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Target, TrendingUp, Award, FileText, Server, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 80px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.4rem', fontWeight: '800' }}>
          <Target style={{ color: '#ff9900' }} />
          <span>Skill<span style={{ color: '#ff9900' }}>Bridge</span></span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/login" className="btn btn-secondary">Login</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{
        padding: '100px 80px',
        textAlign: 'center',
        background: 'radial-gradient(circle at center, rgba(255, 153, 0, 0.08) 0%, transparent 60%)',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 153, 0, 0.1)',
            border: '1px solid rgba(255, 153, 0, 0.2)',
            padding: '6px 16px',
            borderRadius: '99px',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: '#ff9900',
            marginBottom: '24px'
          }}>
            <Server size={14} /> AWS Cloud Deployable Infrastructure Enabled
          </div>
          <h1 style={{ fontSize: '3.8rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '24px' }}>
            Bridge Your <span style={{ color: '#ff9900' }}>Skill Gaps</span>. <br />
            Accelerate Your <span style={{ color: '#0ea5e9' }}>Placement Readiness</span>.
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '40px', lineHeight: 1.6 }}>
            Identify target career skills, track daily DSA milestones, analyze resume keywords automatically, and measure placement readiness scores instantly. Built for scale with Terraform, AWS CodePipeline, and EC2.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              Create Account <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              Explore Features
            </a>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <section style={{ padding: '40px 80px', display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ff9900' }}>5+</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>Predefined Career Roles</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0ea5e9' }}>100%</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>Automated Skill Mapping</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#10b981' }}>AWS</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>CI/CD Ready Environment</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '100px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '12px' }}>Platform Features</h2>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
            A comprehensive suite of intelligence tools assisting college graduates to secure placements.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          <div className="card">
            <Target size={36} style={{ color: '#ff9900', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px' }}>Skill Gap Analyzer</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Select target career profiles like SDE or Cloud Engineer. Compare your existing profile against required technologies to map gap percentages and suggested roadmap paths.
            </p>
          </div>

          <div className="card">
            <TrendingUp size={36} style={{ color: '#0ea5e9', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px' }}>Placement Tracker</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Log DSA numbers, completed projects, certifications, and mock interviews to dynamically calculate your Placement Readiness Score out of 100.
            </p>
          </div>

          <div className="card">
            <FileText size={36} style={{ color: '#10b981', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px' }}>Resume Keywords Sync</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Upload your PDF/TXT resume. Extract keywords automatically and discover missing keywords compared to target roles along with actionable improve bullet points.
            </p>
          </div>

          <div className="card">
            <Award size={36} style={{ color: '#f59e0b', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px' }}>Leaderboard Streaks</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Track consecutive daily streaks. Rank in the campus Top 10 by readiness scores and show consistency across peer branches.
            </p>
          </div>

          <div className="card">
            <Shield size={36} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px' }}>JWT Secure Auth</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Register and sign-in safely using JSON Web Token authentication with isolated admin portals to configure role matrices and track analytics.
            </p>
          </div>

          <div className="card">
            <Server size={36} style={{ color: '#a855f7', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px' }}>DevOps Architected</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Designed to be deployed via Terraform. Scripted pipeline configurations for AWS CodePipeline, CodeBuild, CodeDeploy, S3, and EC2 out of the box.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section style={{ padding: '100px 80px', backgroundColor: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '12px' }}>How It Works</h2>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
            Follow our proven path to optimize your technical profile and secure high-value placements.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255, 153, 0, 0.15)', color: '#ff9900', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 16px', fontWeight: '800', fontSize: '1.25rem', justifyContent: 'center' }}>1</div>
            <h4 style={{ marginBottom: '8px', fontWeight: '600' }}>Select Career Target</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Choose your dream role (e.g. SDE or Cloud DevOps Engineer).</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 16px', fontWeight: '800', fontSize: '1.25rem', justifyContent: 'center' }}>2</div>
            <h4 style={{ marginBottom: '8px', fontWeight: '600' }}>Analyze Skill Gap</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Mark current skills and fetch a structured roadmap to learn missing items.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 16px', fontWeight: '800', fontSize: '1.25rem', justifyContent: 'center' }}>3</div>
            <h4 style={{ marginBottom: '8px', fontWeight: '600' }}>Track Progress</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Log your solved DSA count and mock interviews daily to level up.</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 16px', fontWeight: '800', fontSize: '1.25rem', justifyContent: 'center' }}>4</div>
            <h4 style={{ marginBottom: '8px', fontWeight: '600' }}>Optimize Resume</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Upload your resume, verify target keywords match, and pass screens.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 80px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        color: '#94a3b8',
        fontSize: '0.9rem'
      }}>
        <div>&copy; {new Date().getFullYear()} SkillBridge. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>Powered by AWS Infrastructure & Terraform</span>
        </div>
      </footer>
    </div>
  );
}
