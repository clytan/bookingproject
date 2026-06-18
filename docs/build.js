// Convert SRS_and_Proposal.md → polished, print-ready HTML.
// Designed so you can open the .html in Chrome, "Print → Save as PDF" and get a
// presentation-grade document.
const fs   = require('fs');
const path = require('path');

(async () => {
  const { marked } = await import('marked');

  const inFile  = path.join(__dirname, 'SRS_and_Proposal.md');
  const outFile = path.join(__dirname, 'SRS_and_Proposal.html');

  const md = fs.readFileSync(inFile, 'utf8');

  // Inline the COKALO logo as base64 so the HTML is fully self-contained
  // and prints with the image even if the print stylesheet blocks external URLs.
  const logoPath = path.join(__dirname, '..', 'user-frontend', 'public', 'cokalo-logo.jpg');
  let logoData = '';
  try {
    const buf = fs.readFileSync(logoPath);
    logoData = 'data:image/jpeg;base64,' + buf.toString('base64');
  } catch (e) { /* logo optional */ }

  // Pull the document header lines (title + sub-fields) for the cover page
  const meta = {
    project: 'COKALO Travel Booking Platform',
    modules: 'Hotels · Water Activities · Bus (3rd-party API integration)',
    preparedBy: 'Codersdek',
    tagline: 'Explore. Discover. Celebrate.',
    version: '1.1',
    date: new Date().toISOString().slice(0, 10),
  };

  // Convert MD body, then strip the original front-matter block (lines 1-8) since
  // we'll show them on the dedicated cover page.
  const lines = md.split('\n');
  let firstBreakIdx = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (firstBreakIdx === -1) firstBreakIdx = 0;
  const body = marked.parse(lines.slice(firstBreakIdx + 1).join('\n'), { gfm: true, breaks: false });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>COKALO — SRS &amp; Commercial Proposal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,500;1,700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --primary:        #6D28D9;
    --primary-dark:   #4C1D95;
    --primary-darker: #2E1065;
    --primary-light:  #F3E8FF;
    --primary-soft:   #E9D5FF;
    --blue:           #1E40AF;
    --blue-light:     #DBEAFE;
    --text-dark:      #0F0B1F;
    --text-muted:     #5B6478;
    --border:         #E5E0F0;
    --border-soft:    #F1ECF8;
    --bg-soft:        #FBFAFD;
    --bg-tint:        #F7F4FB;
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif;
    font-size: 10.5pt;
    color: var(--text-dark);
    line-height: 1.6;
    background: #ECEAF2;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* --- Page metaphor — each .sheet renders like an A4 page on screen --- */
  .sheet {
    width: 210mm;
    min-height: 297mm;
    margin: 16px auto;
    background: white;
    padding: 22mm 20mm;
    box-shadow: 0 6px 24px rgba(46, 16, 101, 0.10);
    position: relative;
  }

  /* --- Cover page --- */
  .cover {
    background:
      radial-gradient(680px 420px at 80% 0%, rgba(255,255,255,0.10), transparent 60%),
      radial-gradient(540px 320px at 0% 100%, rgba(103, 232, 249, 0.18), transparent 60%),
      linear-gradient(135deg, #2E1065 0%, #4C1D95 40%, #1E40AF 100%);
    color: white;
    padding: 30mm 22mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 297mm;
  }
  .cover-top { display: flex; align-items: center; gap: 14px; }
  .cover-logo {
    width: 56px; height: 56px; border-radius: 12px; object-fit: cover;
    background: white;
  }
  .cover-brand {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 22pt; font-weight: 700;
    letter-spacing: -0.02em;
  }
  .cover-eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.28em;
    font-size: 9.5pt;
    color: rgba(255,255,255,0.78);
    margin-bottom: 14px;
  }
  .cover-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 42pt; font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.02em;
    max-width: 165mm;
  }
  .cover-title em { font-style: italic; font-weight: 500; color: #C4B5FD; }
  .cover-sub {
    font-size: 12pt;
    opacity: 0.86;
    margin-top: 22px;
    max-width: 150mm;
    line-height: 1.55;
  }
  .cover-meta {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px 28px;
    padding-top: 26px;
    border-top: 1px solid rgba(255,255,255,0.22);
    font-size: 10pt;
  }
  .cover-meta dt { opacity: 0.7; text-transform: uppercase; letter-spacing: 0.10em; font-size: 8.5pt; margin-bottom: 3px; }
  .cover-meta dd { font-weight: 600; margin: 0; }

  /* --- Headings --- */
  h1, h2, h3, h4 {
    font-family: 'Playfair Display', Georgia, serif;
    color: var(--primary-darker);
    letter-spacing: -0.01em;
    line-height: 1.2;
  }
  h1 {
    font-size: 24pt; font-weight: 700;
    margin: 0 0 12px;
    padding-bottom: 8px;
    border-bottom: 3px solid var(--primary);
  }
  h2 {
    font-size: 17pt; font-weight: 700;
    margin: 28px 0 12px;
    padding-left: 12px;
    border-left: 4px solid var(--primary);
  }
  h3 {
    font-size: 13pt; font-weight: 700;
    color: var(--blue);
    margin: 22px 0 8px;
  }
  h4 {
    font-size: 11pt; font-weight: 700;
    color: var(--primary);
    margin: 16px 0 6px;
  }

  /* Force a page break before each top-level "## N. ..." section */
  h2 { page-break-before: always; break-before: page; }
  /* Don't break before the first h2 right after the cover */
  .sheet:first-of-type + .sheet h2:first-child,
  h2:first-child { page-break-before: avoid; break-before: auto; }

  /* CRITICAL: never let a heading sit alone at the bottom of a page —
     always keep it attached to whatever comes next (paragraph/table/list). */
  h1, h2, h3, h4 {
    page-break-after: avoid;
    break-after: avoid-page;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  /* And the element immediately after a heading shouldn't break inside either,
     which gives the browser a strong "keep these together" hint. */
  h2 + p, h2 + ul, h2 + ol, h2 + table, h2 + blockquote,
  h3 + p, h3 + ul, h3 + ol, h3 + table, h3 + blockquote {
    page-break-before: avoid;
    break-before: avoid-page;
  }

  /* --- Body text --- */
  p { margin: 7px 0 10px; }
  strong { color: var(--primary-darker); font-weight: 700; }
  em { color: var(--primary); font-style: italic; }

  /* --- Lists --- */
  ul, ol { margin: 6px 0 12px 22px; padding: 0; }
  li { margin: 4px 0; }
  ul li::marker { color: var(--primary); }
  ol li::marker { color: var(--primary); font-weight: 700; }

  /* --- Inline code --- */
  code {
    font-family: 'Consolas', 'SF Mono', Menlo, monospace;
    font-size: 9.5pt;
    background: var(--primary-light);
    color: var(--primary-darker);
    padding: 1px 6px;
    border-radius: 3px;
  }

  /* --- Code blocks (used by architecture diagram) --- */
  pre {
    background: #0E0B1E; color: #E9D5FF;
    padding: 14px 18px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'Consolas', 'SF Mono', Menlo, monospace;
    font-size: 8.5pt;
    line-height: 1.45;
    margin: 12px 0;
    page-break-inside: avoid;
  }
  pre code { background: transparent; color: inherit; padding: 0; font-size: inherit; }

  /* --- Tables — allowed to span pages with header row repeating --- */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0 16px;
    font-size: 10pt;
    background: white;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }
  /* Repeat the header row on every page the table spans */
  thead { display: table-header-group; background: linear-gradient(135deg, var(--primary), var(--blue)); }
  tbody { display: table-row-group; }
  thead th {
    color: white;
    text-align: left;
    padding: 10px 14px;
    font-weight: 700;
    font-size: 9.5pt;
    letter-spacing: 0.02em;
    border: none;
  }
  tbody td {
    padding: 8px 14px;
    vertical-align: top;
    border-top: 1px solid var(--border-soft);
  }
  tbody tr:nth-child(even) td { background: var(--bg-soft); }
  tbody tr td:first-child { font-weight: 600; color: var(--primary-darker); }
  /* Individual rows must never split across pages */
  tbody tr { page-break-inside: avoid; break-inside: avoid; }
  /* keep id columns mono */
  tbody tr td:first-child code { font-weight: 700; }

  /* --- Blockquotes (used for callouts like "Important constraint…") --- */
  blockquote {
    border-left: 4px solid var(--primary);
    background: var(--primary-light);
    color: var(--primary-darker);
    margin: 14px 0;
    padding: 12px 18px;
    border-radius: 0 10px 10px 0;
    font-style: italic;
    page-break-inside: avoid;
  }
  blockquote p { margin: 0; }

  /* --- Horizontal rule between major sections --- */
  hr {
    border: none;
    border-top: 1px dashed var(--border);
    margin: 28px 0;
  }

  /* --- Footer (printed on every page) --- */
  .footer {
    position: fixed;
    bottom: 8mm;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 8.5pt;
    color: var(--text-muted);
    letter-spacing: 0.06em;
  }

  /* --- Print rules --- */
  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
  }
  @media print {
    body { background: white; }
    .sheet {
      margin: 0;
      padding: 0;
      width: auto;
      min-height: 0;
      box-shadow: none;
      page-break-after: always;
    }
    .sheet:last-child { page-break-after: auto; }
    .cover { padding: 24mm 18mm; min-height: 0; height: 100vh; }
    a { color: var(--primary); text-decoration: none; }
    /* Hide screen-only nav helper if we ever add one */
    .screen-only { display: none !important; }
  }
</style>
</head>
<body>

<!-- ======================= COVER PAGE ======================= -->
<section class="sheet cover">
  <div>
    <div class="cover-top">
      ${logoData ? `<img class="cover-logo" src="${logoData}" alt="COKALO">` : ''}
      <span class="cover-brand">COKALO</span>
    </div>
  </div>

  <div>
    <div class="cover-eyebrow">${meta.tagline}</div>
    <h1 class="cover-title">Software Requirements &amp; <em>Commercial Proposal</em></h1>
    <p class="cover-sub">A consumer travel platform for <strong style="color:#C4B5FD">hotels</strong>, <strong style="color:#C4B5FD">water-sport experiences</strong>, and <strong style="color:#C4B5FD">bus tickets</strong> — built for the Indian market.</p>
  </div>

  <dl class="cover-meta">
    <div><dt>Project</dt><dd>${meta.project}</dd></div>
    <div><dt>Modules</dt><dd>${meta.modules}</dd></div>
    <div><dt>Prepared by</dt><dd>${meta.preparedBy}</dd></div>
    <div><dt>Document version</dt><dd>v${meta.version}</dd></div>
    <div><dt>Date</dt><dd>${meta.date}</dd></div>
    <div><dt>Validity</dt><dd>15 days from above</dd></div>
  </dl>
</section>

<!-- ======================= BODY ======================= -->
<section class="sheet">
  ${body}
</section>

<div class="footer">COKALO · SRS &amp; Proposal · ${meta.date}</div>

</body>
</html>`;

  fs.writeFileSync(outFile, html, 'utf8');
  console.log('Wrote', outFile, '(' + html.length.toLocaleString() + ' bytes)');
})();
