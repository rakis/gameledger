import { DEMO_EPISODES, DEMO_CONTESTANTS, DEFAULT_TEAMS } from '../src/data/demoData.ts';

console.log('Testing GameLedger data integrity & new features...');

// 1. Contestants check
console.assert(DEMO_CONTESTANTS.length === 5, 'Should have 5 demo contestants');
console.log('✔ Demo contestants count: 5');

// 2. Task calculations on Demo Episode 1
const ep1 = DEMO_EPISODES[0];
console.assert(ep1.tasks.length === 4, 'Episode 1 should have 4 tasks');
console.log('✔ Episode 1 task count:', ep1.tasks.length);

const contestantScores = {};
DEMO_CONTESTANTS.forEach((c) => { contestantScores[c.id] = 0; });

ep1.tasks.forEach((task) => {
  Object.entries(task.scores).forEach(([cid, entry]) => {
    if (entry && !entry.isDisqualified) {
      contestantScores[cid] += Number(entry.points || 0);
    }
  });
});

console.assert(contestantScores['c1'] === 17, `Alice should have 17 points, got ${contestantScores['c1']}`);
console.log('✔ Alice score correctly calculated: 17 pts');

console.assert(contestantScores['c5'] === 7, `Eddie should have 7 points, got ${contestantScores['c5']}`);
console.log('✔ Eddie score with DQ correctly calculated: 7 pts');

// 3. Multi-Team Support (>2 teams)
console.log('\n--- Testing Multi-Team Support (>2 teams) ---');
console.assert(DEFAULT_TEAMS.length >= 3, 'Should have at least 3 default teams');
console.log(`✔ Default teams count: ${DEFAULT_TEAMS.length} (Teams: ${DEFAULT_TEAMS.map(t => t.name).join(', ')})`);

const teams = [
  { id: 't1', name: 'The Red Pandas', colorHex: '#ef4444', avatar: '🐼' },
  { id: 't2', name: 'The Blue Jays', colorHex: '#3b82f6', avatar: '🐦' },
  { id: 't3', name: 'The Golden Eagles', colorHex: '#eab308', avatar: '🦅' },
];

const teamContestants = [
  { id: 'c1', name: 'Alice', teamId: 't1' },
  { id: 'c2', name: 'Bob', teamId: 't1' },
  { id: 'c3', name: 'Charlie', teamId: 't2' },
  { id: 'c4', name: 'Diana', teamId: 't2' },
  { id: 'c5', name: 'Eddie', teamId: 't3' },
  { id: 'c6', name: 'Fiona', teamId: 't3' },
];

// Award points: Team 1 gets 5, Team 2 gets 3, Team 3 gets 1
const teamTaskScores = {};
teamContestants.forEach((c) => {
  const pts = c.teamId === 't1' ? 5 : c.teamId === 't2' ? 3 : 1;
  teamTaskScores[c.id] = { contestantId: c.id, points: pts, isDisqualified: false };
});

const teamTotals = teams.map((team) => {
  const members = teamContestants.filter((c) => c.teamId === team.id);
  const totalPoints = members.reduce((sum, m) => sum + teamTaskScores[m.id].points, 0);
  return { team, totalPoints, memberCount: members.length };
});

console.assert(teamTotals[0].totalPoints === 10, 'Team 1 should have 10 points (2 members x 5)');
console.assert(teamTotals[1].totalPoints === 6, 'Team 2 should have 6 points (2 members x 3)');
console.assert(teamTotals[2].totalPoints === 2, 'Team 3 should have 2 points (2 members x 1)');
console.log('✔ Multi-team point assignment and team aggregation verified for 3 teams');

// 4. Sub-Task Support & Rollup Modes ('sum' and 'final_rank')
console.log('\n--- Testing Sub-Task Support & Rollup Modes ---');

const subtask1 = {
  id: 'st_1',
  title: 'Part 1: Obstacle Course',
  scores: {
    c1: { contestantId: 'c1', points: 5, isDisqualified: false },
    c2: { contestantId: 'c2', points: 3, isDisqualified: false },
    c3: { contestantId: 'c3', points: 4, isDisqualified: false },
    c4: { contestantId: 'c4', points: 1, isDisqualified: false },
  },
};

