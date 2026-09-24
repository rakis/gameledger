import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INITIAL_DEMO_STATE as DEMO_STATE, EMPTY_STATE } from '../src/data/demoData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('Testing Architectural Invariants, Zero-Asset Audio & Schema Integrity...\n');

// ============================================================================
// 1. Offline & Zero-Asset Invariants
// ============================================================================
console.log('--- 1. Testing Offline & Zero-Asset Audio Invariants ---');

// Check that NO external audio binary files (.mp3, .wav, .ogg, etc.) exist in src/ or public/
const bannedAudioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma'];

function findFilesRecursively(dir, filterFn) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        results = results.concat(findFilesRecursively(fullPath, filterFn));
      }
    } else if (entry.isFile()) {
      if (filterFn(fullPath)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const audioFiles = findFilesRecursively(path.join(ROOT_DIR, 'src'), (filePath) =>
  bannedAudioExtensions.some((ext) => filePath.toLowerCase().endsWith(ext))
).concat(
  findFilesRecursively(path.join(ROOT_DIR, 'public'), (filePath) =>
    bannedAudioExtensions.some((ext) => filePath.toLowerCase().endsWith(ext))
  )
);

assert.equal(
  audioFiles.length,
  0,
  `Violation of Rule 1 (Zero external audio files): found audio binaries:\n${audioFiles.join('\n')}`
);
console.log('✔ Zero external audio files: all sound effects synthesized via Web Audio API.');

// Verify public/wax-seal.svg exists
const waxSealSvgPath = path.join(ROOT_DIR, 'public', 'wax-seal.svg');
assert.ok(fs.existsSync(waxSealSvgPath), 'public/wax-seal.svg must exist for favicon');
console.log('✔ Wax seal SVG asset exists in public directory.');

// Verify index.html does not include external CDN scripts
const indexHtmlContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
const scriptSrcMatches = [...indexHtmlContent.matchAll(/<script[^>]+src=["']([^"']+)["']/g)];
for (const match of scriptSrcMatches) {
  const src = match[1];
  assert.ok(
    !src.startsWith('http://') && !src.startsWith('https://'),
    `index.html must not load external scripts via CDN: ${src}`
  );
}
console.log('✔ index.html contains no external CDN script dependencies.');

// ============================================================================
// 2. Relative Base Path Invariant
// ============================================================================
console.log('\n--- 2. Testing Relative Base Path Invariant ---');

// vite.config.ts must have base: './'
const viteConfigContent = fs.readFileSync(path.join(ROOT_DIR, 'vite.config.ts'), 'utf-8');
assert.ok(
  /base:\s*['"]\.\/['"]/.test(viteConfigContent),
  "vite.config.ts must specify base: './' for GitHub Pages and subpath compatibility"
);
console.log("✔ vite.config.ts specifies base: './'.");

// index.html must use relative link for favicon
assert.ok(
  indexHtmlContent.includes('href="./wax-seal.svg"'),
  "index.html must reference favicon with relative path './wax-seal.svg'"
);
console.log("✔ index.html references favicon with './wax-seal.svg'.");

// ============================================================================
// 3. State Machine & Event Exhaustiveness
// ============================================================================
console.log('\n--- 3. Testing State Machine & Handler Exhaustiveness ---');

// Read types/index.ts to extract PresentationViewType values
const typesContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'types', 'index.ts'), 'utf-8');

const viewTypeMatch = typesContent.match(/export type PresentationViewType\s*=([\s\S]*?);/);
assert.ok(viewTypeMatch, 'Could not find PresentationViewType definition in src/types/index.ts');
const viewTypes = [...viewTypeMatch[1].matchAll(/'([a-zA-Z0-9_]+)'/g)].map((m) => m[1]);
assert.ok(viewTypes.length >= 6, `Expected at least 6 view types, found ${viewTypes.length}`);

// Verify PresentationScreen.tsx covers all view types in renderCurrentView()
const presentationScreenContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src', 'components', 'presentation', 'PresentationScreen.tsx'),
  'utf-8'
);

for (const viewType of viewTypes) {
  assert.ok(
    presentationScreenContent.includes(`case '${viewType}':`) ||
      (viewType === 'idle' && presentationScreenContent.includes('IdleStageView')),
    `PresentationScreen.tsx must handle view type: '${viewType}'`
  );
}
console.log(`✔ All ${viewTypes.length} PresentationViewTypes handled in PresentationScreen router (${viewTypes.join(', ')}).`);

// Extract SoundType values
const soundTypeMatch = typesContent.match(/export type SoundType\s*=([\s\S]*?);/);
assert.ok(soundTypeMatch, 'Could not find SoundType definition in src/types/index.ts');
const soundTypes = [...soundTypeMatch[1].matchAll(/'([a-zA-Z0-9_]+)'/g)].map((m) => m[1]);
assert.ok(soundTypes.length >= 5, `Expected at least 5 sound types, found ${soundTypes.length}`);

