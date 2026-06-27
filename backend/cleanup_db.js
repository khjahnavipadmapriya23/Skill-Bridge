const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening DB:', err);
    return;
  }
  console.log('Opened database for cleanup.');

  // Delete mock users (IDs 2, 3, 4)
  db.run('DELETE FROM users WHERE id IN (2, 3, 4)', [], function(err) {
    if (err) {
      console.error('Cleanup error:', err);
    } else {
      console.log('Mock users deleted successfully. Rows affected:', this.changes);
    }
  });
});
