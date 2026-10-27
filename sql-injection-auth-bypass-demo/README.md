# SQL Injection — Authentication Bypass

IT-30001 Cyber Security | Web Server Security Assignment | Autumn 2026
Variant: **SQL injection → Authentication bypass** (Table 1, Variant 1)
Member: **IIT2024256**
Stack: Node.js + Express + SQLite

This folder is this member's contribution inside the group's shared repo
`CyberSecVulnerabilitiesDemo` (see the root `README.md` for the full list
of variants and who builds each one — each teammate's vulnerability gets
its own top-level folder alongside this one).

It's a small Express app with two login endpoints that run the *same*
authentication logic two different ways, so the one exploit payload can be
shown working against the vulnerable version and failing against the
mitigated version.

## 1. Setup

```bash
git clone <group-repo-url>
cd CyberSecVulnerabilitiesDemo/sql-injection-auth-bypass-demo
npm install
node db/init.js      # creates and seeds db/app.db
node server.js        # starts the server on http://localhost:3000
```

Open `http://localhost:3000` in a browser. The page has two panels,
**Vulnerable** and **Mitigated**, each with its own login form.

Seeded accounts (for legitimate-login testing):

| username | password           | role  |
|----------|--------------------|-------|
| admin    | S3cureAdminPass!   | admin |
| adarsh   | adarsh12345        | user  |

## 2. The exploit

In the **Vulnerable** panel, enter:

- Username: `admin' -- `
- Password: `anything`

and click **Attempt login**. The server logs you in as `admin` without
knowing the password.

Other payloads to try in the username field:

- `' OR '1'='1' -- ` — matches every row in the table
- `nonexistent' OR role='admin' -- ` — targets the admin role without
  knowing any valid username

Try the identical payload in the **Mitigated** panel — it is rejected.

## 3. Root cause (vulnerable path)

`server.js`, route `/login-vulnerable`, builds the query like this:

```js
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
```

The username and password are spliced into the SQL text as raw strings.
SQLite has no way to tell "data the user typed" apart from "SQL syntax" —
it just parses whatever text it receives. The payload `admin' -- ` closes
the string literal early with `'`, and `--` turns the rest of the line
(including the password check) into a comment. The query SQLite actually
executes becomes:

```sql
SELECT * FROM users WHERE username = 'admin' -- ' AND password = 'anything'
```

which is simply "find the row where username = admin" — the password
clause never runs.

## 4. Mitigation implemented: parameterised queries

`server.js`, route `/login-safe`:

```js
const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
db.all(query, [username, password], ...);
```

The `?` placeholders are sent to SQLite as the query's fixed structure.
The username and password are sent *separately*, as data, and the driver
binds them into the placeholders after the query has already been parsed.
There is no point at which user input is merged into SQL text, so there is
no syntax for an attacker to inject into. The same `admin' -- ` payload is
simply treated as a literal (and non-matching) username string.

The safe route also returns a generic `"Internal error."` message instead
of the raw database error, so a failed query doesn't leak schema details
to an attacker (this is the "safe errors" mitigation from the slides,
layered on top of the main fix).

## 5. Other mitigations (theory — from the lecture slides)

Beyond parameterised queries, the slides cover three further defences:

- **Input validation with allow-lists.** Constrain fields like usernames
  to an expected character set (e.g. alphanumerics only) before they ever
  reach a query. This reduces the attack surface but is a weaker,
  secondary control — it does not fix the root cause the way parameterised
  queries do, since allow-lists are easy to get wrong for complex fields.
- **Least-privilege database accounts.** The application's database user
  should only have the permissions it actually needs (e.g. `SELECT` on the
  `users` table), not full admin rights on the database. If an injection
  does slip through, this limits how much damage it can do — it can't be
  used to drop tables or read unrelated databases.
- **Safe error handling.** Never return raw database error messages or
  stack traces to the client. Verbose errors (table names, column names,
  SQL syntax) are exactly the information an attacker uses to refine an
  injection payload, so generic error messages close that feedback loop.

## 6. Project structure (this folder, within the group repo)