# Agentic Engineering Guide: GameLedger

This document serves as the operational handbook for **autonomous AI coding agents** (and engineers orchestrating agent workflows) contributing to or refactoring the **GameLedger** repository.

---

## 🤖 1. Agent Mental Model & Architecture Map

When entering the codebase, agents should conceptualize GameLedger as three interconnected layers:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        1. Central State Machine                        │
│                 src/context/GameContext.tsx (Single Source)            │
│  - BroadcastChannel('gameledger_sync_channel')                         │
│  - LocalStorage('gameledger_state_v1')                                 │
│  - Web Audio API procedural synthesizer (src/utils/audio.ts)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│  2. Operator Cockpit (Host)     │   │  3. Stage Display (Theatrical TV)│
│  src/components/host/*          │   │  src/components/presentation/*   │
│  - Fast rapid scoring inputs    │   │  - Step-by-step reveal sequences │
│  - Participant assignments      │   │  - Hidden points & wax seals     │
│  - Subtask managers & bets      │   │  - Confetti & audio feedback     │
│  - Physical print generator     │   │  - Racing animated scoreboards   │
└─────────────────────────────────┘   └──────────────────────────────────┘
```

---

## 🛠️ 2. Step-by-Step Implementation Recipes

### Recipe 1: Adding a New Stage Presentation View

To add a new theatrical TV view (e.g., `'tiebreak_showdown'`):

1. **Update View Type**:
   In [`src/types/index.ts`](../src/types/index.ts), add the view key to `PresentationViewType`:
   ```typescript
   export type PresentationViewType =
     | 'idle'
     | 'task_brief'
     | 'attempts'
     | 'score_reveal'
     | 'episode_leaderboard'
     | 'series_leaderboard'
     | 'winner'
     | 'tiebreak_showdown'; // <-- New view
   ```
2. **Create View Component**:
   In `src/components/presentation/views/TiebreakShowdownView.tsx`, implement the presentation component using `useGame()` to read state and trigger procedural audio cues.
3. **Mount in View Router**:
   In [`src/components/presentation/PresentationScreen.tsx`](../src/components/presentation/PresentationScreen.tsx):
   - Add a case in `renderCurrentView()`:
     ```typescript
     case 'tiebreak_showdown':
       return <TiebreakShowdownView />;
     ```
4. **Add Director Button**:
   In [`src/components/host/StageDirectorBar.tsx`](../src/components/host/StageDirectorBar.tsx), add an entry to `viewButtons`:
   ```typescript
   { id: 'tiebreak_showdown', label: 'Tiebreak', icon: Swords },
   ```
5. **Verify Dual-Screen Sync**:
   Verify that clicking the button on the host dashboard changes the view on both the host and the popped-out stage window (`?stage=true`).

---

### Recipe 2: Adding a Procedural Web Audio Sound Cue

GameLedger enforces **zero external audio files or CDNs**. All audio must be synthesized via the Web Audio API.

1. **Implement Oscillator Circuit**:
   In [`src/utils/audio.ts`](../src/utils/audio.ts), export a new synthesis function:
   ```typescript
   export function playGongSound() {
     const ctx = getAudioContext();
     if (!ctx) return;
     const now = ctx.currentTime;
     const osc = ctx.createOscillator();
     const gain = ctx.createGain();
     osc.type = 'sine';
     osc.frequency.setValueAtTime(120, now);
     gain.gain.setValueAtTime(0.5, now);
     gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
     osc.connect(gain);
     gain.connect(ctx.destination);
     osc.start(now);
     osc.stop(now + 1.25);
   }
   ```
2. **Register Sound Type**:
   In [`src/types/index.ts`](../src/types/index.ts):
   ```typescript
   export type SoundType = 'seal' | 'tick' | 'buzzer' | 'reveal' | 'dq' | 'fanfare' | 'gong';
   ```
3. **Dispatch in Audio Router**:
   In [`src/context/GameContext.tsx`](../src/context/GameContext.tsx), add a case to `playAudioCue`:
   ```typescript
   case 'gong':
     playGongSound();
     break;
   ```
4. **Trigger Cue**:
   Call `triggerSound('gong')` from anywhere inside `GameContext` or host components. This automatically plays locally and broadcasts the audio event over `BroadcastChannel` to secondary screens.

---

### Recipe 3: Modifying or Extending Scoring Rules

When adding a scoring mode (e.g., `'weighted_average'` for subtasks):

1. **Update Subtask Mode Types**:
   In [`src/types/index.ts`](../src/types/index.ts):
   ```typescript
   export type SubtaskScoringMode = 'sum' | 'final_rank' | 'custom' | 'weighted_average';
   ```
2. **Update Calculation Function**:
   In [`src/context/GameContext.tsx`](../src/context/GameContext.tsx), locate `calculateParentScoresFromSubtasks` and implement the math.
3. **Add Automated Unit Tests**:
   In [`tests/scoring.test.mjs`](../tests/scoring.test.mjs), add an explicit test block asserting correct calculation, tie ranking, and DQ handling for the new mode.
4. **Run Verification**:
   ```bash
   npx tsx tests/scoring.test.mjs
   ```

---

### Recipe 4: Updating Schema & Preserving Backward Compatibility

Whenever introducing new fields to `GameLedgerState`, `Task`, `Episode`, or `Contestant`:

1. **Optional in TypeScript**:
   Mark new fields as optional (`field?: string`) in [`src/types/index.ts`](../src/types/index.ts).
2. **Hydration Fallback Default**:
   In [`src/context/GameContext.tsx`](../src/context/GameContext.tsx), update `ensureStateDefaults(state)` to supply sensible defaults for older exported JSON files:
   ```typescript
   const ensureStateDefaults = (s: GameLedgerState): GameLedgerState => {
     return {
       ...s,
       myNewField: s.myNewField ?? defaultValue,
     };
   };
   ```
3. **Update Authoritative Docs & JSON Schema**:
   - Update [`docs/SCHEMA.md`](./SCHEMA.md).
   - Update [`docs/gameledger.schema.json`](./gameledger.schema.json).

---

## 🚫 3. Critical Anti-Patterns to Avoid

| Anti-Pattern | Why It Breaks the App | Correct Alternative |
| :--- | :--- | :--- |
| **Adding `.mp3` or `.wav` files** | Breaks zero-dependency offline guarantee and adds bundle bloat. | Synthesize programmatically with Web Audio API in [`src/utils/audio.ts`](../src/utils/audio.ts). |
| **Hardcoding absolute paths (`/assets/...`)** | Breaks deployment on subpaths and GitHub Pages (`/gameledger/`). | Always use relative paths (`./...`) and keep `base: './'` in `vite.config.ts`. |
| **Direct mutable state edits (`state.episodes[0] = ...`)** | Breaks React reactivity, race conditions with timers, and fails to broadcast. | Use `updateAndBroadcastState((prev) => ...)` functional updaters. |
| **Revealing master task title in TaskBriefView** | Spoils the surprise task in Taskmaster game nights. | Strictly hide master task title on TV brief screen; show only part numbers if enabled. |
| **Incrementing task count for sat-out contestants** | Skews completed task averages and player statistics. | Filter out entries where `isSatOut === true` in task counters. |
| **Leaving unused imports/variables** | `tsconfig.json` has `"noUnusedLocals": true` and `"noUnusedParameters": true`; build fails. | Clean up all unused variables and run `npm run build` before completing work. |

---

## ✅ 4. Definition of Done (Checklist for AI Agents)

Before closing any agentic task or presenting results to the user:

- [ ] **Tests Pass**: Run `npx tsx tests/scoring.test.mjs` and `npx tsx tests/print.test.mjs`.
- [ ] **Clean Production Build**: Run `npm run build` (`tsc && vite build`) with 0 errors or warnings.
- [ ] **No Dead Code**: Zero unused variables, imports, or stray `console.log` statements.
- [ ] **Dual-Screen Sync Preserved**: Any new state is broadcast across `BroadcastChannel`.
- [ ] **Documentation Synchronized**: All relevant documents in `docs/` updated.
