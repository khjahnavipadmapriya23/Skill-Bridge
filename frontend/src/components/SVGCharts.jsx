import React from 'react';

// Circular gauge for scores (Readiness / Skill Match)
export const CircularGauge = ({ value = 0, size = 160, strokeWidth = 14, color = '#ff9900', label = 'Readiness' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Animated score circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s ease-in-out',
            }}
          />
        </svg>
        {/* Centered label */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#f8fafc', lineHeight: 1 }}>{value}%</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginTop: '4px', fontWeight: '600', letterSpacing: '0.05em' }}>{label}</span>
        </div>
      </div>
    </div>
  );
};

// Bar chart for points breakdown
export const ReadinessBarChart = ({ breakdown = { dsaPoints: 0, projectPoints: 0, certPoints: 0, mockPoints: 0, skillPoints: 0 } }) => {
  const data = [
    { label: 'DSA Prep', score: breakdown.dsaPoints, max: 30, color: '#0ea5e9' },
    { label: 'Projects', score: breakdown.projectPoints, max: 25, color: '#10b981' },
    { label: 'Skills Match', score: breakdown.skillPoints, max: 20, color: '#ff9900' },
    { label: 'Mocks', score: breakdown.mockPoints, max: 15, color: '#f59e0b' },
    { label: 'Certs', score: breakdown.certPoints, max: 10, color: '#ef4444' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {data.map((item, idx) => {
        const percentage = Math.round((item.score / item.max) * 100);
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '500' }}>
              <span style={{ color: '#f8fafc' }}>{item.label}</span>
              <span style={{ color: '#94a3b8' }}>
                <strong style={{ color: '#f8fafc' }}>{item.score}</strong> / {item.max} pts ({percentage}%)
              </span>
            </div>
            <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${percentage}%`,
                backgroundColor: item.color,
                borderRadius: '4px',
                transition: 'width 0.8s ease-in-out',
                boxShadow: `0 0 8px ${item.color}66`
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