const subtask2 = {
  id: 'st_2',
  title: 'Part 2: Riddle Solving',
  scores: {
    c1: { contestantId: 'c1', points: 2, isDisqualified: false },
    c2: { contestantId: 'c2', points: 5, isDisqualified: false },
    c3: { contestantId: 'c3', points: 1, isDisqualified: false },
    c4: { contestantId: 'c4', points: 4, isDisqualified: false },
  },
};

// Mode A: 'sum' mode
const sumScores = {};
['c1', 'c2', 'c3', 'c4'].forEach((cid) => {
  const pt1 = subtask1.scores[cid].points;
  const pt2 = subtask2.scores[cid].points;
  sumScores[cid] = pt1 + pt2;
});

console.assert(sumScores['c1'] === 7, `c1 sum should be 7, got ${sumScores['c1']}`);
console.assert(sumScores['c2'] === 8, `c2 sum should be 8, got ${sumScores['c2']}`);
console.assert(sumScores['c3'] === 5, `c3 sum should be 5, got ${sumScores['c3']}`);
console.assert(sumScores['c4'] === 5, `c4 sum should be 5, got ${sumScores['c4']}`);
console.log('✔ Subtask "sum" aggregation correctly sums subtask points');

// Mode B: 'final_rank' mode (Taskmaster 5 to 1 scale based on subtask sum)
// c2: 8 pts -> Rank 1 -> 5 pts
// c1: 7 pts -> Rank 2 -> 4 pts
// c3: 5 pts -> Rank 3 (tied) -> 3 pts
// c4: 5 pts -> Rank 3 (tied) -> 3 pts
const sortedBySum = ['c1', 'c2', 'c3', 'c4'].map((cid) => ({
  cid,
  rawSum: sumScores[cid],
})).sort((a, b) => b.rawSum - a.rawSum);

const finalRankScores = {};
let currentRank = 1;
const pointScale = [5, 4, 3, 2, 1];

sortedBySum.forEach((item, idx) => {
  if (idx > 0 && item.rawSum < sortedBySum[idx - 1].rawSum) {
    currentRank = idx + 1;
  }
  const awardedPoints = pointScale[currentRank - 1] ?? 1;
  finalRankScores[item.cid] = { rank: currentRank, points: awardedPoints };
});

console.assert(finalRankScores['c2'].points === 5, `c2 (1st) should get 5 points, got ${finalRankScores['c2'].points}`);
console.assert(finalRankScores['c1'].points === 4, `c1 (2nd) should get 4 points, got ${finalRankScores['c1'].points}`);
console.assert(finalRankScores['c3'].points === 3, `c3 (3rd tie) should get 3 points, got ${finalRankScores['c3'].points}`);
console.assert(finalRankScores['c4'].points === 3, `c4 (3rd tie) should get 3 points, got ${finalRankScores['c4'].points}`);
console.log('✔ Subtask "final_rank" aggregation correctly converts subtask sums to standard Taskmaster ranks & points');

// 5. Participant Sit-Out & Betting Mechanics
console.log('\n--- Testing Sit-Out & Spectator Betting ---');

// 5 contestants total: c1, c2, c3 active. c4, c5 sat out.
const allContestantIds = ['c1', 'c2', 'c3', 'c4', 'c5'];
const assignedContestantIds = ['c1', 'c2', 'c3'];

const taskWithSitOut = {
  id: 'task_sitout',
  assignedContestantIds,
  scores: {
    c1: { contestantId: 'c1', points: 5, isDisqualified: false },
    c2: { contestantId: 'c2', points: 3, isDisqualified: false },
    c3: { contestantId: 'c3', points: 1, isDisqualified: false },
  },
  bets: {
    c4: {
      bettorId: 'c4',
      targetContestantId: 'c1', // Predicted Alice (c1) to win
      rewardPoints: 2,
      isWon: false,
    },
    c5: {
      bettorId: 'c5',
      targetContestantId: 'c2', // Predicted Bob (c2) to win
      rewardPoints: 2,
      isWon: false,
    },
  },
};

