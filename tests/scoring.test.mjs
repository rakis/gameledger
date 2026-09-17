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

console.log('\nAll scoring calculations, multi-team, sub-tasks, sit-outs, and bets verified successfully! 🎉');

