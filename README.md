# GameLedger 🏆 (Taskmaster Edition)

**GameLedger** is a standalone, offline-ready web application designed specifically for hosting, scoring, and presenting Taskmaster-style games, party game nights, and competitive multi-episode series.

---

## 🌟 Highlights

1. **Single-Person Operator Cockpit**:
   - Fast 1-click **5-4-3-2-1** rank scoring (supports ties & custom values).
   - **Disqualification (DQ)** stamp button with reason notes.
   - Built-in **Task Stopwatch & Countdown Clock** with audible chimes & buzzer.
   - Contestant attempt notes and timestamp recording.
   - Re-orderable task lists and multi-episode series management.

2. **Stage / Presentation Display Mode ("The Big Screen")**:
   - Designed for projecting to a TV, HDMI monitor, projector, or AirPlay.
   - Authentic **Taskmaster visual aesthetic**: deep crimson velvet, wax seals, warm aged parchment, gold filigree trim, and bold television typography.
   - **Step-by-Step TV Reveals**:
     - *Wax-Sealed Task Envelope*: Opens to reveal task brief & live timer.
     - *Contestant Attempts Showcase*: Photos/avatars, attempts, and times.
     - *Dramatic Score Reveal*: Points hidden behind wax seals, revealed one by one (lowest to highest) with audio cues!
     - *Animated Scoreboards*: Live score bars race for both current episode standings and cumulative series totals.
     - *Winner Ceremony*: Golden trophy podium, fanfare, and confetti bursts!

3. **Real-Time Dual-Screen Sync (`BroadcastChannel`)**:
   - Open the host controller on your laptop or phone.
   - Click **TV Popout** to open the Stage screen in a separate window (drag to TV/projector).
   - Any point awarded, view changed, or timer started on the host screen updates the TV screen **instantly with zero network or server needed**.
   - Also supports **1-Click Fullscreen Presentation** on a single device.

4. **100% Offline & Zero External Assets**:
   - Web Audio API synthesizer generates all sound cues dynamically in code (gong, wax seal break, countdown tick, buzzer, reveal chord, fanfare).
   - Persistent storage in browser `localStorage`.
   - Full **Export / Import to JSON** to save games or share them with friends.
   - Pre-loaded **Series 1 Demo** to test and demo immediately.

---

## 🚀 Quick Start

### Running Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or build and preview production bundle
npm run build
npm run preview -- --port 5173
```

Visit:
- **Host Control Panel**: `http://localhost:5173/`
- **TV / Stage Presentation Mode**: `http://localhost:5173/?stage=true` (or click **TV Popout** inside the app)

---

## ⌨️ Presentation Keyboard Shortcuts

When in Presentation Mode:
- <kbd>Space</kbd>: Reveal next contestant score (lowest to highest)
- <kbd>F</kbd>: Toggle Fullscreen
- <kbd>B</kbd>: Blackout Screen (for dramatic pauses)
- <kbd>Esc</kbd>: Exit embedded presentation mode

---

## 📄 Import & Export Schema

GameLedger supports backing up, restoring, and sharing entire game nights or multi-episode series via JSON.
- **Detailed Schema Documentation**: [docs/SCHEMA.md](docs/SCHEMA.md)
- **Formal JSON Schema**: [docs/gameledger.schema.json](docs/gameledger.schema.json)
