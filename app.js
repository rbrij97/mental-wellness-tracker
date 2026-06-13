/*
 * app.js — Main application module for Tyro (Final Release v1.0.1)
 * ------------------------------------------------------------------
 * Handles UI interactions, navigation, Gemini API calls, and all
 * DOM-related logic. Pure logic helpers live in logic.js.
 */

// ── Config ──
// No API key is bundled — each user supplies their own free Gemini key via the
// in-app modal. It is stored only in their browser's localStorage and is never
// committed to the repository.
let API_KEY = localStorage.getItem('mindmate_api_key') || '';

/**
 * Build the Gemini API endpoint URL with the user's key.
 * @returns {string} The formatted Gemini API endpoint URL.
 */
function geminiURL() {
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(API_KEY)}`;
}

// ── Helpers ──
// escapeHTML, detectPattern, computeStreak, averageMood, isValidPhone live in logic.js

/**
 * Read user profile from localStorage.
 * @returns {object} The parsed user profile object.
 */
function getProfile() {
  return JSON.parse(localStorage.getItem('mindmate_profile') || '{}');
}

/**
 * Read all check-in entries from localStorage.
 * @returns {object[]} Array of check-in entries.
 */
function getEntries() {
  return JSON.parse(localStorage.getItem('mindmate_entries') || '[]');
}

/**
 * Persist a new check-in entry to localStorage.
 * @param {object} entry - The check-in entry object to save.
 * @returns {void}
 */
function saveEntry(entry) {
  const all = getEntries();
  all.push(entry);
  localStorage.setItem('mindmate_entries', JSON.stringify(all));
}

/**
 * Read trusted contacts from localStorage.
 * @returns {object[]} Array of saved contact objects.
 */
function getContacts() {
  return JSON.parse(localStorage.getItem('mindmate_contacts') || '[]');
}

// ── State ──
let selExamVal = null;
let selMoodVal = null;
let selFeelVal = null;
let selStressVal = null;
let chatHistory = [];
let breathTimer = null;

// ── Boot ──
const profile = JSON.parse(localStorage.getItem('mindmate_profile') || 'null');
if (profile) {
  boot();
}

/**
 * Initialize the main app after onboarding is complete.
 * @returns {void}
 */
function boot() {
  document.getElementById('onboard').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('mobile-nav').classList.remove('hidden');

  const p = getProfile();
  document.getElementById('side-name').textContent = p.name || 'Aspirant';
  document.getElementById('side-exam').textContent = (p.exam || 'Exam') + ' aspirant';
  document.getElementById('side-av').textContent = (p.name || 'A')[0].toUpperCase();

  setGreeting(p);
  initChat(p);
  checkFeedback();
  updateStats();
  renderHomeAI();
  nav('home');
}

/**
 * Display a time-appropriate greeting on the home page.
 * @param {object} p - The user profile.
 * @param {string} [p.name] - The name of the user.
 * @param {string} [p.exam] - The exam name.
 * @returns {void}
 */
function setGreeting(p) {
  const h = new Date().getHours();
  const eyebrow = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('home-eyebrow').textContent = eyebrow;
  document.getElementById('home-title').textContent = `Hey ${p.name || 'there'}`;
  document.getElementById('home-sub').textContent = `Your ${p.exam || 'exam'} journey continues — one honest day at a time.`;
}

// ──────────────────────────────────────────
// Navigation
// ──────────────────────────────────────────

/**
 * Switch visible page and update active nav indicators.
 * @param {string} page - The name of the page/view to display.
 * @returns {void}
 */
function nav(page) {
  document.querySelectorAll('.page').forEach(el => el.classList.add('hidden'));
  document.getElementById('page-' + page).classList.remove('hidden');

  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  document.getElementById('nav-' + page)?.classList.add('active');

  document.querySelectorAll('.mnav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('mnav-' + page)?.classList.add('active');

  if (page === 'checkin') resetCheckin();
  if (page === 'insights') renderInsights();

  document.querySelector('.main').scrollTop = 0;
  window.scrollTo(0, 0);
}

// ──────────────────────────────────────────
// Onboarding
// ──────────────────────────────────────────

/**
 * Select an exam chip during onboarding.
 * @param {HTMLElement} el - The clicked chip element.
 * @param {string} exam - The selected exam type.
 * @returns {void}
 */
function selExam(el, exam) {
  document.querySelectorAll('.exam-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selExamVal = exam;
}

/**
 * Complete onboarding: validate inputs, save profile, and boot the app.
 * @returns {void}
 */
function completeOnboard() {
  const name = document.getElementById('ob-name').value.trim();
  if (!name) return alert('Please enter your name');
  if (!selExamVal) return alert('Please select your exam');
  localStorage.setItem('mindmate_profile', JSON.stringify({ name, exam: selExamVal }));
  boot();
}

// ──────────────────────────────────────────
// Check-in
// ──────────────────────────────────────────

/**
 * Reset the check-in form to its initial state.
 * @returns {void}
 */
function resetCheckin() {
  selMoodVal = null;
  selFeelVal = null;
  selStressVal = null;
  document.querySelectorAll('.mood-opt,.feel-opt').forEach(e => e.classList.remove('selected'));
  document.getElementById('journal').value = '';
  document.getElementById('s1-next').disabled = true;
  document.getElementById('s2-next').disabled = true;
  goStep(1);
}

/**
 * Render the step progress bar for the check-in wizard.
 * @param {number} active - The active step index (1-3).
 * @returns {void}
 */
function renderStepBar(active) {
  document.getElementById('step-bar').innerHTML = [1, 2, 3]
    .map(i => `<div class="step-seg ${i <= active ? 'on' : ''}"></div>`)
    .join('');
}

/**
 * Navigate to a specific step in the check-in wizard.
 * @param {number} n - The target step number.
 * @returns {void}
 */
function goStep(n) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('step-' + n).classList.add('active');
  renderStepBar(Math.min(n, 3));
  document.querySelector('.main').scrollTop = 0;
  window.scrollTo(0, 0);
}

/**
 * Select a mood value during check-in step 1.
 * @param {number} v - The selected mood rating (1-5).
 * @param {HTMLElement} el - The clicked mood option element.
 * @returns {void}
 */
function selMood(v, el) {
  selMoodVal = v;
  document.querySelectorAll('.mood-opt').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('s1-next').disabled = false;
}

/**
 * Select a feeling label and stress level during check-in step 2.
 * @param {string} label - The feeling label.
 * @param {number} stress - The stress level rating (1-5).
 * @param {HTMLElement} el - The clicked feeling option element.
 * @returns {void}
 */
function selFeel(label, stress, el) {
  selFeelVal = label;
  selStressVal = stress;
  document.querySelectorAll('.feel-opt').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('s2-next').disabled = false;
}

/**
 * Submit the check-in, call Gemini for analysis, and display results.
 * @returns {Promise<void>}
 */
async function submitCheckin() {
  const btn = document.getElementById('s3-next');
  btn.textContent = 'Analyzing...';
  btn.disabled = true;

  const journal = document.getElementById('journal').value.trim();
  const p = getProfile();

  saveEntry({
    date: new Date().toISOString(),
    mood: selMoodVal,
    feeling: selFeelVal,
    stress: selStressVal,
    journal
  });

  const moodMap = ['', 'Overwhelmed', 'Anxious', 'Neutral', 'Calm', 'Confident'];
  const feelMap = {
    racing: 'mind racing/overthinking',
    heavy: 'heavy and exhausted',
    worried: 'mildly worried',
    focused: 'focused and in control',
    numb: 'blank/numb inside',
    hopeful: 'hopeful'
  };

  const all = getEntries();
  const pattern = detectPattern(all);
  const fb = all.filter(e => e.feedbackGiven).slice(-3);
  const helped = fb.filter(e => e.adviceHelped).length;

  const prompt = `You are Tyro, a warm empathetic AI wellness companion for ${p.name}, a student preparing for ${p.exam} in India.

