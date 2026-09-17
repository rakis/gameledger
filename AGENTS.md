# Agent Instructions: GameLedger

This document serves as the primary operational and behavioral guide for AI coding agents (and human contributors) interacting with the **GameLedger** repository.

---

## 🎯 Project Overview

**GameLedger** is a standalone, client-side web application crafted for tracking, scoring, and presenting Taskmaster-style games, party game nights, and competitive multi-episode series.

### Core Stack
- **Framework**: React 19 + TypeScript 7 + Vite 8
- **Styling**: Tailwind CSS 4 (@tailwindcss/vite) + Custom Taskmaster theme utilities (parchment, wax seal, gold accents)
- **Icons**: Lucide React
- **Celebration / Audio**: `canvas-confetti` + Native Web Audio API synthesizer (zero external audio files)
- **State & Sync**: React Context + `localStorage` + `BroadcastChannel` (for instant multi-screen control)
- **Deployment**: GitHub Pages via GitHub Actions workflow (`.github/workflows/deploy.yml`)

---

## 📂 Architecture & Directory Layout

```text
gameledger/
├── .github/workflows/
│   └── deploy.yml            # Automated CI/CD pipeline for GitHub Pages
├── docs/
│   ├── SCHEMA.md             # Authoritative import/export schema specification
│   └── gameledger.schema.json # Formal JSON Schema (Draft 2020-12)
├── public/
│   └── wax-seal.svg          # Favicon & wax seal SVG emblem
├── src/
│   ├── components/
│   │   ├── host/             # Host / Scorer Cockpit (single-user operator view)
│   │   │   ├── ContestantManagerModal.tsx
│   │   │   ├── HostDashboard.tsx
│   │   │   ├── HostHeader.tsx
│   │   │   ├── HostSummaryDrawer.tsx
│   │   │   ├── NewTaskModal.tsx
│   │   │   ├── StageDirectorBar.tsx
│   │   │   ├── TaskListSidebar.tsx
│   │   │   └── TaskScorerPanel.tsx
│   │   └── presentation/     # Theatrical Big Screen Stage View (for TV/projector)
│   │       ├── PresentationScreen.tsx
│   │       └── views/
│   │           ├── AttemptsView.tsx
│   │           ├── IdleStageView.tsx
│   │           ├── LeaderboardView.tsx
│   │           ├── ScoreRevealView.tsx
│   │           ├── TaskBriefView.tsx
│   │           └── WinnerCeremonyView.tsx
│   ├── context/
│   │   └── GameContext.tsx   # Central state management & BroadcastChannel sync
│   ├── data/
│   │   └── demoData.ts       # Pre-packaged Series 1 demo state & empty state
│   ├── types/
│   │   └── index.ts          # Core TypeScript interfaces and type definitions
│   ├── utils/
│   │   └── audio.ts          # Web Audio API procedural sound cues
│   ├── App.tsx               # View routing (Stage mode ?stage=true vs Host cockpit)
│   ├── index.css             # Tailwind 4 theme + custom parchment & wax seal styling
│   ├── main.tsx              # Application entry point
│   └── vite-env.d.ts         # Vite client type references
├── tests/
│   └── scoring.test.mjs      # Unit tests for scoring logic, DQs, and ranks
├── index.html                # HTML entry point (relative favicon & script links)
├── package.json
├── tsconfig.json             # Strict TypeScript compiler options
└── vite.config.ts            # Vite config with base: './' & @tailwindcss/vite
```

---

## ⚡ Essential Commands

### Development
```bash
# Install dependencies
npm install

# Start local dev server (default port: 5173)
npm run dev

# Run local preview server on host/port
npm run preview -- --port 5173
```

### Testing & Verification
```bash
# Run unit test suite (scoring, ties, DQs, rank calculations)
npx tsx tests/scoring.test.mjs

# Typecheck and build production bundle
npm run build
```

---

## 🛡️ Critical Rules & Invariants for Agents

### 1. Offline-First & Zero External Runtime Dependencies
- **No external audio files or CDNs**: All sound effects (chimes, ticks, buzzers, sad DQ trombone, fanfares) MUST be synthesized programmatically using the browser **Web Audio API** in [`src/utils/audio.ts`](src/utils/audio.ts). Do not add `.mp3`, `.wav`, or external audio CDN URLs.
- **Self-contained fonts & graphics**: The app must function cleanly without network connectivity. System font fallbacks (`Playfair Display`, `Courier Prime`, `Georgia`, `monospace`) and local SVG assets must always be supported.

### 2. Relative Base Path (`base: './'`)
- In [`vite.config.ts`](vite.config.ts), `base: './'` is mandatory so the app resolves assets correctly whether served at:
  - Localhost root (`http://localhost:5173/`)
  - Subpaths / GitHub Pages (`https://<user>.github.io/<repo>/`)
- Do not hardcode absolute paths like `/assets/...` or `/wax-seal.svg` in HTML/CSS/JS; use relative paths `./...`.

### 3. Dual-Screen Sync via `BroadcastChannel`
- Communication between the Host Controller and Presentation Display happens through:
  1. Browser `BroadcastChannel('gameledger_sync_channel')`
  2. Fallback persistence in `localStorage`
- Whenever introducing new host actions or stage display states, ensure the event/command is broadcast across the channel so the secondary TV screen reflects changes in real time.

### 4. TypeScript Strictness
- `tsconfig.json` enforces:
  - `"noUnusedLocals": true`
  - `"noUnusedParameters": true`
  - `"strict": true`
- Do not leave unused imports, variables, or function arguments. Run `npm run build` to verify every change before finishing tasks.

### 5. Schema Integrity & Backward Compatibility
- If you modify or extend state fields (`Contestant`, `Episode`, `Task`, `ScoreEntry`, `PresentationConfig`):
  1. Update TypeScript types in [`src/types/index.ts`](src/types/index.ts).
  2. Update [`docs/SCHEMA.md`](docs/SCHEMA.md) documentation.
  3. Update [`docs/gameledger.schema.json`](docs/gameledger.schema.json).
  4. Ensure existing export/import JSON files load gracefully with sensible fallback defaults.

### 6. Design System & Aesthetics
- Retain the authentic British TV Taskmaster ambiance:
  - **Color Palette**: Deep crimson/burgundy velvet (`#0d0406`, `#8b111e`, `#56070f`), gold filigree (`#cba052`, `#ffd700`, `#f6e4b8`), aged parchment paper (`#f7f1df`, `#efe3c3`).
  - **Typography**: Serif titles (`font-serif`), typewriter task text (`font-typewriter`), clean sans for rapid data entry controls.
  - **Disqualifications**: Always display with bold red dashed DQ stamp styling and 0 points.

---

## 🧪 Definition of Done (Checklist)

Before proposing, committing, or closing any task:
- [ ] Code passes TypeScript compilation without errors: `npm run build`
- [ ] Scoring logic tests pass: `npx tsx tests/scoring.test.mjs`
- [ ] No unused variables, arguments, or imports
- [ ] Dual-screen Presentation Mode tested or preserved
- [ ] Git commit messages follow clear, descriptive imperative phrasing
