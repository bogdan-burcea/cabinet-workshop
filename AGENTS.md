# Working guidelines

- Read `README.md`, `package.json` and `.github/workflows/pages.yml` before making changes. README release notes include historical behavior; confirm current behavior in source.
- Preserve the Carbon design style: IBM Plex typography, Carbon icons, neutral surfaces, blue accents, existing spacing tokens and accessible controls. Reuse established components and patterns.
- Make targeted edits in the responsible modules; avoid broad rewrites or unrelated cleanup. The build entry is `src/workbench/app.js`; shared UI styles live in `public/carbon.css` and `public/cabinet.css`.
- Preserve saved-project compatibility, Undo, validation and manufacturing/export geometry. Diagnose reported discrepancies before changing defaults or formulas.
- Use Node.js 22 to match CI. Setup: `npm ci`. Validate with `npm test` and `npm run build`; review UI changes across panels/dialogs and desktop/mobile sizes.
- Preview the build with `python3 -m http.server 8000 --bind 127.0.0.1 --directory dist`. Build output and dependencies stay untracked.
- Work on feature branches and submit pull requests to `main`; include scope and validation results. Do not push directly to `main`.
- GitHub Pages already deploys `main` automatically after checks pass. Pull requests run checks without deployment. Do not merge, publish or trigger deployment without authorization.
- Track pending work and confirmed findings in `BACKLOG.md`; distinguish hypotheses from verified causes.