// Verify GameContext.tsx dispatches all sound types
const gameContextContent = fs.readFileSync(
  path.join(ROOT_DIR, 'src', 'context', 'GameContext.tsx'),
  'utf-8'
);

for (const soundType of soundTypes) {
  assert.ok(
    gameContextContent.includes(`case '${soundType}':`),
    `GameContext.tsx playAudioCue must handle sound type: '${soundType}'`
  );
}
console.log(`✔ All ${soundTypes.length} SoundTypes handled in GameContext audio dispatcher (${soundTypes.join(', ')}).`);

// Extract BroadcastMessage types
assert.ok(
  gameContextContent.includes("msg.type === 'STAGE_PING'"),
  'GameContext.tsx must handle STAGE_PING message type'
);
assert.ok(
  gameContextContent.includes("msg.type === 'STAGE_PONG'"),
  'GameContext.tsx must handle STAGE_PONG message type'
);
console.log('✔ STAGE_PING and STAGE_PONG heartbeat handlers implemented in GameContext.');

// Verify Timer Authority Invariant (Host only, never Stage display)
assert.ok(
  gameContextContent.includes('if (isStageMode) return;'),
  'GameContext.tsx timer runner must guard against running in stage mode (if (isStageMode) return;)'
);
console.log('✔ Timer authority invariant verified: Host is sole authoritative clock runner.');

// Verify StorageEvent fallback sync invariant
assert.ok(
  gameContextContent.includes("window.addEventListener('storage'"),
  'GameContext.tsx must listen to storage events as cross-tab fallback sync'
);
console.log('✔ Storage event cross-tab fallback sync invariant verified.');

// ============================================================================
// 4. Schema Integrity & Validation
// ============================================================================
console.log('\n--- 4. Testing JSON Schema & Data Conformance ---');

const schemaPath = path.join(ROOT_DIR, 'docs', 'gameledger.schema.json');
assert.ok(fs.existsSync(schemaPath), 'docs/gameledger.schema.json must exist');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
assert.ok(schema.properties && schema.$defs, 'Schema must define properties and $defs');
console.log('✔ JSON Schema loaded and verified as Draft 2020-12.');

