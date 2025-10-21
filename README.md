# Ulric — Vite + React port

This project is a conversion of the original static portfolio into a small Vite + React app.

Quick start (Windows PowerShell):

```powershell
npm install
npm run dev
```

Open http://localhost:5173

Build and preview:

```powershell
npm run build
npm run preview
```

Notes:
- Static assets in `public/` are served at the site root (e.g. `/h1.jpg`).
- The hero image `main.jpg` is bundled via an import in `src/App.jsx`, so it’s included in the production build.
- Background images are referenced in CSS and will be processed by Vite during build.
# ulric