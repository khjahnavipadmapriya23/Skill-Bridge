const express = require('express');
const router = express.Router();
const { dbRun, dbGet } = require('../database');
const { authenticateToken, logUserActivity } = require('./auth');

// PUT: Update Profile Details
router.put('/', authenticateToken, async (req, res) => {
  const { name, college, branch, graduation_year, target_role_id } = req.body;

  if (!name || !college || !branch || !graduation_year) {
    return res.status(400).json({ message: 'Name, college, branch, and graduation year are required.' });
  }

  try {
    // Get existing target role to check if it's changing
    const existing = await dbGet('SELECT target_role_id FROM users WHERE id = ?', [req.user.id]);
    
    // Update users table
    await dbRun(
      `UPDATE users 
       SET name = ?, college = ?, branch = ?, graduation_year = ?, target_role_id = ? 
       WHERE id = ?`,
      [name, college, branch, parseInt(graduation_year), target_role_id ? parseInt(target_role_id) : null, req.user.id]
    );

    // Track activity
    let logMsg = 'Updated profile details.';
    if (target_role_id && existing.target_role_id !== parseInt(target_role_id)) {
      const role = await dbGet('SELECT role_name FROM roles WHERE role_id = ?', [target_role_id]);
      if (role) {
        logMsg = `Changed target role to "${role.role_name}".`;
      }
    }
    await logUserActivity(req.user.id, logMsg);

    // Retrieve updated profile
    const updated = await dbGet(
      `SELECT u.id, u.name, u.email, u.role, u.college, u.branch, u.graduation_year, u.streak, u.target_role_id, r.role_name as target_role_name 
       FROM users u 
       LEFT JOIN roles r ON u.target_role_id = r.role_id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    res.json({
      message: 'Profile updated successfully.',
      user: updated
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile details.' });
  }
});

module.exports = router;