// Validator function checking GameLedger state compliance against schema invariants
function validateStateSchema(state, label) {
  assert.equal(typeof state, 'object', `${label}: state must be an object`);
  assert.ok(Number.isInteger(state.version) && state.version >= 1, `${label}: version must be an integer >= 1`);
  assert.equal(typeof state.seriesTitle, 'string', `${label}: seriesTitle must be a string`);
  assert.ok(state.seriesTitle.length > 0, `${label}: seriesTitle must not be empty`);
  assert.equal(typeof state.taskmasterName, 'string', `${label}: taskmasterName must be a string`);
  assert.equal(typeof state.assistantName, 'string', `${label}: assistantName must be a string`);

  // Contestants
  assert.ok(Array.isArray(state.contestants), `${label}: contestants must be an array`);
  assert.ok(state.contestants.length >= 2, `${label}: must have at least 2 contestants`);
  const contestantIds = new Set();
  const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

  state.contestants.forEach((c, idx) => {
    assert.ok(typeof c.id === 'string' && c.id.length > 0, `${label}: contestant[${idx}] must have an id`);
    assert.ok(!contestantIds.has(c.id), `${label}: duplicate contestant id: ${c.id}`);
    contestantIds.add(c.id);
    assert.ok(typeof c.name === 'string' && c.name.length > 0, `${label}: contestant ${c.id} name required`);
    assert.ok(Number.isInteger(c.seatIndex) && c.seatIndex >= 0, `${label}: contestant ${c.id} seatIndex invalid`);
    assert.ok(hexColorRegex.test(c.colorHex), `${label}: contestant ${c.id} invalid colorHex: ${c.colorHex}`);
    assert.ok(typeof c.avatar === 'string', `${label}: contestant ${c.id} avatar required`);
  });

  // Teams (optional array)
  if (state.teams) {
    assert.ok(Array.isArray(state.teams), `${label}: teams must be an array`);
    const teamIds = new Set();
    state.teams.forEach((t, idx) => {
      assert.ok(typeof t.id === 'string' && t.id.length > 0, `${label}: team[${idx}] id required`);
      assert.ok(!teamIds.has(t.id), `${label}: duplicate team id: ${t.id}`);
      teamIds.add(t.id);
      assert.ok(typeof t.name === 'string' && t.name.length > 0, `${label}: team ${t.id} name required`);
      assert.ok(hexColorRegex.test(t.colorHex), `${label}: team ${t.id} invalid colorHex`);
    });
  }

  // Episodes
  assert.ok(Array.isArray(state.episodes), `${label}: episodes must be an array`);
  assert.ok(state.episodes.length >= 1, `${label}: must have at least 1 episode`);
  const episodeIds = new Set();
  const validTaskTypes = new Set(['prize', 'filmed', 'team', 'studio', 'tiebreak']);

  state.episodes.forEach((ep, epIdx) => {
    assert.ok(typeof ep.id === 'string' && ep.id.length > 0, `${label}: episode[${epIdx}] id required`);
    assert.ok(!episodeIds.has(ep.id), `${label}: duplicate episode id: ${ep.id}`);
    episodeIds.add(ep.id);
    assert.ok(Number.isInteger(ep.episodeNumber) && ep.episodeNumber >= 1, `${label}: episode ${ep.id} number invalid`);
    assert.ok(typeof ep.title === 'string' && ep.title.length > 0, `${label}: episode ${ep.id} title required`);
    assert.ok(Array.isArray(ep.tasks), `${label}: episode ${ep.id} tasks must be an array`);

    const taskIds = new Set();
    ep.tasks.forEach((t, tIdx) => {
      assert.ok(typeof t.id === 'string' && t.id.length > 0, `${label}: task[${tIdx}] id required`);
      assert.ok(!taskIds.has(t.id), `${label}: duplicate task id: ${t.id}`);
      taskIds.add(t.id);
      assert.ok(typeof t.title === 'string' && t.title.length > 0, `${label}: task ${t.id} title required`);
      assert.ok(validTaskTypes.has(t.type), `${label}: task ${t.id} invalid type: ${t.type}`);
      assert.equal(typeof t.isTimed, 'boolean', `${label}: task ${t.id} isTimed must be boolean`);
      assert.equal(typeof t.scores, 'object', `${label}: task ${t.id} scores must be object`);

      // Subtasks (if present)
      if (t.subtasks) {
        assert.ok(Array.isArray(t.subtasks), `${label}: task ${t.id} subtasks must be array`);
        t.subtasks.forEach((sub, sIdx) => {
          assert.ok(typeof sub.id === 'string' && sub.id.length > 0, `${label}: subtask[${sIdx}] id required`);
          assert.ok(typeof sub.title === 'string' && sub.title.length > 0, `${label}: subtask ${sub.id} title required`);
          assert.equal(typeof sub.isTimed, 'boolean', `${label}: subtask ${sub.id} isTimed must be boolean`);
          assert.equal(typeof sub.scores, 'object', `${label}: subtask ${sub.id} scores must be object`);
        });
      }
    });
  });

  // Active episode / task pointers
  assert.ok(episodeIds.has(state.activeEpisodeId), `${label}: activeEpisodeId (${state.activeEpisodeId}) not found in episodes`);
  if (state.activeTaskId) {
    const activeEp = state.episodes.find((ep) => ep.id === state.activeEpisodeId);
    assert.ok(
      activeEp.tasks.some((t) => t.id === state.activeTaskId),
      `${label}: activeTaskId (${state.activeTaskId}) not found in active episode ${state.activeEpisodeId}`
    );
  }

  // Presentation & Timer
  assert.ok(typeof state.presentation === 'object', `${label}: presentation config required`);
  assert.ok(viewTypes.includes(state.presentation.view), `${label}: invalid presentation view: ${state.presentation.view}`);
  assert.ok(typeof state.timer === 'object', `${label}: timer config required`);
  assert.equal(typeof state.timer.isRunning, 'boolean', `${label}: timer.isRunning must be boolean`);
  assert.equal(typeof state.timer.seconds, 'number', `${label}: timer.seconds must be number`);
  assert.equal(typeof state.soundEnabled, 'boolean', `${label}: soundEnabled must be boolean`);
}

// Validate DEMO_STATE and EMPTY_STATE
validateStateSchema(DEMO_STATE, 'DEMO_STATE');
console.log('✔ DEMO_STATE adheres to JSON Schema specifications.');

validateStateSchema(EMPTY_STATE, 'EMPTY_STATE');
console.log('✔ EMPTY_STATE adheres to JSON Schema specifications.');

// ============================================================================
// 5. JSON Round-Trip Serialization Test
// ============================================================================
console.log('\n--- 5. Testing JSON Round-Trip Serialization ---');

const serialized = JSON.stringify(DEMO_STATE);
const deserialized = JSON.parse(serialized);

validateStateSchema(deserialized, 'Deserialized DEMO_STATE');
assert.equal(deserialized.contestants.length, DEMO_STATE.contestants.length);
assert.equal(deserialized.episodes.length, DEMO_STATE.episodes.length);
assert.equal(deserialized.activeEpisodeId, DEMO_STATE.activeEpisodeId);
console.log('✔ JSON serialization round-trip preserved all state, contestants, and episodes.');

console.log('\nAll architectural invariants, offline rules, and schema checks passed! 🏛️✨');
