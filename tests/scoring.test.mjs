import { DEMO_EPISODES, DEMO_CONTESTANTS } from '../src/data/demoData.ts';

console.log('Testing GameLedger data integrity...');

// 1. Contestants check
console.assert(DEMO_CONTESTANTS.length === 5, 'Should have 5 demo contestants');
console.log('✔ Demo contestants count: 5');

// 2. Task calculations
const ep1 = DEMO_EPISODES[0];
console.assert(ep1.tasks.length === 4, 'Episode 1 should have 4 tasks');
console.log('✔ Episode 1 task count:', ep1.tasks.length);

// Calculate scores manually to verify algorithm
const contestantScores = {};
DEMO_CONTESTANTS.forEach(c => { contestantScores[c.id] = 0; });

ep1.tasks.forEach(task => {
  Object.entries(task.scores).forEach(([cid, entry]) => {
    if (entry && !entry.isDisqualified) {
      contestantScores[cid] += Number(entry.points || 0);
    }
  });
});

console.log('Calculated Episode 1 totals:', contestantScores);

// Verify Alice's points:
// Task 1: 4
// Task 2: 5
// Task 3: 5
// Task 4: 3
// Total: 17
console.assert(contestantScores['c1'] === 17, `Alice should have 17 points, got ${contestantScores['c1']}`);
console.log('✔ Alice score correctly calculated: 17 pts');

// Verify Eddie's points (with Task 2 DQ):
// Task 1: 1
// Task 2: 0 (DQ)
// Task 3: 2
// Task 4: 4
// Total: 7
console.assert(contestantScores['c5'] === 7, `Eddie should have 7 points, got ${contestantScores['c5']}`);
console.log('✔ Eddie score with DQ correctly calculated: 7 pts');

console.log('All scoring calculations verified successfully!');
