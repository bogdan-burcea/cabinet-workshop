# GitHub Pages deployment

The app is static HTML/CSS/JavaScript. PDF, DXF, CSV and NC files are generated in the browser. No backend, deployment secret or ChatGPT sign-in is needed.

## One-time setup

1. Create the public `cabinet-workshop` repository and upload this source, including `.github/workflows/pages.yml` and `public/assets/`.
2. In repository **Settings → Pages**, set **Source → GitHub Actions**.
3. Push to `main`, or run **Actions → Test and publish Cabinet Workshop → Run workflow**.
4. Use the deployment URL shown by GitHub Pages after the workflow succeeds.

Each update pushed to `main` runs the tests, builds the app, and publishes `dist/`. Pull requests run checks without publishing. Build output uses relative URLs, supporting both a project subdirectory and a custom-domain root.

## Local development

Requires Node.js 22:

```sh
npm ci
npm test
npm run build
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Compiled files in `dist/` and installed dependencies are excluded from source control.

## Existing cabinet projects

Browser-saved projects belong to the old website address and do not automatically transfer to this address. Export with **Save project** from the old app when available, then use **Open project** on the new app. Downloaded project JSON files continue to work. A public app does not upload your cabinet projects: calculations and file exports remain local to your browser.

## Source publication

This repository contains application code, tests, static font assets and license notices. It excludes hosting-provider identity/configuration, credentials, private source history, user project files, screenshots, generated CNC files and local build dependencies. A public repository does not grant an open-source license to the application code; no new application license has been selected. Bundled third-party assets retain their documented licenses.