Today's check-in:
- Mood: ${moodMap[selMoodVal]} (${selMoodVal}/5)
- Stress feeling: ${feelMap[selFeelVal] || selFeelVal}
- Journal: "${journal || 'No entry'}"
${helped > 0 ? `- Past advice helped ${helped} of ${fb.length} times` : ''}

Write a warm personalized response (3-4 sentences) that:
1. Acknowledges their exact emotional state (reference the feeling specifically)
2. Picks up one detail from their journal if provided
3. Gives one concrete ${p.exam}-specific coping tip
4. Ends with genuine brief encouragement (no clichés)
Be human, warm, concise. No bullet points. 1-2 emojis. Under 90 words.`;

  try {
    const res = await callGemini(prompt);
    document.getElementById('result-text').textContent = res;
    document.getElementById('home-ai-text').textContent = res;
    document.getElementById('home-ai').classList.remove('hidden');

    if (pattern) {
      document.getElementById('result-pattern-text').textContent = pattern;
      document.getElementById('result-pattern').classList.remove('hidden');
      document.getElementById('home-pattern-text').textContent = pattern;
      document.getElementById('home-pattern').classList.remove('hidden');
    } else {
      document.getElementById('result-pattern').classList.add('hidden');
      document.getElementById('home-pattern').classList.add('hidden');
    }
  } catch (e) {
    document.getElementById('result-text').textContent =
      "I'm having trouble connecting right now — but you showed up today, and that already takes strength. 💙";
  }

  updateStats();
  goStep(4);
  btn.textContent = '✨ Analyze & Support';
  btn.disabled = false;

  // Gently surface support if the student seems to be in real distress
  if (selMoodVal === 1 && selStressVal >= 3) {
    setTimeout(openSOS, 900);
  }
}

// ──────────────────────────────────────────
// Feedback
// ──────────────────────────────────────────

/**
 * Check if yesterday's entry needs feedback and show the prompt.
 * @returns {void}
 */
function checkFeedback() {
  const entries = getEntries();
  if (!entries.length) return;

  const last = entries[entries.length - 1];
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (new Date(last.date).toDateString() === yesterday && !last.feedbackGiven) {
    document.getElementById('feedback-box').classList.remove('hidden');
  }
}

/**
 * Record whether yesterday's advice helped.
 * @param {boolean} helped - True if the advice was helpful, false otherwise.
 * @returns {void}
 */
function logFeedback(helped) {
  const entries = getEntries();
  if (entries.length) {
    entries[entries.length - 1].feedbackGiven = true;
    entries[entries.length - 1].adviceHelped = helped;
    localStorage.setItem('mindmate_entries', JSON.stringify(entries));
  }
  document.getElementById('feedback-box').classList.add('hidden');
}

// ──────────────────────────────────────────
// Stats
// ──────────────────────────────────────────

/**
 * Update the stats cards on the home page.
 * @returns {void}
 */
function updateStats() {
  const entries = getEntries();
  document.getElementById('stat-checkins').textContent = entries.length;

  if (!entries.length) {
    document.getElementById('stat-mood').textContent = '—';
    document.getElementById('stat-streak').textContent = '0';
    return;
  }

  document.getElementById('stat-streak').textContent = computeStreak(entries.map(x => x.date));
  document.getElementById('stat-mood').textContent = averageMood(entries);
}

/**
 * Render the AI summary and pattern detection on the home page.
 * @returns {void}
 */
function renderHomeAI() {
  const entries = getEntries();
  if (!entries.length) return;

  const pattern = detectPattern(entries);
  if (pattern) {
    document.getElementById('home-pattern-text').textContent = pattern;
    document.getElementById('home-pattern').classList.remove('hidden');

    const last = entries[entries.length - 1];
    if (last.journal) {
      const preview = last.journal.slice(0, 120) + (last.journal.length > 120 ? '...' : '');
      document.getElementById('home-ai-text').textContent =
        `You last wrote: "${preview}" — I'm keeping an eye on how you're trending. Check in today and I'll give you fresh, tailored support.`;
      document.getElementById('home-ai').classList.remove('hidden');
    }
  }
}

