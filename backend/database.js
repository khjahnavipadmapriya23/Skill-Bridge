const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Promisified database helpers
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Initialize database schema
async function initDatabase() {
  try {
    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        college TEXT NOT NULL,
        branch TEXT NOT NULL,
        graduation_year INTEGER NOT NULL,
        role TEXT DEFAULT 'student',
        streak INTEGER DEFAULT 0,
        last_activity_date TEXT,
        target_role_id INTEGER REFERENCES roles(role_id)
      )
    `);

    // Roles table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS roles (
        role_id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_name TEXT UNIQUE NOT NULL
      )
    `);

    // Skills table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS skills (
        skill_id INTEGER PRIMARY KEY AUTOINCREMENT,
        skill_name TEXT UNIQUE NOT NULL
      )
    `);

    // UserSkills mapping table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS user_skills (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        skill_id INTEGER REFERENCES skills(skill_id) ON DELETE CASCADE,
        status TEXT DEFAULT 'acquired',
        PRIMARY KEY (user_id, skill_id)
      )
    `);

    // RoleSkills requirements table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS role_skills (
        role_id INTEGER REFERENCES roles(role_id) ON DELETE CASCADE,
        skill_id INTEGER REFERENCES skills(skill_id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, skill_id)
      )
    `);

    // PlacementTracker table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS placement_tracker (
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        dsa_count INTEGER DEFAULT 0,
        projects_count INTEGER DEFAULT 0,
        certifications_count INTEGER DEFAULT 0,
        mock_interviews INTEGER DEFAULT 0
      )
    `);

    // ResumeData table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS resume_data (
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        uploaded_file TEXT,
        extracted_skills TEXT
      )
    `);

    // Activity Logs table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        activity_text TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Daily Updates table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS daily_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        update_date DATE NOT NULL,
        problems_solved INTEGER DEFAULT 0,
        topics_learned TEXT NOT NULL,   -- Stored as JSON stringified array
        skills_updated TEXT NOT NULL,   -- Stored as JSON stringified array of skill IDs/names
        notes TEXT,
        streak_at_update INTEGER DEFAULT 0,
        activity_weight REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, update_date)
      )
    `);

    console.log('Database tables verified/created successfully.');
    await seedData();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Seed Initial Data
async function seedData() {
  // 1. Seed Roles
  const roles = [
    { id: 1, name: 'Software Development Engineer' },
    { id: 2, name: 'Java Backend Developer' },
    { id: 3, name: 'AWS DevOps Engineer' },
    { id: 4, name: 'Cloud Engineer' },
    { id: 5, name: 'Data Analyst' }
  ];

  for (const r of roles) {
    await dbRun('INSERT OR IGNORE INTO roles (role_id, role_name) VALUES (?, ?)', [r.id, r.name]);
  }

  // 2. Seed Skills
  const skills = [
    // Languages & Foundations
    'DSA', 'System Design', 'Java', 'Python', 'Git', 'Linux', 'SQL',
    // Backend/Web Frameworks
    'Spring Boot', 'REST APIs', 'Hibernate', 'HTML', 'CSS', 'JavaScript', 'React',
    // DevOps & Cloud
    'AWS', 'Docker', 'Jenkins', 'Terraform', 'CI/CD', 'Networking', 'Security', 'Kubernetes',
    // Data Analysis
    'Excel', 'Tableau', 'Statistics', 'PowerBI'
  ];

  for (let i = 0; i < skills.length; i++) {
    await dbRun('INSERT OR IGNORE INTO skills (skill_id, skill_name) VALUES (?, ?)', [i + 1, skills[i]]);
  }

  // 3. Map Roles to Skills (RoleSkills)
  // Let's find IDs dynamically
  const dbRoles = await dbAll('SELECT * FROM roles');
  const dbSkills = await dbAll('SELECT * FROM skills');

  const getSkillId = (name) => dbSkills.find(s => s.skill_name === name)?.skill_id;
  const getRoleId = (name) => dbRoles.find(r => r.role_name === name)?.role_id;

  const mappings = {
    'Software Development Engineer': ['DSA', 'System Design', 'Java', 'Python', 'Git', 'SQL', 'React'],
    'Java Backend Developer': ['Java', 'Spring Boot', 'SQL', 'REST APIs', 'Hibernate', 'Git'],
    'AWS DevOps Engineer': ['AWS', 'Docker', 'Jenkins', 'Terraform', 'Linux', 'CI/CD', 'Git'],
    'Cloud Engineer': ['AWS', 'Networking', 'Security', 'Linux', 'Python', 'Kubernetes'],
    'Data Analyst': ['Python', 'SQL', 'Excel', 'Tableau', 'Statistics', 'PowerBI']
  };

  for (const [roleName, skillNames] of Object.entries(mappings)) {
    const roleId = getRoleId(roleName);
    if (!roleId) continue;

    for (const skillName of skillNames) {
      const skillId = getSkillId(skillName);
      if (skillId) {
        await dbRun('INSERT OR IGNORE INTO role_skills (role_id, skill_id) VALUES (?, ?)', [roleId, skillId]);
      }
    }
  }

  console.log('Database seeding verified/completed successfully.');
}

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet,
  initDatabase
};
