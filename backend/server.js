const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

// Import routers
const { router: authRouter } = require('./routes/auth');
const skillsRouter = require('./routes/skills');
const { router: placementRouter } = require('./routes/placement');
const resumeRouter = require('./routes/resume');
const leaderboardRouter = require('./routes/leaderboard');
const profileRouter = require('./routes/profile');
const adminRouter = require('./routes/admin');
const dailyUpdatesRouter = require('./routes/dailyUpdates');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/placement', placementRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/profile', profileRouter);
app.use('/api/admin', adminRouter);
app.use('/api/daily-updates', dailyUpdatesRouter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Skill Gap & Placement Tracker API'
  });
});

// Serve static frontend assets in production environment
const path = require('path');
const fs = require('fs');
const frontendPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Initialize DB and start server
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