// ──────────────────────────────────────────
// Insights
// ──────────────────────────────────────────

/**
 * Render the full insights page with mood trend, patterns, and stats.
 * @returns {void}
 */
function renderInsights() {
  const entries = getEntries();
  const wrap = document.getElementById('insights-body');

  if (!entries.length) {
    wrap.innerHTML = '<div class="empty"><div class="ei">📊</div><p>Complete your first check-in to unlock insights.</p></div>';
    return;
  }

  const avg = averageMood(entries);
  const moodLabels = ['', 'Overwhelmed', 'Anxious', 'Neutral', 'Calm', 'Confident'];
  const feelMap = { racing: 'Mind Racing', heavy: 'Exhausted', worried: 'Worried', focused: 'Focused', numb: 'Numb', hopeful: 'Hopeful' };

  // Count feeling frequencies
  const feelingCounts = {};
  entries.forEach(x => {
    if (x.feeling) feelingCounts[x.feeling] = (feelingCounts[x.feeling] || 0) + 1;
  });
  const topFeeling = Object.entries(feelingCounts).sort((a, b) => b[1] - a[1])[0];

  const pattern = detectPattern(entries);
  const helped = entries.filter(x => x.adviceHelped === true).length;

  // Build mood trend bars for last 7 entries
  const last7 = entries.slice(-7);
  const colors = ['', '#f87171', '#fb923c', '#facc15', '#60a5fa', '#34d399'];
  const bars = last7.map(x =>
    `<div class="bar-c"><div class="bar" style="height:${(x.mood / 5) * 100}%;background:${colors[x.mood]};box-shadow:0 0 16px ${colors[x.mood]}40;"></div><div class="bar-d">${new Date(x.date).toLocaleDateString('en-IN', { weekday: 'short' })}</div></div>`
  ).join('');

  wrap.innerHTML = `
    <div class="grid grid-3" style="margin-bottom:18px;">
      <div class="card"><div class="stat-ico green">♡</div><div class="stat-num">${avg}</div><div class="stat-label">${moodLabels[Math.round(avg)]}</div></div>
      <div class="card"><div class="stat-ico purple">✎</div><div class="stat-num">${entries.length}</div><div class="stat-label">Days tracked</div></div>
      <div class="card"><div class="stat-ico amber">◆</div><div class="stat-num" style="font-size:19px;line-height:1.3;padding-top:6px;">${topFeeling ? (feelMap[topFeeling[0]] || topFeeling[0]) : '—'}</div><div class="stat-label">Most common feeling${topFeeling ? ` · ${topFeeling[1]}×` : ''}</div></div>
    </div>
    ${pattern ? `<div class="card" style="margin-bottom:18px;background:rgba(226,194,117,0.06);border-color:rgba(226,194,117,0.2);"><div class="pattern-label" style="margin-bottom:8px;">AI Pattern Detected</div><div class="pattern-text" style="font-size:15px;">${pattern}</div></div>` : ''}
    <div class="card" style="margin-bottom:18px;">
      <div style="font-size:14px;font-weight:600;color:var(--text2);margin-bottom:6px;">Mood Trend — Last 7 Days</div>
      <div class="bars">${bars}</div>
    </div>
    ${helped > 0 ? `<div class="card" style="text-align:center;background:rgba(52,211,153,0.06);border-color:rgba(52,211,153,0.18);"><div class="ai-body" style="color:var(--green);">Tyro's advice has helped you <strong>${helped} time${helped > 1 ? 's' : ''}</strong> so far. Keep going.</div></div>` : ''}
  `;
}

// ──────────────────────────────────────────
// Chat
// ──────────────────────────────────────────

/**
 * Initialize the chat greeting with the user's name and exam.
 * @param {object} p - The user profile.
 * @param {string} [p.name] - The name of the user.
 * @param {string} [p.exam] - The exam name.
 * @returns {void}
 */
function initChat(p) {
  document.getElementById('chat-greeting').innerHTML =
    `Hey ${escapeHTML(p.name) || 'there'}, I'm Tyro.<br><br>Whether you need to vent, want motivation, or just have to get something off your chest — I'm here for your ${escapeHTML(p.exam) || 'exam'} journey. What's going on?`;
}

