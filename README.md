# SAT Prep Tracker

A simple static website to track SAT practice test scores, rate topic confidence, and schedule study sessions. No build step, no server, no accounts. Data is saved in the browser (localStorage).

## Features
- **Dashboard**: days to test, latest/best score, gap to target, weekly study time, score trend chart, focus areas
- **Practice Tests**: log Reading & Writing + Math scores with notes
- **Topics**: rate confidence (1–5) for the Digital SAT content areas
- **Schedule**: generate a plan up to the test date (weaker topics get more sessions, periodic full practice tests), add custom sessions, tick them off
- **Settings**: name, test date, target score, export/import backup

## Host on GitHub Pages
1. Create a new repository on GitHub (e.g. `sat-tracker`).
2. Upload `index.html`, `style.css`, `app.js` and `README.md` (use **Add file → Upload files**).
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**, then Save.
5. After a minute your site is live at `https://<your-username>.github.io/sat-tracker/`.

## Important notes
- Data lives in the browser it was entered in. Use **Settings → Export data** regularly and **Import data** to move to another device.
- Anyone with the URL can open the site, but they only see their own (empty) data, never yours. If you prefer, make the repo private (GitHub Pages for private repos needs a paid plan) or simply don't share the link.
- Official free practice tests: the College Board **Bluebook** app and Khan Academy's SAT practice.
