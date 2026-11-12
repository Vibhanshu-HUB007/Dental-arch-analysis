# Dental Arch Analysis Using AI

A password-protected static showcase website presenting pre-computed dental arch analysis results from 30+ patient upper arch STL models.

## Live Site

> After deploying to GitHub Pages, update this URL:
> `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## Features

- 🔐 Password-protected access
- 🦷 Interactive 3D STL viewer for each patient model
- 📊 Full measurement tables (Manual vs AI vs Calculated)
- 📈 Comparison charts (Chart.js)
- 📉 Aggregate statistics across all 30 models

## Setup Instructions

See `setup-instructions.txt` for full deployment steps.

### Quick Start

1. Copy the `Dataset/` folder (containing all `.stl` files) into this `website/` folder
2. Push this entire `website/` folder to a GitHub repository
3. In the repo Settings → Pages → set source to `main` branch, root `/`
4. Visit your GitHub Pages URL

### Changing the Password

Open `hash-generator.html` in your browser, enter your new password, copy the hash, and paste it into `js/config.js`.

## Project Structure

```
website/
├── index.html          Homepage (protected)
├── login.html          Login page
├── patients.html       Patient list (protected)
├── patient.html        Patient detail with 3D viewer (protected)
├── summary.html        Statistics overview (protected)
├── hash-generator.html Password hash generator tool
├── css/style.css       All styles
├── js/
│   ├── config.js       Password hash config
│   ├── auth.js         Auth logic
│   ├── data-loader.js  Data access layer
│   ├── patients-page.js
│   ├── patient-detail.js
│   └── summary-page.js
├── data/patients.json  All patient measurement data
└── Dataset/            STL files (copy here from source)
```

## Technology

- Pure HTML/CSS/JavaScript — no build tools required
- [Three.js r134](https://threejs.org/) — 3D STL viewer
- [Chart.js v4](https://www.chartjs.org/) — measurement charts
- Web Crypto API — client-side SHA-256 password hashing
