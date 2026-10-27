const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function renderPage({ mode, query = "" }) {
  const secure = mode === "secure";
  const shownQuery = secure ? escapeHTML(query) : query;
  const status = secure ? "Protected" : "Vulnerable";
  const title = secure ? "Safe Search" : "Vulnerable Search";
  const description = secure
    ? "Output encoding is applied before user input is placed in the HTML response."
    : "This route intentionally reflects user input as HTML so you can observe the vulnerability locally.";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} · XSS Lab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="ambient ambient-one"></div><div class="ambient ambient-two"></div>
  <nav class="topbar wrap">
    <a class="brand" href="/"><span class="brand-mark">X</span><span>XSS<span class="brand-light">LAB</span></span></a>
    <div class="nav-right"><span class="local-pill"><i></i> LOCAL ENVIRONMENT</span><a class="nav-link" href="/">Overview <span>↗</span></a></div>
  </nav>

  <main class="wrap page-main">
    <div class="breadcrumbs"><a href="/">Learning lab</a><span>/</span><span>${title}</span></div>
    <section class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line"></span> HANDS-ON SECURITY LAB</div>
        <h1>${title}<span class="heading-dot">.</span></h1>
        <p class="lead">${description}</p>
      </div>
      <div class="mode-badge ${secure ? "safe" : "unsafe"}"><span class="status-dot"></span>${status} mode</div>
    </section>

    <section class="workspace-grid">
      <div class="panel search-panel">
        <div class="panel-head"><div class="panel-icon">⌕</div><div><h2>Search playground</h2><p>Submit a query to inspect how it is rendered.</p></div></div>
        <form class="search-form" method="GET" action="/${secure ? "secure" : "vulnerable"}">
          <label for="q">SEARCH QUERY</label>
          <div class="input-row"><input id="q" name="q" value="${secure ? escapeHTML(query) : escapeHTML(query)}" placeholder="Try a search term…" autocomplete="off"><button type="submit">Run test <span>→</span></button></div>
        </form>
        <div class="result-label"><span>RESPONSE PREVIEW</span><span class="live-tag"><i></i> LIVE RESPONSE</span></div>
        <div class="response-box">
          <div class="response-top"><span class="window-dots"><i></i><i></i><i></i></span><span>server response</span><span class="response-type">HTML</span></div>
          <div class="response-content"><span class="response-kicker">RESULT</span><div class="result-text">You searched for: ${shownQuery || '<span class="muted">Your query will appear here.</span>'}</div></div>
        </div>
        <div class="notice ${secure ? "notice-safe" : "notice-warning"}"><span class="notice-icon">${secure ? "✓" : "!"}</span><p>${secure ? "Input is HTML-encoded before it is inserted into the response." : "Demo only: untrusted input is reflected as HTML. Use only in this local lab."}</p></div>
      </div>

      <aside class="panel side-panel">
        <div class="side-title"><span class="side-icon">⌘</span><div><h3>Lab controls</h3><p>Switch between implementations</p></div></div>
        <a class="mode-card ${!secure ? "selected vulnerable-card" : ""}" href="/vulnerable">
          <span class="mode-symbol danger-symbol">!</span><span class="mode-copy"><strong>Vulnerable version</strong><small>Raw reflection · /vulnerable</small></span><span class="mode-arrow">↗</span>
        </a>
        <a class="mode-card ${secure ? "selected secure-card" : ""}" href="/secure">
          <span class="mode-symbol safe-symbol">✓</span><span class="mode-copy"><strong>Secured version</strong><small>Output encoding · /secure</small></span><span class="mode-arrow">↗</span>
        </a>
        <div class="side-divider"></div>
        <h4>WHAT TO OBSERVE</h4>
        <ul class="observe-list">
          <li><span class="list-num">01</span><span>How input enters the response</span></li>
          <li><span class="list-num">02</span><span>Whether the browser interprets markup</span></li>
          <li><span class="list-num">03</span><span>How encoding changes the result</span></li>
        </ul>
        <div class="safe-reminder"><span>✳</span><p><strong>Keep it local.</strong><br>Only test this intentionally vulnerable demo.</p></div>
      </aside>
    </section>

    <section class="explain-grid">
      <article class="info-card"><div class="info-top"><span class="info-icon purple">01</span><span class="mini-label">THE CONCEPT</span></div><h3>What is reflected XSS?</h3><p>Untrusted request data is included in an immediate server response without suitable handling. The browser may interpret the injected content as active markup or script.</p></article>
      <article class="info-card"><div class="info-top"><span class="info-icon amber">02</span><span class="mini-label">ROOT CAUSE</span></div><h3>Unsafe HTML insertion</h3><p>The vulnerable route inserts user-controlled input directly into an HTML response. The secure route encodes special characters before insertion.</p></article>
      <article class="info-card"><div class="info-top"><span class="info-icon green">03</span><span class="mini-label">THE MITIGATION</span></div><h3>Context-aware encoding</h3><p>Encode data for the exact output context. For production apps, prefer framework auto-escaping and avoid inserting untrusted data with unsafe HTML APIs.</p></article>
    </section>

    <footer class="footer"><div class="footer-brand"><span class="brand-mark small">X</span> XSS LAB <span class="footer-sep">·</span> Web Server Security</div><span>Educational demo · Runs locally on your machine</span></footer>
  </main>
</body>
</html>`;
}

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.get("/vulnerable", (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  res.type("html").send(renderPage({ mode: "vulnerable", query: q }));
});

app.get("/secure", (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  res.type("html").send(renderPage({ mode: "secure", query: q }));
});

app.listen(PORT, () => {
  console.log(`XSS Lab running at http://localhost:${PORT}`);
});