/**
 * Send a chat message, call Gemini, and display the response.
 * @returns {Promise<void>}
 */
async function sendChat() {
  const inp = document.getElementById('chat-in');
  const msg = inp.value.trim();
  if (!msg) return;

  inp.value = '';
  addMsg('user', msg);
  chatHistory.push(msg);

  const typing = addTyping();
  const p = getProfile();
  const ctx = chatHistory.slice(-6).join(' | ');

  const prompt = `You are Tyro, a warm empathetic AI wellness companion for ${p.name || 'a student'} preparing for ${p.exam || 'competitive exams'} in India.
Context: ${ctx}
Latest: "${msg}"
Respond warmly and concisely (under 80 words). Reference their exam when relevant. Be human, not robotic. No emojis. No bullet points.`;

  try {
    const reply = await callGemini(prompt);
    typing.remove();
    addMsg('ai', reply);
  } catch (e) {
    typing.remove();
    addMsg('ai', "I'm having a connection issue — give me a moment and try again.");
  }
}

/**
 * Fill the chat input with a quick-reply message and send it.
 * @param {string} msg - The chat message text to send.
 * @returns {void}
 */
function qChat(msg) {
  document.getElementById('chat-in').value = msg;
  sendChat();
}

/**
 * Append a chat message bubble to the chat scroll area.
 * @param {string} role - The sender's role ('user' or 'ai').
 * @param {string} text - The message text content.
 * @returns {HTMLElement} The created message wrapper element.
 */
