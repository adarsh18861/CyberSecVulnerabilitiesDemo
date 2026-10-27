// server.js
//
// SQL Injection — Authentication Bypass (Variant 1, Table 1)
// IT-30001 Cyber Security | Web Server Security assignment
//
// This app exposes TWO login endpoints so the same exploit payload can be
// demonstrated against both the vulnerable code path and the mitigated one:
//
//   POST /login-vulnerable  -> builds the SQL query by string concatenation
//   POST /login-safe        -> builds the SAME query using a parameterised
//                               (prepared) statement
//
// Everything else (routing, session handling, HTML) is identical between
// the two, so the only variable in the demo is the query-construction
// technique. That is the point being illustrated.

const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { init, DB_PATH } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'demo-secret-change-me',
    resave: false,
    saveUninitialized: false,
  })
);

const db = new sqlite3.Database(DB_PATH);

// ---------------------------------------------------------------------
// (a) VULNERABLE implementation
// Root cause: the username and password are concatenated directly into
// the SQL text. The database cannot tell attacker-supplied syntax apart
// from the query's own syntax, so input like   ' OR '1'='1' -- 
// changes the logical structure of the WHERE clause instead of being
// treated as a literal value to compare.
// ---------------------------------------------------------------------
app.post('/login-vulnerable', (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  db.all(query, (err, rows) => {
    if (err) {
      // Deliberately exposing the error/query here (for teaching only!)
      // demonstrates how verbose errors assist an attacker.
      return res.status(500).json({
        mode: 'vulnerable',
        success: false,
        error: err.message,
        queryExecuted: query,
      });
    }
    if (rows.length > 0) {
      req.session.user = rows[0].username;
      return res.json({
        mode: 'vulnerable',
        success: true,
        message: `Authenticated as '${rows[0].username}' (role: ${rows[0].role}) WITHOUT a valid password.`,
        queryExecuted: query,
        rowsReturned: rows.length,
      });
    }
    return res.json({
      mode: 'vulnerable',
      success: false,
      message: 'Invalid credentials.',
      queryExecuted: query,
    });
  });
});

// ---------------------------------------------------------------------
// (d) MITIGATION implemented: parameterised (prepared) queries.
// The query text and the user-supplied data are sent to SQLite
// separately. Placeholders (?) mark where values go, and the driver
// binds them as literal values — they can never be interpreted as SQL
// syntax, so the same payload that worked above fails here.
// ---------------------------------------------------------------------
app.post('/login-safe', (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM users WHERE username = ? AND password = ?`;

  db.all(query, [username, password], (err, rows) => {
    if (err) {
      return res.status(500).json({
        mode: 'safe',
        success: false,
        error: 'Internal error.', // generic — no internal detail leaked
      });
    }
    if (rows.length > 0) {
      req.session.user = rows[0].username;
      return res.json({
        mode: 'safe',
        success: true,
        message: `Authenticated as '${rows[0].username}' (role: ${rows[0].role}).`,
        queryExecuted: `${query}  -- bound params: [${username}, ${password}]`,
        rowsReturned: rows.length,
      });
    }
    return res.json({
      mode: 'safe',
      success: false,
      message: 'Invalid credentials.',
      queryExecuted: `${query}  -- bound params: [${username}, ${password}]`,
    });
  });
});

app.post('/reset', async (req, res) => {
  await init();
  res.json({ message: 'Database reseeded.' });
});

app.listen(PORT, () => {
  console.log(`SQLi auth-bypass demo running at http://localhost:${PORT}`);
});
