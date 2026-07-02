# Global A-Level Explorer

A static, three-layer site connecting **A-Level subjects → undergraduate program families → universities**, with a client-side eligibility-matching engine. Built with plain HTML, CSS and JavaScript — no framework, no backend.

## Run it

**Deploy (recommended):** push this folder to a GitHub repo, then turn on **Settings → Pages** for the `main` branch. Works immediately, since Pages serves over HTTPS and the `fetch()` calls to `data/*.json` need a real HTTP origin.

**Preview locally:** don't just double-click `index.html` — browsers block `fetch()` of local files over `file://`. Instead, from this folder run:

```bash
python3 -m http.server 8000
```

then open `http://localhost:8000`.

## Structure

```
index.html / subjects.html / programs.html / universities.html / eligibility.html / careers.html / islamic-rulings.html / about.html
css/styles.css
js/script.js          # data loading, rendering, eligibility matching engine
data/subjects.json     # 82 A-Level subjects
data/programs.json     # 24 degree program families
data/universities.json # 20 individually-verified universities
data/relationships.json# 40 verified (university, program) offer records
data/fiqh.json         # 11 sourced Islamic-ruling themes covering all 24 programs
```

## Islamic Rulings layer

`islamic-rulings.html` is a research compilation — not a fatwa — of what recognised scholars and fatwa bodies have said about studying and working in each field, citing the Qur'an (by sūrah:āyah), Sunnah (by collection and number), and named fatwa sources. Program cards on `programs.html` link straight to the relevant ruling. Full methodology and disclaimer are on `about.html` and at the top of `islamic-rulings.html`.

## Scope

This is a curated, individually-verified starter dataset — not a claim to cover every program at every university worldwide. Full methodology, every source used, and the roadmap for extending it live in **`about.html`**.
