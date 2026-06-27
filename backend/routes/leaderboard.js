const express = require('express');
const router = express.Router();
const { dbAll } = require('../database');
const { authenticateToken } = require('./auth');

// GET: Fetch Top 10 Student Leaderboard
router.get('/', authenticateToken, async (req, res) => {
  const sortBy = req.query.sortBy === 'streak' ? 'streak' : 'readiness';

  try {
    // 1. Fetch all students and their placement tracker counters
    const students = await dbAll(`
      SELECT u.id, u.name, u.college, u.branch, u.streak, u.target_role_id,
             pt.dsa_count, pt.projects_count, pt.certifications_count, pt.mock_interviews
      FROM users u
      LEFT JOIN placement_tracker pt ON u.id = pt.user_id
      WHERE u.role = 'student'
    `);

    // 2. Fetch all user skills and role skills in bulk to optimize DB queries
    const userSkills = await dbAll('SELECT user_id, skill_id FROM user_skills WHERE status = "acquired"');
    const roleSkills = await dbAll('SELECT role_id, skill_id FROM role_skills');

    // Create maps for fast lookup
    const userSkillsMap = {};
    for (const us of userSkills) {
      if (!userSkillsMap[us.user_id]) userSkillsMap[us.user_id] = new Set();
      userSkillsMap[us.user_id].add(us.skill_id);
    }

    const roleSkillsMap = {};
    for (const rs of roleSkills) {
      if (!roleSkillsMap[rs.role_id]) roleSkillsMap[rs.role_id] = [];
      roleSkillsMap[rs.role_id].push(rs.skill_id);
    }

    // 3. Calculate readiness score for each student
    const compiledList = students.map(student => {
      const dsa = student.dsa_count || 0;
      const projects = student.projects_count || 0;
      const certifications = student.certifications_count || 0;
      const mocks = student.mock_interviews || 0;
      const roleId = student.target_role_id;

      // Skill Match Score Calculation
      let skillMatchPct = 0;
      if (roleId && roleSkillsMap[roleId]) {
        const requiredIds = roleSkillsMap[roleId];
        const studentAcquired = userSkillsMap[student.id] || new Set();
        
        let overlap = 0;
        for (const reqSkillId of requiredIds) {
          if (studentAcquired.has(reqSkillId)) {
            overlap++;
          }
        }
        
        if (requiredIds.length > 0) {
          skillMatchPct = Math.round((overlap / requiredIds.length) * 100);
        }
      }

      // Points weights:
      // DSA: max 30 points (out of 300)
      const dsaPoints = Math.min((dsa / 300) * 30, 30);
      // Projects: max 25 points (out of 3)
      const projectPoints = Math.min((projects / 3) * 25, 25);
      // Certs: max 10 points (out of 2)
      const certPoints = Math.min((certifications / 2) * 10, 10);
      // Mocks: max 15 points (out of 3)
      const mockPoints = Math.min((mocks / 3) * 15, 15);
      // Skills: max 20 points (100% skill match)
      const skillPoints = (skillMatchPct / 100) * 20;

      const readinessScore = Math.round(dsaPoints + projectPoints + certPoints + mockPoints + skillPoints);

      return {
        id: student.id,
        name: student.name,
        college: student.college,
        branch: student.branch,
        streak: student.streak || 0,
        readinessScore,
        dsaCount: dsa,
        projectsCount: projects,
        certificationsCount: certifications,
        mockInterviews: mocks
      };
    });

    // 4. Sort compiled list based on sortBy request
    if (sortBy === 'streak') {
      compiledList.sort((a, b) => b.streak - a.streak || b.readinessScore - a.readinessScore);
    } else {
      compiledList.sort((a, b) => b.readinessScore - a.readinessScore || b.streak - a.streak);
    }

    // 5. Select Top 10 rankings
    const top10 = compiledList.slice(0, 10).map((s, index) => ({
      rank: index + 1,
      ...s
    }));

    res.json(top10);
  } catch (error) {
    console.error('Fetch leaderboard error:', error);
    res.status(500).json({ message: 'Error retrieving leaderboard rankings.' });
  }
});

module.exports = router;
