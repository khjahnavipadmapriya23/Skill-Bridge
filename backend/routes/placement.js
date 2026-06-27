const express = require('express');
const router = express.Router();
const { dbGet, dbRun, dbAll } = require('../database');
const { authenticateToken, logUserActivity } = require('./auth');

// Helper to calculate readiness score
async function calculateReadiness(userId, dsa, projects, certifications, mocks) {
  let skillMatchPct = 0;
  try {
    // Fetch user target role
    const user = await dbGet('SELECT target_role_id FROM users WHERE id = ?', [userId]);
    if (user && user.target_role_id) {
      const roleId = user.target_role_id;
      const requiredSkills = await dbAll('SELECT skill_id FROM role_skills WHERE role_id = ?', [roleId]);
      
      if (requiredSkills.length > 0) {
        const acquired = await dbAll(
          `SELECT us.skill_id 
           FROM user_skills us 
           JOIN role_skills rs ON us.skill_id = rs.skill_id
           WHERE us.user_id = ? AND rs.role_id = ? AND us.status = 'acquired'`,
          [userId, roleId]
        );
        skillMatchPct = Math.round((acquired.length / requiredSkills.length) * 100);
      }
    }
  } catch (error) {
    console.error('Error fetching skill match for readiness:', error);
  }

  // Scoring components:
  // 1. DSA Progress: max 300 problems (30 points)
  const dsaPoints = Math.min((dsa / 300) * 30, 30);

  // 2. Projects Completed: max 3 projects (25 points)
  const projectPoints = Math.min((projects / 3) * 25, 25);

  // 3. Certifications Earned: max 2 certifications (10 points)
  const certPoints = Math.min((certifications / 2) * 10, 10);

  // 4. Mock Interviews Attended: max 3 interviews (15 points)
  const mockPoints = Math.min((mocks / 3) * 15, 15);

  // 5. Skill Match Score: max 100% (20 points)
  const skillPoints = (skillMatchPct / 100) * 20;

  const totalScore = Math.round(dsaPoints + projectPoints + certPoints + mockPoints + skillPoints);
  return {
    score: totalScore,
    skillMatchPct,
    breakdown: {
      dsaPoints: Math.round(dsaPoints),
      projectPoints: Math.round(projectPoints),
      certPoints: Math.round(certPoints),
      mockPoints: Math.round(mockPoints),
      skillPoints: Math.round(skillPoints)
    }
  };
}

// GET: Fetch current placement tracking stats
router.get('/', authenticateToken, async (req, res) => {
  try {
    let tracker = await dbGet('SELECT * FROM placement_tracker WHERE user_id = ?', [req.user.id]);
    if (!tracker) {
      // If not initialized, insert now
      await dbRun('INSERT OR IGNORE INTO placement_tracker (user_id) VALUES (?)', [req.user.id]);
      tracker = { dsa_count: 0, projects_count: 0, certifications_count: 0, mock_interviews: 0 };
    }

    // Check if resume is uploaded
    const resume = await dbGet('SELECT uploaded_file FROM resume_data WHERE user_id = ?', [req.user.id]);
    const resumeStatus = resume && resume.uploaded_file ? 'Uploaded' : 'Not Uploaded';

    // Calculate readiness
    const readiness = await calculateReadiness(
      req.user.id,
      tracker.dsa_count,
      tracker.projects_count,
      tracker.certifications_count,
      tracker.mock_interviews
    );

    // Fetch recent activity logs
    const activities = await dbAll(
      'SELECT activity_text, timestamp FROM activity_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5',
      [req.user.id]
    );

    // Fetch user daily updates for heatmap (last 12 weeks / 84 days)
    const heatmapLogs = await dbAll(
      `SELECT update_date, activity_weight 
       FROM daily_updates 
       WHERE user_id = ? AND update_date >= DATE('now', '-84 days')`,
      [req.user.id]
    );

    const heatmap = {};
    for (const log of heatmapLogs) {
      heatmap[log.update_date] = log.activity_weight;
    }

    res.json({
      metrics: {
        dsaCount: tracker.dsa_count,
        projectsCount: tracker.projects_count,
        certificationsCount: tracker.certifications_count,
        mockInterviews: tracker.mock_interviews,
        resumeStatus
      },
      readinessScore: readiness.score,
      readinessBreakdown: readiness.breakdown,
      skillMatchPct: readiness.skillMatchPct,
      recentActivity: activities,
      activityHeatmap: heatmap
    });
  } catch (error) {
    console.error('Fetch placement metrics error:', error);
    res.status(500).json({ message: 'Error retrieving placement tracker stats.' });
  }
});

// POST: Update placement tracking stats
router.post('/', authenticateToken, async (req, res) => {
  const { dsaCount, projectsCount, certificationsCount, mockInterviews } = req.body;

  if (dsaCount === undefined || projectsCount === undefined || certificationsCount === undefined || mockInterviews === undefined) {
    return res.status(400).json({ message: 'All tracker values are required.' });
  }

  try {
    // Get existing to find differences for activity logging
    const existing = await dbGet('SELECT * FROM placement_tracker WHERE user_id = ?', [req.user.id]);
    
    // Update tracker
    await dbRun(
      `INSERT OR REPLACE INTO placement_tracker (user_id, dsa_count, projects_count, certifications_count, mock_interviews) 
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, parseInt(dsaCount), parseInt(projectsCount), parseInt(certificationsCount), parseInt(mockInterviews)]
    );

    // Generate descriptive activity logs
    let activityDesc = 'Updated placement tracker progress.';
    if (existing) {
      const logs = [];
      if (parseInt(dsaCount) > existing.dsa_count) {
        logs.push(`solved ${parseInt(dsaCount) - existing.dsa_count} new DSA problems`);
      }
      if (parseInt(projectsCount) > existing.projects_count) {
        logs.push(`completed ${parseInt(projectsCount) - existing.projects_count} new project(s)`);
      }
      if (parseInt(certificationsCount) > existing.certifications_count) {
        logs.push(`earned ${parseInt(certificationsCount) - existing.certifications_count} new certification(s)`);
      }
      if (parseInt(mockInterviews) > existing.mock_interviews) {
        logs.push(`completed ${parseInt(mockInterviews) - existing.mock_interviews} mock interview(s)`);
      }
      if (logs.length > 0) {
        activityDesc = `Progress update: ${logs.join(', ')}.`;
      }
    }
    await logUserActivity(req.user.id, activityDesc);

    // Calculate new readiness
    const readiness = await calculateReadiness(
      req.user.id,
      parseInt(dsaCount),
      parseInt(projectsCount),
      parseInt(certificationsCount),
      parseInt(mockInterviews)
    );

    res.json({
      message: 'Placement tracker metrics updated successfully.',
      readinessScore: readiness.score
    });
  } catch (error) {
    console.error('Update placement metrics error:', error);
    res.status(500).json({ message: 'Error updating placement metrics.' });
  }
});

module.exports = {
  router,
  calculateReadiness
};