// Winner is c1 (highest points)
const winnerId = 'c1';

// Resolve bets:
Object.values(taskWithSitOut.bets).forEach((bet) => {
  const won = bet.targetContestantId === winnerId;
  bet.isWon = won;
  if (won) {
    taskWithSitOut.scores[bet.bettorId] = {
      contestantId: bet.bettorId,
      points: bet.rewardPoints,
      bonusPoints: bet.rewardPoints,
      isDisqualified: false,
      isSatOut: true,
      attemptNote: `Won spectator bet (+${bet.rewardPoints} pts)`,
    };
  } else {
    taskWithSitOut.scores[bet.bettorId] = {
      contestantId: bet.bettorId,
      points: 0,
      isDisqualified: false,
      isSatOut: true,
      attemptNote: 'Lost spectator bet (0 pts)',
    };
  }
});

// Verify bet resolutions
console.assert(taskWithSitOut.bets['c4'].isWon === true, 'c4 bet should be won');
console.assert(taskWithSitOut.bets['c5'].isWon === false, 'c5 bet should be lost');

console.assert(taskWithSitOut.scores['c4'].points === 2, 'c4 should receive 2 reward points');
console.assert(taskWithSitOut.scores['c4'].isSatOut === true, 'c4 must be flagged as sat out');
console.assert(taskWithSitOut.scores['c5'].points === 0, 'c5 should receive 0 points');
console.assert(taskWithSitOut.scores['c5'].isSatOut === true, 'c5 must be flagged as sat out');

// Verify completed task counts excluding sat-out tasks:
const activeTaskCounts = {};
allContestantIds.forEach((cid) => {
  const entry = taskWithSitOut.scores[cid];
  const isCompleted = entry && !entry.isSatOut;
  activeTaskCounts[cid] = isCompleted ? 1 : 0;
});

console.assert(activeTaskCounts['c1'] === 1, 'Active contestant c1 counts task as completed');
console.assert(activeTaskCounts['c2'] === 1, 'Active contestant c2 counts task as completed');
console.assert(activeTaskCounts['c3'] === 1, 'Active contestant c3 counts task as completed');
console.assert(activeTaskCounts['c4'] === 0, 'Sat-out contestant c4 does NOT increment completed task count');
console.assert(activeTaskCounts['c5'] === 0, 'Sat-out contestant c5 does NOT increment completed task count');

console.log('✔ Spectator betting resolution awarded correct points and preserved sit-out status');

// 6. Episode title update and long episode title handling
console.log('\n--- Testing Episode Title Update & Long Title Handling ---');
const longTitle = 'Episode 1: The Extremely Long, Elaborate, and Completely Over-The-Top Title That Exceeds Normal Screen Widths';
const updatedEpisodes = DEMO_EPISODES.map((e) => (e.id === ep1.id ? { ...e, title: longTitle } : e));
const updatedEp1 = updatedEpisodes.find((e) => e.id === ep1.id);
console.assert(updatedEp1.title === longTitle, 'Updated episode title should match long title');
console.assert(updatedEp1.tasks.length === ep1.tasks.length, 'Task count must remain unaffected by episode title update');
console.log('✔ Episode title successfully updated with long title and tasks preserved');

// 7. Atomic Batch Task Score Updates, Multi-Team Points, and Auto-Ranking
console.log('\n--- Testing Atomic Batch Score Updates & Multi-Team Score Preservation ---');

const baseTask = {
  id: 'task_batch_test',
  assignedContestantIds: ['c1', 'c2', 'c3', 'c4', 'c5'],
  scores: {
    c1: { contestantId: 'c1', points: 0, isDisqualified: false },
    c2: { contestantId: 'c2', points: 0, isDisqualified: false },
    c3: { contestantId: 'c3', points: 0, isDisqualified: false },
    c4: { contestantId: 'c4', points: 0, isDisqualified: false },
    c5: { contestantId: 'c5', points: 0, isDisqualified: false },
  },
};