function addMsg(role, text) {
  const scrollArea = document.getElementById('chat-scroll');
  const div = document.createElement('div');
  div.className = `msg ${role}`;

  const safe = escapeHTML(text);
  const avatarSVG = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6 H18 V9.4 H13.6 V18 H10.4 V9.4 H6 Z" fill="#fff"/></svg>';

  if (role === 'ai') {
    div.innerHTML = `<div class="msg-av">${avatarSVG}</div><div class="bubble ai">${safe}</div>`;
  } else {
    div.innerHTML = `<div class="bubble user">${safe}</div>`;
  }

  scrollArea.appendChild(div);
  scrollArea.scrollTop = scrollArea.scrollHeight;
  return div;
}

/**
 * Show a typing indicator in the chat.
 * @returns {HTMLElement} The created typing indicator element.
 */
function addTyping() {
  const scrollArea = document.getElementById('chat-scroll');
  const div = document.createElement('div');
  div.className = 'msg ai';

  const avatarSVG = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6 H18 V9.4 H13.6 V18 H10.4 V9.4 H6 Z" fill="#fff"/></svg>';
  div.innerHTML = `<div class="msg-av">${avatarSVG}</div><div class="bubble ai"><div class="typing"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div></div>`;

  scrollArea.appendChild(div);
  scrollArea.scrollTop = scrollArea.scrollHeight;
  return div;
}

// ──────────────────────────────────────────
// Recharge
// ──────────────────────────────────────────

/**
 * Fetch a personalized motivational message from Gemini.
 * @returns {Promise<void>}
 */
async function getInspiration() {
  const btn = document.getElementById('inspire-btn');
  btn.textContent = 'Generating...';
  btn.disabled = true;

  const el = document.getElementById('inspire-text');
  el.classList.remove('placeholder');

  const p = getProfile();
  const entries = getEntries();
  const lastMood = entries.length ? entries[entries.length - 1].mood : 3;
  const moodWords = ['', 'overwhelmed', 'anxious', 'neutral', 'calm', 'confident'];

  const prompt = `Write a powerful motivational message (2-3 sentences) for ${p.name || 'a student'} preparing for ${p.exam || 'competitive exams'} in India, currently feeling ${moodWords[lastMood]}. Make it personal and real, specific to Indian exam culture. No generic clichés. End with one punchy memorable line. No emojis.`;

  try {
    el.textContent = await callGemini(prompt);
  } catch (e) {
    el.textContent = "You chose the hardest path because you're capable of walking it. Every page you push through is one others gave up on. Consistency is your superpower.";
  }

  btn.textContent = 'Inspire Me Again';
  btn.disabled = false;
}

/**
 * Fetch a light-hearted joke from Gemini.
 * @returns {Promise<void>}
 */
async function getJoke() {
  const btn = document.getElementById('joke-btn');
  btn.textContent = 'Loading...';
  btn.disabled = true;

  const el = document.getElementById('joke-text');
  el.classList.remove('placeholder');

  const p = getProfile();
  const prompt = `Tell one short, clean, genuinely funny joke or witty one-liner for an Indian student preparing for ${p.exam || 'competitive exams'}. Keep it light and relatable. Under 3 sentences.`;

  try {
    el.textContent = await callGemini(prompt);
  } catch (e) {
    el.textContent = "Why did the student bring a ladder to the exam hall? Because everyone warned the paper would be on a higher level!";
  }

  btn.textContent = 'Another One';
  btn.disabled = false;
}

