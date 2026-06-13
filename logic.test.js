/*
 * logic.test.js — Zero-dependency unit tests for logic.js
 * Run:  node logic.test.js   (or via npm test)
 */

const {
  escapeHTML,
  isValidPhone,
  computeStreak,
  averageMood,
  detectPattern
} = require('./logic.js');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, name) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ✗ ${name}`);
  }
}

function assertEq(actual, expected, name) {
  const ok = actual === expected;
  if (!ok) {
    name += ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`;
  }
  assert(ok, name);
}

function assertDeepEq(actual, expected, name) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    name += ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`;
  }
  assert(ok, name);
}

// Helper: build an ISO date string N days ago from today
function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

// ────────────────────────────────────────────
console.log('\n═══ escapeHTML ═══');
// ────────────────────────────────────────────
assertEq(escapeHTML('<script>alert("xss")</script>'),
  '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
  'escapes HTML tags and quotes');

assertEq(escapeHTML("it's a test"),
  "it&#39;s a test",
  'escapes single quotes');

assertEq(escapeHTML('a & b < c > d'),
  'a &amp; b &lt; c &gt; d',
  'escapes ampersand, less-than, greater-than');

assertEq(escapeHTML(''), '', 'returns empty string for empty input');

assertEq(escapeHTML(null), '', 'handles null input gracefully');

assertEq(escapeHTML(undefined), '', 'handles undefined input gracefully');

assertEq(escapeHTML('Hello World'), 'Hello World', 'does not alter safe strings');

assertEq(escapeHTML(12345), '12345', 'coerces numbers to string');

assertEq(escapeHTML('<b>"Bold" & \'italic\'</b>'),
  '&lt;b&gt;&quot;Bold&quot; &amp; &#39;italic&#39;&lt;/b&gt;',
  'escapes all special characters in mixed input');

// ────────────────────────────────────────────
console.log('\n═══ isValidPhone ═══');
// ────────────────────────────────────────────
assert(isValidPhone('9152987821') === true, 'valid 10-digit Indian number');
assert(isValidPhone('+91 91529 87821') === true, 'valid with country code and spaces');
assert(isValidPhone('+1-800-555-0199') === true, 'valid international with dashes');
assert(isValidPhone('14416') === false, 'rejects too-short number (5 digits)');
assert(isValidPhone('') === false, 'rejects empty string');
assert(isValidPhone(null) === false, 'rejects null');
assert(isValidPhone('abcdefghij') === false, 'rejects alphabetic string');
assert(isValidPhone('123') === false, 'rejects 3-digit string');
assert(isValidPhone('+91 123 456 7890') === true, 'valid with plus, spaces');
assert(isValidPhone('1860-2662-2345') === true, 'valid with dashes');
assert(isValidPhone('12345 67890') === true, 'valid with space separator');

// ────────────────────────────────────────────
console.log('\n═══ computeStreak ═══');
// ────────────────────────────────────────────
assertEq(computeStreak([]), 0, 'empty array returns 0');
assertEq(computeStreak(null), 0, 'null returns 0');
assertEq(computeStreak(undefined), 0, 'undefined returns 0');

assertEq(computeStreak([daysAgo(0)]), 1, 'single entry today returns streak of 1');

assertEq(computeStreak([daysAgo(1)]), 1, 'single entry yesterday returns streak of 1');

assertEq(
  computeStreak([daysAgo(2), daysAgo(1), daysAgo(0)]),
  3,
  'three consecutive days ending today returns 3'
);

assertEq(
  computeStreak([daysAgo(3), daysAgo(2), daysAgo(1), daysAgo(0)]),
  4,
  'four consecutive days ending today returns 4'
);

assertEq(
  computeStreak([daysAgo(5), daysAgo(3), daysAgo(2), daysAgo(1), daysAgo(0)]),
  4,
  'gap before consecutive run — counts only the recent run'
);

// Duplicate entries on the same day should not inflate streak
assertEq(
  computeStreak([daysAgo(1), daysAgo(1), daysAgo(0), daysAgo(0)]),
  2,
  'duplicate dates on same day counted as one'
);

// Old entries with no recent check-in should return 0
assertEq(
  computeStreak([daysAgo(10), daysAgo(9), daysAgo(8)]),
  0,
  'old consecutive entries with no recent activity returns 0'
);

assertEq(
  computeStreak([daysAgo(30)]),
  0,
  'single old entry (30 days ago) returns 0'
);

// ────────────────────────────────────────────
console.log('\n═══ averageMood ═══');
// ────────────────────────────────────────────
assertEq(averageMood([]), null, 'empty array returns null');
assertEq(averageMood(null), null, 'null returns null');
assertEq(averageMood(undefined), null, 'undefined returns null');

assertEq(
  averageMood([{mood:5}]),
  5.0,
  'single entry with mood 5 returns 5.0'
);

assertEq(
  averageMood([{mood:1}, {mood:2}, {mood:3}]),
  2.0,
  'average of 1,2,3 returns 2.0'
);

assertEq(
  averageMood([{mood:3}, {mood:4}, {mood:5}]),
  4.0,
  'average of 3,4,5 returns 4.0'
);

assertEq(
  averageMood([{mood:1}, {mood:5}]),
  3.0,
  'average of 1,5 returns 3.0'
);

assertEq(
  averageMood([{mood:1}, {mood:1}, {mood:1}, {mood:1}, {mood:1}]),
  1.0,
  'all moods 1 returns 1.0'
);

assertEq(
  averageMood([{mood:2}, {mood:3}]),
  2.5,
  'average of 2,3 returns 2.5'
);

assertEq(
  averageMood([{mood:1}, {mood:2}, {mood:4}]),
  2.3,
  'average of 1,2,4 returns 2.3 (rounded to 1 decimal)'
);

// ────────────────────────────────────────────
console.log('\n═══ detectPattern ═══');
// ────────────────────────────────────────────
assertEq(detectPattern([]), null, 'empty array returns null');
assertEq(detectPattern(null), null, 'null returns null');
assertEq(detectPattern(undefined), null, 'undefined returns null');

assertEq(
  detectPattern([{mood:3,stress:1},{mood:4,stress:1}]),
  null,
  'fewer than 3 entries returns null'
);

// Low mood pattern (3+ entries with mood <= 2)
{
  const entries = [
    {mood:1, stress:1, feeling:'worried'},
    {mood:2, stress:1, feeling:'worried'},
    {mood:1, stress:1, feeling:'worried'},
    {mood:2, stress:1, feeling:'worried'},
  ];
  const result = detectPattern(entries);
  assert(result !== null && result.toLowerCase().includes('low mood'),
    'detects low mood pattern when 3+ entries have mood <= 2');
}

// Numb pattern (2+ entries with feeling === 'numb')
{
  const entries = [
    {mood:3, stress:1, feeling:'numb'},
    {mood:3, stress:1, feeling:'numb'},
    {mood:3, stress:1, feeling:'focused'},
  ];
  const result = detectPattern(entries);
  assert(result !== null && result.toLowerCase().includes('numb'),
    'detects numb/emotional exhaustion pattern');
}

// High stress pattern (4+ entries with stress >= 3)
{
  const entries = [
    {mood:3, stress:3, feeling:'focused'},
    {mood:3, stress:3, feeling:'focused'},
    {mood:3, stress:3, feeling:'focused'},
    {mood:3, stress:3, feeling:'focused'},
  ];
  const result = detectPattern(entries);
  assert(result !== null && result.toLowerCase().includes('stress'),
    'detects consistently high stress pattern');
}

// Racing mind pattern (2+ entries with feeling === 'racing')
{
  const entries = [
    {mood:3, stress:1, feeling:'racing'},
    {mood:3, stress:1, feeling:'racing'},
    {mood:3, stress:1, feeling:'focused'},
  ];
  const result = detectPattern(entries);
  assert(result !== null && result.toLowerCase().includes('racing'),
    'detects racing mind pattern');
}

// No pattern when everything is calm
{
  const entries = [
    {mood:4, stress:1, feeling:'focused'},
    {mood:5, stress:1, feeling:'hopeful'},
    {mood:4, stress:1, feeling:'focused'},
    {mood:5, stress:1, feeling:'hopeful'},
  ];
  const result = detectPattern(entries);
  assertEq(result, null, 'returns null when all entries are calm and positive');
}

// Pattern detection uses only last 5 entries
{
  const entries = [
    {mood:1, stress:3, feeling:'numb'},
    {mood:1, stress:3, feeling:'numb'},
    {mood:1, stress:3, feeling:'numb'},
    // Recent entries are all fine
    {mood:4, stress:1, feeling:'focused'},
    {mood:5, stress:1, feeling:'hopeful'},
    {mood:4, stress:1, feeling:'focused'},
    {mood:5, stress:1, feeling:'hopeful'},
    {mood:4, stress:1, feeling:'focused'},
  ];
  const result = detectPattern(entries);
  assertEq(result, null, 'only considers last 5 entries — old distress is ignored');
}

// ────────────────────────────────────────────
// Summary
// ────────────────────────────────────────────
console.log('\n══════════════════════════════════');
console.log(`  Total: ${passed + failed}  |  Passed: ${passed}  |  Failed: ${failed}`);
console.log('══════════════════════════════════\n');

if (failed > 0) {
  console.log('Failing tests:');
  failures.forEach(f => console.log(`  ✗ ${f}`));
  console.log('');
  process.exit(1);
} else {
  console.log('All tests passed! ✓\n');
  process.exit(0);
}