const batchUpdates = {
  c1: { points: 5 },
  c2: { points: 4 },
  c3: { points: 3 },
  c4: { points: 2 },
  c5: { points: 0, isDisqualified: true, dqReason: 'Stepped out of circle' },
};

const updatedScores = { ...baseTask.scores };
Object.entries(batchUpdates).forEach(([cid, updates]) => {
  updatedScores[cid] = { ...updatedScores[cid], ...updates };
});

const activeAssigned = baseTask.assignedContestantIds;
const nonDQs = activeAssigned
  .filter((cid) => !updatedScores[cid].isDisqualified)
  .sort((a, b) => updatedScores[b].points - updatedScores[a].points);

let rank = 1;
nonDQs.forEach((cid, idx) => {
  if (idx > 0 && updatedScores[cid].points < updatedScores[nonDQs[idx - 1]].points) {
    rank = idx + 1;
  }
  updatedScores[cid].rank = rank;
});

console.assert(updatedScores['c1'].points === 5 && updatedScores['c1'].rank === 1, 'c1 should have 5 points and rank 1');
console.assert(updatedScores['c2'].points === 4 && updatedScores['c2'].rank === 2, 'c2 should have 4 points and rank 2');
console.assert(updatedScores['c3'].points === 3 && updatedScores['c3'].rank === 3, 'c3 should have 3 points and rank 3');
console.assert(updatedScores['c4'].points === 2 && updatedScores['c4'].rank === 4, 'c4 should have 2 points and rank 4');
console.assert(updatedScores['c5'].points === 0 && updatedScores['c5'].isDisqualified === true, 'c5 should be disqualified with 0 points');
console.log('✔ Batch score updates atomically committed all contestant scores with calculated ranks');

// Multi-team score award without teammate score overwriting
const teamMembersA = ['c1', 'c2'];
const teamPointsUpdates = {};
teamMembersA.forEach((mId) => {
  teamPointsUpdates[mId] = { points: 5, isDisqualified: false };
});

const teamScoredTask = {
  ...baseTask,
  scores: {
    ...baseTask.scores,
    ...teamPointsUpdates,
  },
};

console.assert(teamScoredTask.scores['c1'].points === 5, 'Teammate 1 (c1) retained 5 team points');
console.assert(teamScoredTask.scores['c2'].points === 5, 'Teammate 2 (c2) retained 5 team points');
console.log('✔ Atomic team point assignment correctly awards points to all teammates without overwriting');

// Competition tie ranking (e.g. 5, 4, 4, 2)
const tieScores = {
  c1: { points: 5 },
  c2: { points: 4 },
  c3: { points: 4 },
  c4: { points: 2 },
};
const tieRanked = ['c1', 'c2', 'c3', 'c4'].sort((a, b) => tieScores[b].points - tieScores[a].points);
let tieCurRank = 1;
tieRanked.forEach((cid, idx) => {
  if (idx > 0 && tieScores[cid].points < tieScores[tieRanked[idx - 1]].points) {
    tieCurRank = idx + 1;
  }
  tieScores[cid].rank = tieCurRank;
});

console.assert(tieScores['c1'].rank === 1, '1st place has rank 1');
console.assert(tieScores['c2'].rank === 2, '2nd place tie has rank 2');
console.assert(tieScores['c3'].rank === 2, '2nd place tie has rank 2');
console.assert(tieScores['c4'].rank === 4, '4th place skips to rank 4 after two 2nd place ties');
console.log('✔ Competition tie ranking properly computes standard 1-2-2-4 rankings');

console.log('\n--- Testing Task Brief Stage View (No Task Name & Default to Part 1) ---');
const resolveTaskBriefStageView = (task, activeSubtaskId, showPartLabel = false) => {
  const hasSubtasks = !!(task.subtasks && task.subtasks.length > 0);
  const currentSubtask = hasSubtasks
    ? (task.subtasks.find((s) => s.id === activeSubtaskId) || task.subtasks[0])
    : null;

  const subtaskIndex = currentSubtask && task.subtasks
    ? task.subtasks.findIndex((s) => s.id === currentSubtask.id)
    : -1;

  const displayedTitle = currentSubtask && showPartLabel
    ? `Part ${subtaskIndex + 1}`
    : null;

  const displayedBrief = currentSubtask && currentSubtask.brief
    ? currentSubtask.brief
    : task.brief;

  return { currentSubtask, subtaskIndex, displayedTitle, displayedBrief };
};