// ──────────────────────────────────────────
// Breathing Exercise
// ──────────────────────────────────────────

/**
 * Start the animated 4-7-8 breathing exercise modal.
 * @returns {void}
 */
function startBreathing() {
  document.getElementById('breath-modal').classList.remove('hidden');

  const phases = [
    { l: 'Breathe in', d: 4 },
    { l: 'Hold', d: 7 },
    { l: 'Breathe out', d: 8 }
  ];
  let phaseIndex = 0;
  let remaining = phases[0].d;

  const orb = document.getElementById('breath-orb');
  orb.style.transform = 'scale(1.25)';
  document.getElementById('breath-phase').textContent = phases[0].l;
  document.getElementById('breath-count').textContent = remaining;

  breathTimer = setInterval(() => {
    remaining--;
    document.getElementById('breath-count').textContent = remaining;

    if (remaining <= 0) {
      phaseIndex = (phaseIndex + 1) % 3;
      remaining = phases[phaseIndex].d;
      document.getElementById('breath-phase').textContent = phases[phaseIndex].l;
      document.getElementById('breath-count').textContent = remaining;
      orb.style.transform = phaseIndex === 2 ? 'scale(0.85)' : 'scale(1.25)';
    }
  }, 1000);
}

/**
 * Stop the breathing exercise and close the modal.
 * @returns {void}
 */
function stopBreathing() {
  document.getElementById('breath-modal').classList.add('hidden');
  if (breathTimer) {
    clearInterval(breathTimer);
    breathTimer = null;
  }
}

// ──────────────────────────────────────────
// Emergency / SOS
// ──────────────────────────────────────────

/**
 * Open the SOS modal with crisis helplines and trusted contacts.
 * @returns {void}
 */
function openSOS() {
  renderContacts();
  document.getElementById('sos-modal').classList.remove('hidden');
}

/**
 * Close the SOS modal.
 * @returns {void}
 */
function closeSOS() {
  document.getElementById('sos-modal').classList.add('hidden');
}

/**
 * Render saved trusted contacts inside the SOS modal.
 * @returns {void}
 */
function renderContacts() {
  const list = getContacts();
  const el = document.getElementById('contacts-list');

  if (!list.length) {
    el.innerHTML = '<div class="contact-empty">No trusted contacts saved yet. Add someone you can call when things get heavy — a friend, sibling, or parent.</div>';
    return;
  }

  el.innerHTML = list.map((c, i) => `<div class="call-row" style="cursor:default;">
    <div class="call-ico" style="background:rgba(109,138,255,0.12);color:var(--primary2);">♥</div>
    <div><div class="call-name">${escapeHTML(c.name)}</div><div class="call-meta">Trusted contact</div></div>
    <a href="tel:${encodeURIComponent(c.phone)}" class="call-num" style="color:var(--primary2);text-decoration:none;" aria-label="Call ${escapeHTML(c.name)}">Call</a>
    <span class="contact-del" role="button" tabindex="0" onclick="delContact(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();delContact(${i});}" aria-label="Remove ${escapeHTML(c.name)}" title="Remove">×</span>
  </div>`).join('');
}

/**
 * Add a new trusted contact after validating name and phone.
 * @returns {void}
 */
function addContact() {
  const name = document.getElementById('contact-name').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();

  if (!name || !phone) return alert('Please enter both a name and phone number.');
  if (!isValidPhone(phone)) return alert('Please enter a valid phone number.');

  const list = getContacts();
  list.push({ name, phone });
  localStorage.setItem('mindmate_contacts', JSON.stringify(list));

  document.getElementById('contact-name').value = '';
  document.getElementById('contact-phone').value = '';
  renderContacts();
}

/**
 * Delete a trusted contact by index.
 * @param {number} i - The index of the contact to delete.
 * @returns {void}
 */
function delContact(i) {
  const list = getContacts();
  list.splice(i, 1);
  localStorage.setItem('mindmate_contacts', JSON.stringify(list));
  renderContacts();
}

