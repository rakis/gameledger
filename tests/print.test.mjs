import assert from 'node:assert/strict';
import { generatePrintablePages, formatDuration, getTasksForScope } from '../src/utils/printTasks.ts';

console.log('Testing Printable Task Feature Logic...\n');

// 1. Test formatDuration
console.log('--- Testing formatDuration ---');
assert.equal(formatDuration(60), '1 minute');
assert.equal(formatDuration(120), '2 minutes');
assert.equal(formatDuration(600), '10 minutes');
assert.equal(formatDuration(90), '1 minute and 30 seconds');
assert.equal(formatDuration(45), '45 seconds');
console.log('✔ formatDuration tests passed.');

// Mock tasks
const mockSingleTask = {
  id: 'task-1',
  title: 'Tower of Eggs',
  brief: 'Make the highest tower of eggs.\nDo not break any eggs.',
  type: 'filmed',
  isTimed: true,
  timeLimitSeconds: 600,
  scores: {},
  orderIndex: 0,
};

const mockMultiPartTask = {
  id: 'task-2',
  title: 'The Great Heist',
  brief: 'Master task brief',
  type: 'filmed',
  isTimed: false,
  scores: {},
  orderIndex: 1,
  subtasks: [
    {
      id: 'sub-1',
      title: 'Steal the Painting',
      brief: 'Steal the painting without touching the red laser tape.',
      isTimed: true,
      timeLimitSeconds: 300,
      scores: {},
      orderIndex: 0,
    },
    {
      id: 'sub-2',
      title: 'Escape the House',
      brief: 'Escape the house wearing the flippers. Your time starts now.',
      isTimed: true,
      timeLimitSeconds: 180,
      scores: {},
      orderIndex: 1,
    },
  ],
};

// 2. Test generatePrintablePages for single task
console.log('\n--- Testing generatePrintablePages for single task ---');
const defaultOptions = {
  scope: 'episode',
  includeTitle: false,
  separateSubtasks: true,
  includeTimeLimit: true,
  appendTimeStartsNow: true,
  fontSize: 'large',
};

const pagesSingle = generatePrintablePages([mockSingleTask], defaultOptions);
assert.equal(pagesSingle.length, 1);
assert.equal(pagesSingle[0].renderedTitle, undefined);
assert.equal(pagesSingle[0].renderedBrief, 'Make the highest tower of eggs.\nDo not break any eggs.');
assert.equal(pagesSingle[0].timeLimitNotice, 'You have 10 minutes.');
assert.equal(pagesSingle[0].timeStartsNotice, 'Your time starts now.');
console.log('✔ Single task page generated with time limit and time starts notices.');

// 3. Test generatePrintablePages with title included
console.log('\n--- Testing generatePrintablePages with title included ---');
const pagesWithTitle = generatePrintablePages([mockSingleTask], {
  ...defaultOptions,
  includeTitle: true,
});
assert.equal(pagesWithTitle[0].renderedTitle, 'Tower of Eggs');
console.log('✔ Title correctly included when enabled.');

// 4. Test multi-part task separation
console.log('\n--- Testing multi-part task separation ---');
const pagesMultiPart = generatePrintablePages([mockMultiPartTask], defaultOptions);
assert.equal(pagesMultiPart.length, 2, 'Should generate 2 separate pages for 2 subtasks');
assert.equal(pagesMultiPart[0].partNumber, 1);
assert.equal(pagesMultiPart[0].renderedBrief, 'Steal the painting without touching the red laser tape.');
assert.equal(pagesMultiPart[0].timeLimitNotice, 'You have 5 minutes.');
assert.equal(pagesMultiPart[0].timeStartsNotice, 'Your time starts now.');

// Subtask 2 already contains "Your time starts now." in brief -> should NOT double append
assert.equal(pagesMultiPart[1].partNumber, 2);
assert.equal(pagesMultiPart[1].timeStartsNotice, undefined, 'Should not double-append "Your time starts now."');
console.log('✔ Multi-part tasks separated onto distinct pages without redundant time notices.');

// 5. Test scope filtering
console.log('\n--- Testing getTasksForScope ---');
const mockEpisode = {
  id: 'ep-1',
  episodeNumber: 1,
  title: 'Episode 1',
  tasks: [mockSingleTask, mockMultiPartTask],
};

const epTasks = getTasksForScope('episode', mockEpisode, [mockEpisode], 'task-1');
assert.equal(epTasks.length, 2);

const singleTaskScope = getTasksForScope('current_task', mockEpisode, [mockEpisode], 'task-1');
assert.equal(singleTaskScope.length, 1);
assert.equal(singleTaskScope[0].id, 'task-1');

console.log('✔ Scope filtering works for episode and current task.');

console.log('\nAll printable task tests passed! 🖨️✨');
