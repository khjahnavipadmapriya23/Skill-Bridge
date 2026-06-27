const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../database');
const { authenticateToken, logUserActivity } = require('./auth');

// Skill weights for roadmap ordering (foundational -> advanced)
const SKILL_ROADMAP_WEIGHTS = {
  // Foundations (Weight 1)
  'DSA': 1, 'Java': 1, 'Python': 1, 'Git': 1, 'Linux': 1, 'SQL': 1, 'HTML': 1, 'CSS': 1, 'JavaScript': 1, 'Statistics': 1, 'Excel': 1,
  // Intermediate / Frameworks (Weight 2)
  'System Design': 2, 'Spring Boot': 2, 'REST APIs': 2, 'Hibernate': 2, 'React': 2, 'Tableau': 2, 'PowerBI': 2,
  // Advanced / Cloud / DevOps (Weight 3)
  'AWS': 3, 'Docker': 3, 'Jenkins': 3, 'Terraform': 3, 'CI/CD': 3, 'Networking': 3, 'Security': 3, 'Kubernetes': 3
};

// GET: Fetch all skills
router.get('/', authenticateToken, async (req, res) => {
  try {
    const skills = await dbAll('SELECT * FROM skills ORDER BY skill_name ASC');
    res.json(skills);
  } catch (error) {
    console.error('Fetch skills error:', error);
    res.status(500).json({ message: 'Error fetching skills.' });
  }
});

// GET: Fetch all target roles
router.get('/roles', authenticateToken, async (req, res) => {
  try {
    const roles = await dbAll('SELECT * FROM roles ORDER BY role_name ASC');
    res.json(roles);
  } catch (error) {
    console.error('Fetch roles error:', error);
    res.status(500).json({ message: 'Error fetching roles.' });
  }
});

// GET: Fetch student's current skills
router.get('/my-skills', authenticateToken, async (req, res) => {
  try {
    const userSkills = await dbAll(
      `SELECT s.skill_id, s.skill_name, us.status 
       FROM user_skills us 
       JOIN skills s ON us.skill_id = s.skill_id 
       WHERE us.user_id = ?`,
      [req.user.id]
    );
    res.json(userSkills);
  } catch (error) {
    console.error('Fetch user skills error:', error);
    res.status(500).json({ message: 'Error fetching your skills.' });
  }
});

// POST: Update student's skills
router.post('/my-skills', authenticateToken, async (req, res) => {
  const { skillIds } = req.body; // Array of skill IDs

  if (!Array.isArray(skillIds)) {
    return res.status(400).json({ message: 'skillIds must be an array.' });
  }

  try {
    // Delete existing
    await dbRun('DELETE FROM user_skills WHERE user_id = ?', [req.user.id]);

    // Insert new
    for (const skillId of skillIds) {
      await dbRun(
        'INSERT INTO user_skills (user_id, skill_id, status) VALUES (?, ?, ?)',
        [req.user.id, skillId, 'acquired']
      );
    }

    await logUserActivity(req.user.id, `Updated skills inventory. Acquired ${skillIds.length} skills.`);
    res.json({ message: 'Skills updated successfully.' });
  } catch (error) {
    console.error('Update user skills error:', error);
    res.status(500).json({ message: 'Error updating skills.' });
  }
});

// GET: Skill Gap Analysis
router.get('/gap', authenticateToken, async (req, res) => {
  try {
    // Get user's target role
    const user = await dbGet('SELECT target_role_id FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.target_role_id) {
      return res.json({
        hasTargetRole: false,
        message: 'Please set your target career role in your Profile page to view Skill Gap Analysis.'
      });
    }

    const roleId = user.target_role_id;

    // Fetch role details
    const roleDetails = await dbGet('SELECT role_name FROM roles WHERE role_id = ?', [roleId]);

    // Fetch required skills for target role
    const requiredSkills = await dbAll(
      `SELECT s.skill_id, s.skill_name 
       FROM role_skills rs 
       JOIN skills s ON rs.skill_id = s.skill_id 
       WHERE rs.role_id = ?`,
      [roleId]
    );

    // Fetch student's acquired skills
    const acquiredSkills = await dbAll(
      `SELECT s.skill_id, s.skill_name 
       FROM user_skills us 
       JOIN skills s ON us.skill_id = s.skill_id 
       WHERE us.user_id = ? AND us.status = 'acquired'`,
      [req.user.id]
    );

    const acquiredMap = new Set(acquiredSkills.map(s => s.skill_name));

    // Categorize skills
    const existing = [];
    const missing = [];

    for (const skill of requiredSkills) {
      if (acquiredMap.has(skill.skill_name)) {
        existing.push(skill.skill_name);
      } else {
        missing.push(skill.skill_name);
      }
    }

    // Calculate match percentage
    const totalRequired = requiredSkills.length;
    const matchPercentage = totalRequired > 0 
      ? Math.round((existing.length / totalRequired) * 100) 
      : 0;

    // Generate Recommended Roadmap (sorted by category difficulty/pre-requisite weight)
    const roadmap = [...missing].sort((a, b) => {
      const weightA = SKILL_ROADMAP_WEIGHTS[a] || 99;
      const weightB = SKILL_ROADMAP_WEIGHTS[b] || 99;
      return weightA - weightB;
    });

    res.json({
      hasTargetRole: true,
      targetRoleName: roleDetails.role_name,
      requiredSkills: requiredSkills.map(s => s.skill_name),
      existingSkills: existing,
      missingSkills: missing,
      matchPercentage,
      suggestedRoadmap: roadmap
    });
  } catch (error) {
    console.error('Skill gap calculation error:', error);
    res.status(500).json({ message: 'Error performing skill gap analysis.' });
  }
});

module.exports = router;