// ──────────────────────────────────────────
// Gemini API
// ──────────────────────────────────────────

/**
 * Call the Gemini 1.5 Flash API with a prompt.
 * Shows the API key modal if no key is configured.
 * @param {string} prompt - The text prompt to send.
 * @returns {Promise<string>} The generated response text.
 */
async function callGemini(prompt) {
  if (!API_KEY) {
    document.getElementById('api-modal').classList.remove('hidden');
    throw new Error('No API key configured. Please enter your Gemini API key.');
  }

  const res = await fetch(geminiURL(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 300 }
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini API returned status ${res.status}`);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Save the API key from the modal input to localStorage.
 * @returns {void}
 */
function saveKey() {
  const key = document.getElementById('api-in').value.trim();
  if (!key) return alert('Please enter a key');
  API_KEY = key;
  localStorage.setItem('mindmate_api_key', key);
  document.getElementById('api-modal').classList.add('hidden');
}

// ──────────────────────────────────────────
// Data Management
// ──────────────────────────────────────────

/**
 * Confirm and execute a full data reset, clearing all localStorage keys.
 * @returns {void}
 */
function confirmReset() {
  if (confirm('Reset all Tyro data? This cannot be undone.')) {
    ['mindmate_profile', 'mindmate_entries', 'mindmate_api_key', 'mindmate_contacts']
      .forEach(k => localStorage.removeItem(k));
    location.reload();
  }
}

// ──────────────────────────────────────────
// Demo Data
// ──────────────────────────────────────────

/**
 * Load a 7-day demo dataset for showcasing the app.
 * @returns {void}
 */
function loadDemo() {
  const daysAgoISO = offset => new Date(Date.now() - offset * 86400000).toISOString();

  localStorage.setItem('mindmate_profile', JSON.stringify({ name: 'Arjun', exam: 'JEE' }));
  localStorage.setItem('mindmate_entries', JSON.stringify([
    { date: daysAgoISO(6), mood: 2, feeling: 'racing', stress: 3, journal: 'Physics mock went badly. I blanked out on electrostatics completely. Feel like I will never crack JEE.', feedbackGiven: true, adviceHelped: true },
    { date: daysAgoISO(5), mood: 2, feeling: 'heavy', stress: 3, journal: 'Slept only 4 hours. Could not stop thinking about the mock. Tried studying but nothing went in.', feedbackGiven: true, adviceHelped: false },
    { date: daysAgoISO(4), mood: 3, feeling: 'worried', stress: 2, journal: 'Revised electrostatics slowly. Starting to understand. Still nervous about time left.', feedbackGiven: true, adviceHelped: true },
    { date: daysAgoISO(3), mood: 2, feeling: 'numb', stress: 3, journal: 'Feeling very blank today. Not stressed exactly, just empty. Did not study much.', feedbackGiven: false },
    { date: daysAgoISO(2), mood: 3, feeling: 'worried', stress: 2, journal: 'Chemistry was okay. Organic going well. Worried about integration in Maths.', feedbackGiven: true, adviceHelped: true },
    { date: daysAgoISO(1), mood: 4, feeling: 'focused', stress: 1, journal: 'Great session! Solved 20 integration problems. Feeling confident. Slept well too.', feedbackGiven: false },
    { date: daysAgoISO(0), mood: 3, feeling: 'worried', stress: 2, journal: 'Full mock tomorrow. Anxious but also prepared. Hope it goes well.', feedbackGiven: false },
  ]));

  boot();
}

// ──────────────────────────────────────────
// Accessibility
// ──────────────────────────────────────────

/**
 * Make clickable elements keyboard-operable and ensure inputs are labelled.
 * @returns {void}
 */
function initA11y() {
  const clickSelectors = '.nav-link,.mnav-item,.chip,.mood-opt,.feel-opt,.exam-chip,.sound-card,.sos-btn,.sos-pill,.hero-orb,.reset-link';

  document.querySelectorAll(clickSelectors).forEach(el => {
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });

  // Label inputs/textareas that only have a placeholder
  document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(el => {
    if (!el.hasAttribute('aria-label')) {
      el.setAttribute('aria-label', el.getAttribute('placeholder'));
    }
  });
}

initA11y();
