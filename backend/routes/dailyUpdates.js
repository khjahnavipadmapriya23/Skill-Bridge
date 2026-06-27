const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../database');
const { authenticateToken } = require('./auth');

// GET: Fetch today's check-in update (if exists)
router.get('/today', authenticateToken, async (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const update = await dbGet(
      'SELECT * FROM daily_updates WHERE user_id = ? AND update_date = ?',
      [req.user.id, todayStr]
    );
    res.json(update || null);
  } catch (error) {
    console.error('Fetch today update error:', error);
    res.status(500).json({ message: 'Error retrieving today\'s check-in status.' });
  }
});

// POST: Submit/Update daily log
router.post('/', authenticateToken, async (req, res) => {
  const { problems_solved, topics_learned, skills_updated, notes } = req.body;

  const numProblems = parseInt(problems_solved) || 0;
  if (numProblems < 0) {
    return res.status(400).json({ message: 'Problems solved count cannot be negative.' });
  }

  // Expecting arrays or JSON strings for topics and skills
  let topicsArr = [];
  if (Array.isArray(topics_learned)) {
    topicsArr = topics_learned;
  } else if (typeof topics_learned === 'string') {
    topicsArr = topics_learned.split(',').map(s => s.trim()).filter(Boolean);
  }

  let skillsArr = [];
  if (Array.isArray(skills_updated)) {
    skillsArr = skills_updated;
  } else if (typeof skills_updated === 'string') {
    skillsArr = skills_updated.split(',').map(s => s.trim()).filter(Boolean);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // 1. Fetch user's current streak state
    const user = await dbGet('SELECT streak, last_activity_date FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    let newStreak = user.streak || 0;
    const lastActive = user.last_activity_date;

    if (!lastActive) {
      newStreak = 1;
    } else {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(todayStr);
      const diffTime = todayDate - lastDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
      // If diffDays === 0, newStreak stays the same
    }

    // 2. Update user's streak and active timestamp in DB
    await dbRun(
      'UPDATE users SET streak = ?, last_activity_date = ? WHERE id = ?',
      [newStreak, todayStr, req.user.id]
    );

    // 3. Compute activity intensity weight
    // A: Streak score scales up to 4.0 max
    const streakScore = Math.min(newStreak * 0.2, 4.0);
    // B: Activity depth (problems solved up to 5 points + topic/learning count up to 4 points)
    const activityDepth = Math.min(numProblems, 5) + Math.min(topicsArr.length + skillsArr.length, 4);
    const activityWeight = streakScore + activityDepth;

    // 4. Check if we already have an update for today
    const existingUpdate = await dbGet(
      'SELECT problems_solved FROM daily_updates WHERE user_id = ? AND update_date = ?',
      [req.user.id, todayStr]
    );

    let diffProblems = numProblems;
    if (existingUpdate) {
      diffProblems = numProblems - existingUpdate.problems_solved;
    }

    // 5. Upsert daily update log
    await dbRun(
      `INSERT INTO daily_updates (user_id, update_date, problems_solved, topics_learned, skills_updated, notes, streak_at_update, activity_weight)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, update_date) DO UPDATE SET
         problems_solved = excluded.problems_solved,
         topics_learned = excluded.topics_learned,
         skills_updated = excluded.skills_updated,
         notes = excluded.notes,
         streak_at_update = excluded.streak_at_update,
         activity_weight = excluded.activity_weight`,
      [
        req.user.id,
        todayStr,
        numProblems,
        JSON.stringify(topicsArr),
        JSON.stringify(skillsArr),
        notes || '',
        newStreak,
        activityWeight
      ]
    );

    // 6. Update cumulative placement tracker totals (increment/decrement dsa count dynamically)
    await dbRun(
      `UPDATE placement_tracker 
       SET dsa_count = MAX(dsa_count + ?, 0) 
       WHERE user_id = ?`,
      [diffProblems, req.user.id]
    );

    // 7. Log to general activity log
    await dbRun(
      'INSERT INTO activity_logs (user_id, activity_text) VALUES (?, ?)',
      [req.user.id, `Submitted daily check-in: solved ${numProblems} problems, learned ${topicsArr.length} topics.`]
    );

    res.json({
      message: 'Daily update submitted successfully!',
      streak: newStreak,
      weight: activityWeight
    });

  } catch (error) {
    console.error('Submit daily update error:', error);
    res.status(500).json({ message: 'Error processing daily update submission.' });
  }
});

module.exports = router;
