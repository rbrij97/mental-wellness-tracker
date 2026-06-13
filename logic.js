/*
 * Tyro — pure logic module
 * ------------------------------------------------------------------
 * These functions contain no DOM or network access, so they can be
 * unit-tested in isolation (see tests.html). index.html loads this
 * file before its main script and calls these globals directly.
 */

/**
 * Escape a string for safe insertion into innerHTML (prevents XSS).
 * @param {any} str - The string or object to escape.
 * @returns {string} The HTML-escaped string.
 */
function escapeHTML(str){
  return String(str ?? '').replace(/[&<>"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));
}

/**
 * Validate a human-entered phone number (digits, spaces, dashes, optional +).
 * @param {any} phone - The phone number to validate.
 * @returns {boolean} True if the phone number is valid, false otherwise.
 */
function isValidPhone(phone){
  return /^[+\d][\d\s-]{5,}$/.test(String(phone || '').trim());
}

/**
 * Longest run of consecutive calendar days ending today or yesterday.
 * @param {string[]} isoDates - ISO date strings (one or more per day).
 * @returns {number} The active streak in days.
 */
function computeStreak(isoDates){
  if(!isoDates || !isoDates.length) return 0;
  const days = [...new Set(isoDates.map(d => d.split('T')[0]))].sort().reverse();

  // Verify if the streak is active. The most recent check-in (days[0]) must be today or yesterday in UTC.
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (days[0] !== todayStr && days[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  for(let i = 1; i < days.length; i++){
    const diff = (new Date(days[i-1]) - new Date(days[i])) / 86400000;
    if(Math.round(diff) === 1) streak++; else break;
  }
  return streak;
}

/**
 * Average mood (1–5) across entries, rounded to 1 decimal.
 * Filters out entries with invalid, null, or missing mood properties.
 * @param {object[]} entries - Array of check-in entries.
 * @param {number} [entries[].mood] - The mood rating (1-5).
 * @returns {number|null} The average mood rating, or null if no valid entries are present.
 */
function averageMood(entries){
  if(!entries || !entries.length) return null;
  const valid = entries.filter(e => e && typeof e.mood === 'number' && !isNaN(e.mood));
  if(!valid.length) return null;
  return +(valid.reduce((s, e) => s + e.mood, 0) / valid.length).toFixed(1);
}

/**
 * Detect a hidden emotional pattern from the last few check-ins.
 * Returns a supportive message string, or null if nothing notable.
 * Mirrors the "uncovering hidden stress patterns" goal of the brief.
 * @param {object[]} entries - Array of check-in entries.
 * @param {number} [entries[].mood] - The mood rating (1-5).
 * @param {string} [entries[].feeling] - The feeling label.
 * @param {number} [entries[].stress] - The stress level (1-5).
 * @returns {string|null} The detected pattern advice message, or null if none.
 */
function detectPattern(entries){
  if(!entries || entries.length < 3) return null;
  const r = entries.slice(-5);
  const low    = r.filter(x => x.mood <= 2).length;
  const numb   = r.filter(x => x.feeling === 'numb').length;
  const racing = r.filter(x => x.feeling === 'racing').length;
  const high   = r.filter(x => x.stress >= 3).length;
  if(numb >= 2)   return "You've felt blank or numb several times lately — that's emotional exhaustion, not weakness. Rest is not the same as giving up.";
  if(low >= 3)    return "Low mood for 3+ days running. This pattern suggests your mind needs a genuine break, not just a shorter study session.";
  if(high >= 4)   return "Consistently high stress this week. Consider talking to someone you trust — a friend, parent, or counselor.";
  if(racing >= 2) return "Your mind has been racing often. Try stepping away from study material a full hour before sleep.";
  return null;
}

// Export for Node-based test runners (ignored in the browser).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { escapeHTML, isValidPhone, computeStreak, averageMood, detectPattern };
}
