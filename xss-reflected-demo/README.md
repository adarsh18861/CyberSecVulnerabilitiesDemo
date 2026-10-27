# XSS Lab — Web Server Security Assignment

A polished local demo for **Reflected Cross-Site Scripting (XSS)** with a deliberately vulnerable route and a mitigated route.

## Requirements
- Node.js 18+ recommended
- npm

## Run locally
```bash
npm install
npm start
```
Open http://localhost:3000

## Routes
- `/` — project overview
- `/vulnerable` — intentionally vulnerable reflected-XSS demo
- `/secure` — output-encoding mitigation

Use only in a local environment. Do not deploy the vulnerable route publicly.

## Assignment demonstration
1. Open `/vulnerable`, submit harmless input, then use a harmless classroom test such as `<script>alert('XSS Demo')</script>` to observe execution.
2. Open `/secure` and submit the exact same input. It should be rendered as text rather than executed.
3. Explain the root cause: untrusted input is inserted into an HTML response without output encoding.
4. Explain the mitigation: encode HTML-significant characters for this HTML-text context.
5. Discuss the alternative XSS defenses from the course assignment: context-aware output encoding, framework auto-escaping, HTML sanitization, CSP, HttpOnly cookies, and safe DOM sinks.

## Important note
The vulnerable route intentionally reflects input as HTML and is unsafe by design. Keep this app local and use it only for your authorized assignment demonstration. The encoding helper is written for the HTML text context used here; other output contexts require context-specific handling.
