# GameLedger Import / Export Schema Documentation

This document describes the JSON schema and data structures used for importing and exporting game series, episodes, contestants, tasks, and scores in **GameLedger**.

A formal JSON Schema specification is available at [`gameledger.schema.json`](file:///Users/victornghe/labs/gameledger/docs/gameledger.schema.json).

---

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Top-Level Object: `GameLedgerState`](#top-level-object-gameledgerstate)
3. [Entity Schemas](#entity-schemas)
   - [Contestant](#contestant)
   - [Episode](#episode)
   - [Task](#task)
   - [ScoreEntry](#scoreentry)
   - [PresentationConfig](#presentationconfig)
   - [TimerState](#timerstate)
4. [Minimal Valid Example](#minimal-valid-example)
5. [Complete Series Example](#complete-series-example)
6. [Import & Validation Rules](#import--validation-rules)

---

## 🏗️ Architecture Overview

The exported file is a single JSON document representing the full state of a series or game night. It is structured hierarchically:

```text
GameLedgerState
├── contestants: Contestant[]
├── episodes: Episode[]
│   └── tasks: Task[]
│       └── scores: Record<contestantId, ScoreEntry>
├── presentation: PresentationConfig
└── timer: TimerState
```

---

## 📦 Top-Level Object: `GameLedgerState`

| Property | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `version` | `number` | **Yes** | Schema format version. Current is `1`. |
| `seriesTitle` | `string` | **Yes** | The name of the game night or multi-episode series. |
| `taskmasterName` | `string` | No | Name of the Taskmaster host (default: `"The Taskmaster"`). |
| `assistantName` | `string` | No | Name of the scoring assistant (default: `"The Assistant"`). |
| `contestants` | `Contestant[]` | **Yes** | Array of participating players (minimum 2). |
| `episodes` | `Episode[]` | **Yes** | Array of episodes in the series (minimum 1). |
| `activeEpisodeId` | `string` | **Yes** | ID of the currently selected episode. |
| `activeTaskId` | `string \| null` | No | ID of the currently selected task for scoring/presenting. |
| `presentation` | `PresentationConfig` | No | Current view and state of the stage display screen. |
| `timer` | `TimerState` | No | Stopwatch or countdown clock state. |
| `soundEnabled` | `boolean` | No | Sound effects toggle (`true` / `false`). |

---

## 🧩 Entity Schemas

### Contestant

Represents a player competing in the series.

```typescript
interface Contestant {
  id: string;             // Unique identifier (e.g., "c1", "c_1726538400")
  name: string;           // Display name (e.g., "Alice")
  seatIndex: number;      // 0-based seating order position (0 to N-1)
  colorHex: string;       // Hex color for UI badges & score bars (e.g., "#3b82f6")
  avatar: string;         // Emoji symbol, SVG icon, or image data URL (e.g., "🦊")
  teamId?: "A" | "B" | null; // Optional team grouping for team tasks
}
```

- **Seating**: Contestants are traditionally placed in alphabetical order by first name on the TV show (`seatIndex: 0` is stage left / screen left).
- **Colors**: Hex format `^#[0-9a-fA-F]{6}$`.

---

### Episode

Represents an individual episode within a multi-episode series or standalone game night.

```typescript
interface Episode {
  id: string;             // Unique identifier (e.g., "ep1", "ep_1726538400")
  episodeNumber: number;  // 1-based sequential number
  title: string;          // Episode title (e.g., "The Wax and the Fury")
  tasks: Task[];          // List of tasks played in this episode
}
```

---

### Task

Represents an individual challenge within an episode.

```typescript
interface Task {
  id: string;             // Unique identifier (e.g., "t1_1")
  title: string;          // Display title (e.g., "Tower of Sustenance")
  brief: string;          // Instructions read from the wax envelope
  type: TaskType;         // Task category (see below)
  isTimed: boolean;       // Whether a timer / countdown is used
  timeLimitSeconds?: number; // Optional countdown duration (e.g., 600 for 10 mins)
  scores: Record<string, ScoreEntry>; // Map of contestantId -> ScoreEntry
  orderIndex: number;     // 0-based order position in the episode
  notes?: string;         // Optional private host notes
}

type TaskType = 
  | "prize"     // Contestants bring in an item matching a theme
  | "filmed"    // Location / pre-recorded solo challenge
  | "team"      // Team A vs Team B challenge
  | "studio"    // Live studio / finale showdown
  | "tiebreak"; // Sudden-death tie-breaker task
```

---

### ScoreEntry

Represents a single contestant's result and awarded points for a task.

```typescript
interface ScoreEntry {
  contestantId: string;        // Must match a Contestant ID
  points: number;              // Final points awarded (0 to 5 standard, or custom)
  isDisqualified: boolean;     // If true, points count as 0 on leaderboards
  dqReason?: string;           // Explanation for disqualification
  bonusPoints?: number;        // Optional bonus points included (e.g., +1)
  penaltyPoints?: number;      // Optional deduction applied (e.g., -1)
  timeTakenSeconds?: number;   // Attempt duration in seconds (e.g., 585)
  attemptNote?: string;        // Remark, item description, or measurement
  rank?: number;               // Task finish position (1 for 1st, 2 for 2nd, etc.)
}
```

#### Scoring Rules & Disqualifications:
- When `isDisqualified: true`, the leaderboard calculations automatically treat the contestant's score for this task as `0`, regardless of the `points` field.
- Negative scores (penalties) and decimal scores (fractional points) are supported.
- Ties are supported: multiple contestants may receive identical points and ranks.

---

### PresentationConfig

Controls what the Presentation / Stage Display screen shows to the audience.

```typescript
interface PresentationConfig {
  view: PresentationViewType;  // Currently active stage view
  revealedContestantIds: string[]; // Contestant IDs whose scores are revealed
  revealedAll: boolean;        // Whether all scores are revealed
  spotlightContestantId: string | null; // Highlighted contestant ID
  displayMessage: string | null; // Custom banner text
  bannerVisible: boolean;      // Toggle bottom quote banner
}

type PresentationViewType =
  | "idle"                // Stage holding screen with wax seal logo
  | "task_brief"          // Open wax-sealed parchment letter with timer
  | "attempts"            // Contestant attempts and notes showcase
  | "score_reveal"        // Step-by-step point reveals
  | "episode_leaderboard" // Current episode score bar chart
  | "series_leaderboard"  // Cumulative series totals
  | "winner";             // Champion podium, trophy, and confetti
```

---

### TimerState

Stores the active state of the stopwatch or countdown timer.

```typescript
interface TimerState {
  isRunning: boolean;     // Whether clock is currently ticking
  seconds: number;        // Current elapsed or remaining seconds
  initialLimit: number | null; // Starting countdown seconds (null for stopwatch)
  isCountdown: boolean;   // true = counting down to 0; false = stopwatch
}
```

---

## 📝 Minimal Valid Example

This is the minimal structure accepted by the GameLedger importer:

```json
{
  "version": 1,
  "seriesTitle": "Friday Game Night",
  "contestants": [
    {
      "id": "c1",
      "name": "Sam",
      "seatIndex": 0,
      "colorHex": "#3b82f6",
      "avatar": "🦊"
    },
    {
      "id": "c2",
      "name": "Alex",
      "seatIndex": 1,
      "colorHex": "#f59e0b",
      "avatar": "🦆"
    }
  ],
  "episodes": [
    {
      "id": "ep1",
      "episodeNumber": 1,
      "title": "Episode 1",
      "tasks": [
        {
          "id": "t1",
          "title": "Prize Task: Best Hat",
          "brief": "Bring in the best hat. Best hat wins.",
          "type": "prize",
          "isTimed": false,
          "orderIndex": 0,
          "scores": {
            "c1": {
              "contestantId": "c1",
              "points": 5,
              "isDisqualified": false,
              "attemptNote": "A traffic cone worn with confidence."
            },
            "c2": {
              "contestantId": "c2",
              "points": 3,
              "isDisqualified": false,
              "attemptNote": "A tiny sombrero on an egg."
            }
          }
        }
      ]
    }
  ],
  "activeEpisodeId": "ep1"
}
```

---

## 🌟 Complete Series Example

```json
{
  "version": 1,
  "seriesTitle": "Series 1: The Golden Head",
  "taskmasterName": "The Taskmaster",
  "assistantName": "Little Alex",
  "contestants": [
    {
      "id": "c1",
      "name": "Alice",
      "seatIndex": 0,
      "colorHex": "#3b82f6",
      "avatar": "🦊",
      "teamId": "A"
    },
    {
      "id": "c2",
      "name": "Bob",
      "seatIndex": 1,
      "colorHex": "#f59e0b",
      "avatar": "🦆",
      "teamId": "A"
    },
    {
      "id": "c3",
      "name": "Charlie",
      "seatIndex": 2,
      "colorHex": "#10b981",
      "avatar": "🦉",
      "teamId": "B"
    },
    {
      "id": "c4",
      "name": "Diana",
      "seatIndex": 3,
      "colorHex": "#8b5cf6",
      "avatar": "🐯",
      "teamId": "B"
    },
    {
      "id": "c5",
      "name": "Eddie",
      "seatIndex": 4,
      "colorHex": "#ef4444",
      "avatar": "🦔",
      "teamId": "B"
    }
  ],
  "episodes": [
    {
      "id": "ep1",
      "episodeNumber": 1,
      "title": "The Wax and the Fury",
      "tasks": [
        {
          "id": "t1_1",
          "title": "Prize Task: Aerodynamic Surprise",
          "brief": "Bring in the most unexpectedly aerodynamic object. Most aerodynamic item wins.",
          "type": "prize",
          "isTimed": false,
          "orderIndex": 0,
          "scores": {
            "c1": { "contestantId": "c1", "points": 4, "isDisqualified": false, "attemptNote": "Frozen crumpet (42m)." },
            "c2": { "contestantId": "c2", "points": 5, "isDisqualified": false, "attemptNote": "Garden gnome with fins." },
            "c3": { "contestantId": "c3", "points": 3, "isDisqualified": false, "attemptNote": "Vintage vinyl record." },
            "c4": { "contestantId": "c4", "points": 2, "isDisqualified": false, "attemptNote": "Stale French baguette." },
            "c5": { "contestantId": "c5", "points": 1, "isDisqualified": false, "attemptNote": "Heavy bowling ball." }
          }
        },
        {
          "id": "t1_2",
          "title": "Tower of Sustenance",
          "brief": "Build the tallest freestanding tower using only spaghetti and miniature marshmallows. You have 10 minutes. Your time starts now.",
          "type": "filmed",
          "isTimed": true,
          "timeLimitSeconds": 600,
          "orderIndex": 1,
          "scores": {
            "c1": { "contestantId": "c1", "points": 5, "isDisqualified": false, "timeTakenSeconds": 585, "attemptNote": "114cm geodesic dome." },
            "c2": { "contestantId": "c2", "points": 2, "isDisqualified": false, "timeTakenSeconds": 590, "attemptNote": "22cm melted ball." },
            "c3": { "contestantId": "c3", "points": 4, "isDisqualified": false, "timeTakenSeconds": 600, "attemptNote": "88cm tripod." },
            "c4": { "contestantId": "c4", "points": 3, "isDisqualified": false, "timeTakenSeconds": 540, "attemptNote": "70cm collapsed top." },
            "c5": { "contestantId": "c5", "points": 0, "isDisqualified": true, "dqReason": "Ate all marshmallows in 90 seconds." }
          }
        }
      ]
    }
  ],
  "activeEpisodeId": "ep1",
  "activeTaskId": "t1_1",
  "presentation": {
    "view": "score_reveal",
    "revealedContestantIds": ["c5", "c4", "c3"],
    "revealedAll": false,
    "spotlightContestantId": null,
    "displayMessage": null,
    "bannerVisible": false
  },
  "timer": {
    "isRunning": false,
    "seconds": 0,
    "initialLimit": null,
    "isCountdown": false
  },
  "soundEnabled": true
}
```

---

## 🔄 Import & Validation Rules

When importing a file via **Options > Import Series (JSON)**:

1. **File Format**: The file must be valid JSON with UTF-8 encoding.
2. **Required Fields**:
   - `contestants` (Array with at least 2 contestants)
   - `episodes` (Array with at least 1 episode)
3. **Graceful Defaults**:
   - If `version` is omitted, defaults to `1`.
   - If `seriesTitle` is omitted, defaults to `"My Taskmaster Game Night"`.
   - If `activeEpisodeId` is invalid or missing, defaults to the ID of the first episode.
   - If `presentation` is omitted, defaults to `{ view: "idle", revealedContestantIds: [], revealedAll: false }`.
   - If `timer` is omitted, defaults to stopped at 0 seconds.
   - If `soundEnabled` is omitted, defaults to `true`.
4. **Export Behavior**:
   - The export filename pattern is: `gameledger-<slugified-title>-<timestamp>.json`
   - Content is pretty-printed with 2 spaces for human readability.
