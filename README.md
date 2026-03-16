# Poker Session Tracker (Local-First)

A private, desktop-style poker tracking app that runs entirely on your own machine and stores all data locally (no cloud, no accounts, no SaaS).

## Why this app exists

Serious players need a **fast logging flow** and **high-signal review workflow**:
- Log sessions in seconds.
- Add deeper qualitative notes for long-term leaks and pattern analysis.
- See meaningful bankroll and performance trends quickly.
- Keep all sensitive poker data fully private.

## Core product principles

- **Local-first:** all state is persisted in `localStorage` on your own computer.
- **Private by default:** there is no server, no login, no external API.
- **Fast UX:** one-page app with instant filtering/sorting and no network latency.
- **Player-centric design:** dark mode, polished cards, poker-focused metrics, bankroll analytics.

## Features

### 1) Dashboard
- Total P/L
- Current bankroll
- Total sessions + total hours
- Hourly win rate
- Average session
- Best/worst session
- Current streak (winning or losing)
- Built-in insights (live vs online edge, best variant, tilt impact)
- Charts:
  - Profit over time
  - Bankroll over time
  - Profit by stakes
  - Activity by month

### 2) Session logging (quick + deep)
Each session supports:
- Date
- Location/site
- Live or online
- Cash or tournament
- Variant (NLH/PLO/Mixed/Other)
- Stakes / buy-in
- Money in / money out / rebuys
- Duration
- Auto-calculated net P/L

Optional quality and journal data:
- Mood, focus, tilt, energy
- Self-rated quality of play
- Table softness
- Tags
- Notes (hands, reads, mistakes, lessons)

Tournament extras:
- Field size
- Finishing position
- Payout
- ROI
- ITM flag
- Final table flag

### 3) Session history + detail workflow
- Search
- Sort by key columns
- Rich filtering by mode/format/variant/stakes/location/result/date range
- Edit, duplicate, delete
- Detail modal includes:
  - Full financial breakdown
  - Hourly rate
  - Context vs overall average
  - Performance at same stake
  - Performance at same location
  - Qualitative journaling fields

### 4) Bankroll management
- Starting bankroll
- Live and online buckets
- Ledger entries (deposit / withdrawal / transfer)
- Stats:
  - Peak bankroll
  - Current bankroll
  - Biggest drawdown
  - Recovery progress
  - Ledger activity

### 5) Local data ownership tools
- JSON backup
- JSON restore
- CSV export
- Seed demo dataset for instant exploration

## Tech stack

This implementation is dependency-free and runs as a local static app:
- HTML5
- Modern CSS (responsive layout + dark mode)
- Vanilla JavaScript (ES modules)
- Canvas-based mini chart rendering
- Browser `localStorage` for persistence

> Note: The architecture is intentionally local-first and easy to evolve into a TypeScript + React + SQLite desktop wrapper (e.g., Tauri/Electron) while preserving the same domain model.

## Run locally

Because this is a static app, you can run it with any local HTTP server.

### Option A (Python)
```bash
python3 -m http.server 4173
```
Open: `http://localhost:4173`

### Option B (Node)
```bash
npx serve .
```
Open the URL shown in terminal.

## Data format

All data is stored under localStorage key:
- `poker-tracker-v1`

Theme preference key:
- `poker-theme`

## Recommended next upgrades

- Move persistence from localStorage to SQLite (via Tauri/Electron)
- Add schema migration/versioning
- Add stake-normalized EV views
- Add opponent pool tags and location win-rate heatmaps
- Add unit tests for financial/stat calculations

---

If you want, I can produce a **desktop-packaged version (Tauri + React + TypeScript + SQLite)** next while keeping this exact UX and feature set.
