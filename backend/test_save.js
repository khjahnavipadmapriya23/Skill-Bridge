const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening DB:', err);
    return;
  }
  console.log('Opened test connection in backend.');

  // Check users
  db.all('SELECT id, name, role FROM users', [], (err, rows) => {
    if (err) console.error(err);
    else console.log('Users in DB:', rows);
  });

  // Check user_skills
  db.all('SELECT * FROM user_skills', [], (err, rows) => {
    if (err) console.error(err);
    else console.log('UserSkills currently:', rows);
  });

  // Test insert
  db.run('INSERT OR REPLACE INTO user_skills (user_id, skill_id, status) VALUES (1, 1, "acquired")', [], function(err) {
    if (err) console.error('Insert error:', err);
    else console.log('Insert success, changes:', this.changes);
  });
});