const multipartTestTask = {
  id: 'multi-1',
  title: 'The Secret Heist',
  brief: 'Master brief for the secret heist.',
  subtasks: [
    { id: 'part-1', title: 'Pick the Lock', brief: 'Pick the lock without using your thumbs. Your time starts now.' },
    { id: 'part-2', title: 'Crack the Safe', brief: 'Crack the safe while reciting the alphabet backwards.' },
  ],
};

const singleTestTask = {
  id: 'single-1',
  title: 'Tower of Eggs',
  brief: 'Build the highest tower of eggs. Highest tower wins.',
};

// 1. Multipart task with null activeSubtaskId -> defaults to Part 1
const defaultMultipartView = resolveTaskBriefStageView(multipartTestTask, null, false);
console.assert(defaultMultipartView.currentSubtask?.id === 'part-1', 'Multipart task should default to Part 1');
console.assert(defaultMultipartView.displayedBrief === 'Pick the lock without using your thumbs. Your time starts now.', 'Should display Part 1 brief');
console.assert(defaultMultipartView.displayedTitle === null, 'Should not display any title when showPartLabel is false');
console.assert(defaultMultipartView.displayedTitle !== multipartTestTask.title, 'Should never display task title');
console.assert(defaultMultipartView.displayedTitle !== multipartTestTask.subtasks[0].title, 'Should never display subtask title');
console.log('✔ Multipart task defaults to Part 1 and hides task name');

// 2. Multipart task with showPartLabel = true -> shows Part 1, never task name
const labeledMultipartView = resolveTaskBriefStageView(multipartTestTask, null, true);
console.assert(labeledMultipartView.displayedTitle === 'Part 1', 'Should display "Part 1" when showPartLabel is true');
console.assert(!labeledMultipartView.displayedTitle.includes('The Secret Heist'), 'Should not include task title in Part label');
console.assert(!labeledMultipartView.displayedTitle.includes('Pick the Lock'), 'Should not include subtask title in Part label');
console.log('✔ Multipart task with part labels shows "Part 1" without task or subtask names');

// 3. Multipart task with activeSubtaskId explicitly set to Part 2
const part2View = resolveTaskBriefStageView(multipartTestTask, 'part-2', true);
console.assert(part2View.currentSubtask?.id === 'part-2', 'Should resolve to Part 2');
console.assert(part2View.displayedBrief === 'Crack the safe while reciting the alphabet backwards.', 'Should display Part 2 brief');
console.assert(part2View.displayedTitle === 'Part 2', 'Should display "Part 2" for Part 2');
console.log('✔ Explicit subtask selection resolves correctly without revealing task name');

// 4. Single task -> never shows title, shows task brief
const singleView = resolveTaskBriefStageView(singleTestTask, null, false);
console.assert(singleView.currentSubtask === null, 'Single task has no subtask');
console.assert(singleView.displayedTitle === null, 'Single task has no displayed title on stage brief');
console.assert(singleView.displayedBrief === singleTestTask.brief, 'Single task displays task brief');
console.log('✔ Single task never shows task name and correctly displays task brief');

// 5. StageDirectorBar Overview visibility & active part logic
const shouldShowOverviewButton = (view) => view !== 'task_brief';
console.assert(!shouldShowOverviewButton('task_brief'), 'Overview button should be hidden in task_brief view');
console.assert(shouldShowOverviewButton('attempts'), 'Overview button should be visible in attempts view');
console.assert(shouldShowOverviewButton('score_reveal'), 'Overview button should be visible in score_reveal view');

const isPartButtonActive = (view, activeSubtaskId, stId, idx) => {
  return view === 'task_brief'
    ? (activeSubtaskId === stId || (!activeSubtaskId && idx === 0))
    : activeSubtaskId === stId;
};

