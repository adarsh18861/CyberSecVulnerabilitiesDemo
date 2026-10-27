// db/init.js
// Creates a small SQLite database with a users table and seeds two demo
// accounts. This represents the "legitimate" backing store for the login
// system — nothing here is vulnerable by itself. The vulnerability (and
// later the fix) live entirely in how server.js builds and runs the query.

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(DB_PATH);

function init() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DROP TABLE IF EXISTS users`);
      db.run(
        `CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user'
        )`
      );

      const stmt = db.prepare(
        `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`
      );
      stmt.run('admin', 'S3cureAdminPass!', 'admin');
      stmt.run('adarsh', 'adarsh12345', 'user');
      stmt.finalize((err) => {
        if (err) return reject(err);
        console.log(`Seeded database at ${DB_PATH}`);
        resolve();
      });
    });
  });
}

if (require.main === module) {
  init().then(() => db.close());
}

module.exports = { init, DB_PATH };