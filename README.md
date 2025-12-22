# Newt Site

Local static site for Newt (puppy) — vlogging, gallery, daily updates, and a skill tree.

Run locally:

```bash
# from /Users/clare/Newt\ Site
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Deployment notes:
- `CNAME` contains `newt.dog`.
- The contact form has `data-netlify="true"` and will work on Netlify when forms are enabled; otherwise the form falls back to `mailto:lordnewtguillemot@gmail.com`.

Assets are in `assets/`. Styles in `style.css` and behavior in `script.js`.
