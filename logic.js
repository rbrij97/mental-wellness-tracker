/*
 * Tyro — pure logic module
 * ------------------------------------------------------------------
 * These functions contain no DOM or network access, so they can be
 * unit-tested in isolation (see tests.html). index.html loads this
 * file before its main script and calls these globals directly.
 */

/** Escape a string for safe insertion into innerHTML (prevents XSS). */
function escapeHTML(str){
  return String(str ?? '').replace(/[&<>"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));
}

/** Validate a human-entered phone number (digits, spaces, dashes, optional +). */
function isValidPhone(phone){
  return /^[+\d][\d\s-]{5,}$/.test(String(phone || '').trim());
}

/**
 * Longest run of consecutive calendar days ending today/most-recent.
 * @param {string[]} isoDates - ISO date strings (one or more per day).
 * @returns {number}
 */
function computeStreak(isoDates){
  if(!isoDates || !isoDates.length) return 0;
  const days = [...new Set(isoDates.map(d => d.split('T')[0]))].sort().reverse();
  let streak = 1;
  for(let i = 1; i < days.length; i++){
    const diff = (new Date(days[i-1]) - new Date(days[i])) / 86400000;
    if(diff === 1) streak++; else break;
  }
  return streak;
}

/** Average mood (1–5) across entries, rounded to 1 decimal. null if empty. */
function averageMood(entries){
  if(!entries || !entries.length) return null;
  return +(entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1);
}

/**
 * Detect a hidden emotional pattern from the last few check-ins.
 * Returns a supportive message string, or null if nothing notable.
 * Mirrors the "uncovering hidden stress patterns" goal of the brief.
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
