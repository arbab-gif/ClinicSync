# Organizer portal: Figma → HTML brief

Static HTML/CSS/JS pages in `clinicsync-player-app/organizer/`, served at `http://localhost:3000/organizer/`.
No framework, no build step, no Tailwind. Figma file key `4R2TuyfOKdZLUY4c2QXWIc`, page "Final Design".

## Before writing anything
1. Read `css/organizer.css` (tokens + shared components), `js/organizer.js` (data-attribute behaviours) and
   `dashboard.html` + `css/pages/dashboard.css`. Dashboard is the reference page: copy its `<head>`, header markup and conventions.
2. Load the Figma skill first: Skill `figma:figma-design-to-code`. Then load tools with ToolSearch
   `select:mcp__d9b92723-0e97-4556-b0ca-2a15c849aa7d__get_design_context,mcp__d9b92723-0e97-4556-b0ca-2a15c849aa7d__get_screenshot,mcp__d9b92723-0e97-4556-b0ca-2a15c849aa7d__get_metadata`.
   Every Figma call: fileKey `4R2TuyfOKdZLUY4c2QXWIc`, sessionId `021e283e-b075-4ad8-9ee2-4169563d2a05`,
   get_design_context also: skillNames `figma-design-to-code`, clientFrameworks `unknown`, clientLanguages `html,css,javascript`.

## How to build each screen
- One `get_design_context` per screen. If the response is huge or "sparse", fetch the visible child nodes instead.
  Write the page **right after** fetching it (don't hoard several responses in context).
- Convert the React/Tailwind reference into semantic HTML + CSS using the shared classes
  (`.o-header`, `.btn btn-*`, `.chip`, `.badge-*`, `.seg`, `.pills`, `.card`, `.stats`, `.datebox`, `.field/.input/.select`,
  `.search`, `.page`, `.back`, `.clinic-head`, `.tabs`, `.overlay/.modal/.drawer`, `.stepbar/.progress`, `.toast`).
  Replace absolute positioning with flex/grid. Match sizes, spacing, colours and text from the design exactly.
- Font is Clash Grotesk (already loaded via the fontshare link in the head). Use the CSS variables, not new hex values,
  unless the design uses a colour that has no token.
- Page-specific CSS goes in `css/pages/<name>.css`. **Do not edit `css/organizer.css`, `js/organizer.js` or any page you don't own.**
  If you need a reusable piece, define it in your own page CSS.
- Assets: download every image/SVG from the response with `curl -fsSL -o <path> <url>` into `assets/icons/<descriptive-name>.svg`
  or `assets/img/<descriptive-name>.png|jpg`. Never leave figma.com asset URLs in code. Before saving, check if a file with that
  name already exists (another agent may have saved the same icon). Reuse it only if it's the same icon; otherwise pick another name.
  Existing icons: ls `assets/icons/`.
- Interactivity (use `js/organizer.js` data attributes; add a small inline `<script>` only for page-specific logic):
  modals/drawers via `data-open="#id"` / `data-close`, dropdowns via `data-menu`, toggles via `data-group`,
  out-of-scope actions via `data-toast="..."`. Forms validate and navigate to the next page. Error/loading states from the
  design should be reproduced as real behaviour (e.g. wrong email shows the error state), not as separate pages.
- Responsive: desktop target is 1440 wide; make it collapse sensibly below 1100px and 720px (no horizontal scroll).
- Do NOT use the browser pane (another session uses it). Do not commit.

## Shared clinic header (all clinic-*.html pages)
```html
<main class="page">
  <a class="back" href="dashboard.html"><img class="icon" src="assets/icons/arrow-left.svg" alt="">My clinics</a>
  <div class="clinic-head">
    <div>
      <div class="clinic-title"><h1>Saturday</h1><img class="icon-24" src="assets/icons/caret-down.svg" alt=""><span class="chip">Tennis</span><span class="badge badge-ok">Active</span></div>
      <div class="clinic-meta"><span><img class="icon-20" src="assets/icons/calendar-blank.svg" alt="">Oct 3 – Nov 21 on Every Monday at 9:00 AM</span><span><img class="icon-20" src="assets/icons/map-pin.svg" alt="">Riverside Tennis Center</span></div>
    </div>
    <div class="clinic-actions"> <a class="btn btn-md btn-outline" href="clinic-messages.html">… Messages <span class="…">2</span></a> <button class="icon-btn">⋮</button> </div>
  </div>
  <nav class="tabs" aria-label="Clinic">
    <a href="clinic-overview.html">Overview</a><a href="clinic-sessions.html">Sessions</a><a href="clinic-players.html">Players</a>
    <a href="clinic-substitutes.html">Substitutes</a><a href="clinic-payments.html">Payments</a>
  </nav>
  …
```
Mark the current tab with `class="on"` and `aria-current="page"`. Match the Figma version of this header exactly
(icons/sizes) but keep these hrefs. Whoever builds it first saves arrow-left / chat / dots icons; check before downloading.

## File names (keep exactly, pages link to each other)
| Page | File |
|---|---|
| Sign in | sign-in.html |
| Forgot password | forgot-password.html |
| Verification code (6 digits) | verify-code.html (`?from=signup` variant goes to complete-profile) |
| Create new password | create-password.html |
| Password updated | password-updated.html |
| Sign up | sign-up.html |
| Complete profile | complete-profile.html |
| Create your first clinic (intro) | setup-clinic.html |
| Create clinic steps | create-clinic-1.html … create-clinic-5.html (step order from the designs' "Step N of 5") |
| Choose plan | create-clinic-plan.html |
| Clinic created | create-clinic-success.html |
| Dashboard (+ Connect Stripe modal) | dashboard.html (done) |
| Clinic overview | clinic-overview.html |
| Sessions list (+ session detail modal) | clinic-sessions.html |
| Sessions calendar | clinic-calendar.html |
| Players (+ filter dropdown) | clinic-players.html |
| Substitutes | clinic-substitutes.html |
| Payments (+ confirm payment modal, payment detail drawer) | clinic-payments.html |
| Group chat drawer over sessions | clinic-messages.html |

Flow: sign-in → dashboard; sign-up → verify-code?from=signup → complete-profile → setup-clinic → create-clinic-1 … 5 → plan → success → dashboard.

## Finish
Report: pages written, any screens skipped and why, assets added, and any Figma errors (e.g. the MCP tool-call limit: if you hit it,
stop, finish the pages you have data for, and list what's left).
