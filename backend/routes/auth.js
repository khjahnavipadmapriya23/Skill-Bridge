const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbRun, dbGet } = require('../database');

const JWT_SECRET = 'jwt_secret_key_12345';

// Helper to log user activity and update consistency streak
async function logUserActivity(userId, text) {
  const today = new Date().toISOString().split('T')[0];
  try {
    // Fetch user
    const user = await dbGet('SELECT last_activity_date, streak FROM users WHERE id = ?', [userId]);
    if (user) {
      let newStreak = user.streak || 0;
      if (!user.last_activity_date) {
        newStreak = 1;
      } else {
        const lastDate = new Date(user.last_activity_date);
        const currDate = new Date(today);
        const diffTime = currDate - lastDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak += 1; // Consecutive day
        } else if (diffDays > 1) {
          newStreak = 1; // Streak broken
        } else if (newStreak === 0) {
          newStreak = 1; // First activity
        }
      }

      await dbRun(
        'UPDATE users SET streak = ?, last_activity_date = ? WHERE id = ?',
        [newStreak, today, userId]
      );
    }

    // Insert log
    await dbRun('INSERT INTO activity_logs (user_id, activity_text) VALUES (?, ?)', [userId, text]);
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access Token Required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or Expired Token' });
    req.user = user;
    next();
  });
}

// Admin Verification Middleware
async function verifyAdmin(req, res, next) {
  try {
    const user = await dbGet('SELECT role FROM users WHERE id = ?', [req.user.id]);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied: Admins Only' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

// POST: Register User
router.post('/register', async (req, res) => {
  const { name, email, password, college, branch, graduation_year, role } = req.body;

  if (!name || !email || !password || !college || !branch || !graduation_year) {
    return res.status(400).json({ message: 'All registration fields are required.' });
  }

  try {
    // Check if user exists
    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Assign role (can be student or admin, defaults to student)
    const userRole = role === 'admin' ? 'admin' : 'student';

    // Insert user
    const result = await dbRun(
      `INSERT INTO users (name, email, password, college, branch, graduation_year, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, college, branch, parseInt(graduation_year), userRole]
    );

    const userId = result.id;

    // Initialize placement tracker
    await dbRun('INSERT INTO placement_tracker (user_id) VALUES (?)', [userId]);

    // Log registration activity
    await logUserActivity(userId, 'Created account and completed registration.');

    // Generate token
    const token = jwt.sign({ id: userId, email, role: userRole }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: userId, name, email, role: userRole, college, branch, graduation_year }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user.' });
  }
});

// POST: Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Log login activity and update streak
    await logUserActivity(user.id, 'Logged in to dashboard.');

    // Fetch updated user to get updated streak
    const updatedUser = await dbGet('SELECT * FROM users WHERE id = ?', [user.id]);

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        college: updatedUser.college,
        branch: updatedUser.branch,
        graduation_year: updatedUser.graduation_year,
        streak: updatedUser.streak,
        target_role_id: updatedUser.target_role_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in.' });
  }
});

// GET: Fetch User Profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      `SELECT u.id, u.name, u.email, u.role, u.college, u.branch, u.graduation_year, u.streak, u.target_role_id, r.role_name as target_role_name 
       FROM users u 
       LEFT JOIN roles r ON u.target_role_id = r.role_id 
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Error fetching profile.' });
  }
});

module.exports = {
  router,
  authenticateToken,
  verifyAdmin,
  logUserActivity
};
