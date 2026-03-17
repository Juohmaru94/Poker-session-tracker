# Poker Session Tracker

A local-first poker session tracker with a playful visual style, smooth dynamic forms, and a clear migration path to a native Windows desktop app.

## Why this architecture

- **Local-first:** Uses `localStorage` so sessions are available instantly offline.
- **Component-based structure:** UI is split into focused modules (`sessionForm`, `sessionTable`, `store`, `helpers`) to keep logic maintainable.
- **Desktop-ready path:** The app runs as a static web app now and can later be wrapped with **Tauri** or **Electron** with minimal UI rewrite.

## Run locally

No build step is required.

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Implemented features

- Session logging with core fields:
  - Date
  - Location
  - Game type
  - Variant
  - Tournament name (when relevant)
  - Optional duration
- Dynamic form behavior:
  - **Tournament / Sit & Go:** buy-in, amount won, position finished, ITM checkbox, entrants when ITM.
  - **Cash:** money in and money out.
- Current bankroll display (top-right):
  - Starts at €0
  - Green when positive
  - Red when negative
  - Auto-calculated from all saved sessions
- Editable and deletable past sessions
- Search + filters for session history
- Responsive desktop-friendly layout with funky/polished styling

## Suggested next steps toward a native Windows app

1. Add TypeScript and a framework (React/Vue/Svelte) if desired, keeping the same data model.
2. Replace `localStorage` with SQLite (or keep both with sync/migration).
3. Wrap the UI with Tauri for a lightweight native Windows `.exe`.
4. Add import/export, backup, and richer bankroll analytics.

## Sharing the app

- Keep the source code in GitHub.
- Do not commit `node_modules`, `.npm-cache`, or packaged `.exe` files.
- Build the Windows app locally, then upload the packaged executable as a GitHub Release asset or share it via cloud storage.
