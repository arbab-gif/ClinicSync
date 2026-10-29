# ClinicSync — Organizer portal prototype

A clickable HTML/CSS/JS prototype of the ClinicSync organizer portal, coded from the Figma
"Final Design" page (Organizer Flow). No build step and no dependencies.

## Run it

    node serve.js 3000

Then open http://localhost:3000. It starts at **Sign in**; any email and password signs you in.
`http://localhost:3000/organizer/` lists every screen if you want to jump straight to one.

## What's in it

- `organizer/`: the organizer portal, one page per screen
  - Account: sign in, forgot password, verification code, new password, sign up
  - Onboarding: complete profile, create your first clinic, the 5-step create-clinic wizard, plans, success
  - Dashboard (with the Connect Stripe pop-up)
  - Clinic: overview, sessions list and calendar, players, substitutes, payments (fees breakdown,
    confirm payment, payment detail) and group chat (reaching late, request replacement)
  - Shared styles in `organizer/css/organizer.css`, per-page styles in `organizer/css/pages/`
- `serve.js`: tiny static server used to run the prototype

Not served right now (kept for later work):

- `index.html`, `app.js`, `styles.css`, `emails/`: the player onboarding prototype and invitation emails
- `design-gallery/`: exported Figma screen images
