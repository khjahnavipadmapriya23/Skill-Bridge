const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../database');
const { authenticateToken, verifyAdmin } = require('./auth');

// GET: Fetch Admin Dashboard Analytics
router.get('/analytics', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    // 1. Total Students
    const studentCount = await dbGet("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const totalStudents = studentCount.count || 0;

    // 2. Platform Stats
    const resumeCount = await dbGet("SELECT COUNT(*) as count FROM resume_data WHERE uploaded_file IS NOT NULL");
    const totalResumes = resumeCount.count || 0;

    const trackerSum = await dbGet(`
      SELECT SUM(dsa_count) as total_dsa, 
             SUM(projects_count) as total_projects,
             SUM(certifications_count) as total_certs,
             SUM(mock_interviews) as total_mocks 
      FROM placement_tracker
    `);
    const totalDsa = trackerSum.total_dsa || 0;
    const totalProjects = trackerSum.total_projects || 0;
    const totalCerts = trackerSum.total_certs || 0;
    const totalMocks = trackerSum.total_mocks || 0;

    // 3. Branch Distribution
    const branchDistribution = await dbAll(
      "SELECT branch, COUNT(*) as count FROM users WHERE role = 'student' GROUP BY branch ORDER BY count DESC"
    );

    // 4. College Distribution
    const collegeDistribution = await dbAll(
      "SELECT college, COUNT(*) as count FROM users WHERE role = 'student' GROUP BY college ORDER BY count DESC"
    );

    // 5. Calculate Average Readiness Score
    const students = await dbAll(`
      SELECT u.id, u.target_role_id,
             pt.dsa_count, pt.projects_count, pt.certifications_count, pt.mock_interviews
      FROM users u
      LEFT JOIN placement_tracker pt ON u.id = pt.user_id
      WHERE u.role = 'student'
    `);

    const userSkills = await dbAll('SELECT user_id, skill_id FROM user_skills WHERE status = "acquired"');
    const roleSkills = await dbAll('SELECT role_id, skill_id FROM role_skills');

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

    let sumReadiness = 0;
    for (const student of students) {
      const dsa = student.dsa_count || 0;
      const projects = student.projects_count || 0;
      const certifications = student.certifications_count || 0;
      const mocks = student.mock_interviews || 0;
      const roleId = student.target_role_id;

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

      const dsaPoints = Math.min((dsa / 300) * 30, 30);
      const projectPoints = Math.min((projects / 3) * 25, 25);
      const certPoints = Math.min((certifications / 2) * 10, 10);
      const mockPoints = Math.min((mocks / 3) * 15, 15);
      const skillPoints = (skillMatchPct / 100) * 20;

      const score = Math.round(dsaPoints + projectPoints + certPoints + mockPoints + skillPoints);
      sumReadiness += score;
    }

    const averageReadiness = totalStudents > 0 ? Math.round(sumReadiness / totalStudents) : 0;

    res.json({
      platformStats: {
        totalStudents,
        totalResumes,
        totalDsa,
        totalProjects,
        totalCerts,
        totalMocks,
        averageReadiness
      },
      branchDistribution,
      collegeDistribution
    });
  } catch (error) {
    console.error('Fetch admin analytics error:', error);
    res.status(500).json({ message: 'Error retrieving platform analytics.' });
  }
});

// GET: Fetch roles with their mapped skills
router.get('/roles-skills', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const roles = await dbAll('SELECT * FROM roles');
    const roleSkills = await dbAll(`
      SELECT rs.role_id, s.skill_id, s.skill_name 
      FROM role_skills rs 
      JOIN skills s ON rs.skill_id = s.skill_id
    `);

    // Compile into standard response list
    const result = roles.map(r => {
      const skills = roleSkills
        .filter(rs => rs.role_id === r.role_id)
        .map(rs => ({ id: rs.skill_id, name: rs.skill_name }));
      return {
        role_id: r.role_id,
        role_name: r.role_name,
        skills
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Fetch roles-skills error:', error);
    res.status(500).json({ message: 'Error fetching roles skill config.' });
  }
});

// POST: Create target role and link required skills
router.post('/roles', authenticateToken, verifyAdmin, async (req, res) => {
  const { role_name, skillIds } = req.body;

  if (!role_name || !Array.isArray(skillIds)) {
    return res.status(400).json({ message: 'Role name and skillIds array are required.' });
  }

  try {
    // Check if role exists
    const existing = await dbGet('SELECT role_id FROM roles WHERE role_name = ?', [role_name]);
    if (existing) {
      return res.status(400).json({ message: 'A target role with this name already exists.' });
    }

    // Insert role
    const roleResult = await dbRun('INSERT INTO roles (role_name) VALUES (?)', [role_name]);
    const roleId = roleResult.id;

    // Link skills
    for (const skillId of skillIds) {
      await dbRun('INSERT OR IGNORE INTO role_skills (role_id, skill_id) VALUES (?, ?)', [roleId, parseInt(skillId)]);
    }

    res.status(201).json({ message: 'Target role created and mapped successfully.', role_id: roleId });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'Error creating target career role.' });
  }
});

// PUT: Edit target role and link required skills
router.put('/roles/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const roleId = req.params.id;
  const { role_name, skillIds } = req.body;

  if (!role_name || !Array.isArray(skillIds)) {
    return res.status(400).json({ message: 'Role name and skillIds array are required.' });
  }

  try {
    // Verify role exists
    const role = await dbGet('SELECT role_id FROM roles WHERE role_id = ?', [roleId]);
    if (!role) {
      return res.status(404).json({ message: 'Target role not found.' });
    }

    // Update role name
    await dbRun('UPDATE roles SET role_name = ? WHERE role_id = ?', [role_name, roleId]);

    // Clear old skill links
    await dbRun('DELETE FROM role_skills WHERE role_id = ?', [roleId]);

    // Link new skills
    for (const skillId of skillIds) {
      await dbRun('INSERT INTO role_skills (role_id, skill_id) VALUES (?, ?)', [roleId, parseInt(skillId)]);
    }

    res.json({ message: 'Target role updated successfully.' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Error updating target career role.' });
  }
});

// DELETE: Delete target career role
router.delete('/roles/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const roleId = req.params.id;

  try {
    const role = await dbGet('SELECT role_id FROM roles WHERE role_id = ?', [roleId]);
    if (!role) {
      return res.status(404).json({ message: 'Target role not found.' });
    }

    // Delete role (cascade constraints will delete role_skills links)
    await dbRun('DELETE FROM roles WHERE role_id = ?', [roleId]);

    res.json({ message: 'Target role deleted successfully.' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'Error deleting target career role.' });
  }
});

module.exports = router;