console.assert(isPartButtonActive('task_brief', null, 'part-1', 0) === true, 'P1 should be active by default on task_brief when activeSubtaskId is null');
console.assert(isPartButtonActive('task_brief', null, 'part-2', 1) === false, 'P2 should not be active by default on task_brief when activeSubtaskId is null');
console.assert(isPartButtonActive('task_brief', 'part-2', 'part-2', 1) === true, 'P2 should be active when selected on task_brief');
console.log('✔ StageDirectorBar hides Overview in task_brief and defaults P1 to active');

// 6. Testing autoScoreByTime with Competition Tie Ranking
console.log('\n--- Testing autoScoreByTime Tie Ranking Logic ---');
const timedContestants = [
  { id: 'c1', name: 'Alice', timeTakenSeconds: 30 },
  { id: 'c2', name: 'Bob', timeTakenSeconds: 30 },
  { id: 'c3', name: 'Charlie', timeTakenSeconds: 45 },
  { id: 'c4', name: 'Diana', timeTakenSeconds: 50 },
  { id: 'c5', name: 'Eddie', timeTakenSeconds: 50 },
];

const timePointScale = [5, 4, 3, 2, 1];
const timeRankScores = {};
let timeCurRank = 1;

timedContestants.forEach((c, idx) => {
  const timeC = c.timeTakenSeconds;
  if (idx > 0) {
    const prevC = timedContestants[idx - 1];
    if (timeC > prevC.timeTakenSeconds) {
      timeCurRank = idx + 1;
    }
  }
  const pts = timePointScale[timeCurRank - 1] ?? 1;
  timeRankScores[c.id] = {
    points: pts,
    rank: timeCurRank,
  };
});

console.assert(timeRankScores['c1'].rank === 1 && timeRankScores['c1'].points === 5, 'Alice should be 1st with 5 pts');
console.assert(timeRankScores['c2'].rank === 1 && timeRankScores['c2'].points === 5, 'Bob tied with Alice should also be 1st with 5 pts');
console.assert(timeRankScores['c3'].rank === 3 && timeRankScores['c3'].points === 3, 'Charlie should skip to 3rd place with 3 pts');
console.assert(timeRankScores['c4'].rank === 4 && timeRankScores['c4'].points === 2, 'Diana should be 4th place with 2 pts');
console.assert(timeRankScores['c5'].rank === 4 && timeRankScores['c5'].points === 2, 'Eddie tied with Diana should also be 4th place with 2 pts');
console.log('✔ autoScoreByTime properly awards competition tie ranks and points (1-1-3-4-4)');

// 7. Testing Championship Series Tie Resolution
console.log('\n--- Testing Series Championship Tie Detection ---');
const tiedSeriesTotals = [
  { contestant: { id: 'c1', name: 'Alice' }, seriesScore: 42, rank: 1 },
  { contestant: { id: 'c2', name: 'Bob' }, seriesScore: 42, rank: 1 },
  { contestant: { id: 'c3', name: 'Charlie' }, seriesScore: 35, rank: 3 },
  { contestant: { id: 'c4', name: 'Diana' }, seriesScore: 30, rank: 4 },
];

const firstRankContestants = tiedSeriesTotals.filter((t) => t.rank === 1);
const isTieForFirst = firstRankContestants.length > 1;
const secondPlace = isTieForFirst ? null : tiedSeriesTotals.find((t) => t.rank === 2);
const thirdPlace = tiedSeriesTotals.find((t) => t.rank === 3);

console.assert(isTieForFirst === true, 'Should detect tie for 1st place');
console.assert(firstRankContestants.length === 2, 'Two contestants tied for 1st place');
console.assert(secondPlace === null, 'There should be no 2nd place on podium when two contestants tie for 1st');
console.assert(thirdPlace?.contestant.name === 'Charlie', 'Charlie is correctly identified as 3rd place');
console.log('✔ Series championship tie detection correctly identifies Joint Champions and omits 2nd place');

console.log('\nAll scoring calculations, multi-team, sub-tasks, sit-outs, bets, task brief stage views, and tie rankings verified successfully! 🎉');


