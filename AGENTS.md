# Project Workflow

This project is the static Vite + React site for "老船长航海日志".

## Local-first update flow

- When the user asks for content, design, or code changes, edit the local project first.
- Do not use the user's logged-in browser for GitHub edits unless the local Git route is blocked and the user explicitly approves it.
- Before publishing, guide the user to preview locally in Cursor:
  - Open `/Users/waimaolaochuanzhang/Documents/船长航海日志` in Cursor.
  - Run `npm install` once if `node_modules` is missing.
  - Run `npm run dev`.
  - Preview the local URL shown by Vite, usually `http://127.0.0.1:5173/`.
- Only push to GitHub after the user confirms the local preview looks correct.

## Publishing flow

- After local confirmation, use Git from the project folder:
  - `git status`
  - `git pull --rebase origin main`
  - `git add <changed files>`
  - `git commit -m "<clear message>"`
  - `git push origin main`
- If there is a rebase conflict, resolve it locally, validate the site data, then continue with `GIT_EDITOR=true git rebase --continue`.
- GitHub Pages publishes from the `main` branch via Actions.

## Content data

- Daily log content lives in `src/data/logs.json`.
- Validate content after edits with `node scripts/validate-data.mjs`.
- Keep `publishedAt` in ISO format with `+08:00` and write display content in Chinese.
- Use `type: "practice"` for technical/actionable items and `type: "news"` for industry updates.
- `sourceName` must describe the concrete platform, account, or official site that the item came from, such as `Google Search Central`, `Search Engine Land`, `X @handle`, or `LinkedIn @handle`. Do not use local document filenames or note titles as the source name.

## Daily brief integration rule

- When the user sends today's "latest practical brief" items, deduplicate before writing into project content.
- Deduplication scope is only within the same day’s incoming briefs, not against historical logs from previous days.
- Merge highly similar or overlapping items into one integrated entry, keeping only non-redundant key points.
- Keep final wording concise, avoid repeated expressions, and preserve the most actionable information.
