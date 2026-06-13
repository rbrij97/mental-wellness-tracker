# Tyro — AI Wellness Companion for Exam Aspirants

Tyro is a Generative-AI wellness companion built for students preparing for high-stakes exams (NEET, JEE, CUET, CAT, GATE, UPSC). It helps them monitor mental well-being, journal daily, uncover hidden stress patterns, and get personalised, exam-aware support — plus an always-available emergency safety net.

> A *tyro* means a learner / beginner — fitting for every aspirant. The name also matches the "T" logo.

## Chosen Vertical
**Mental Wellness Tracker** — for students facing stress, burnout, and self-doubt during exam prep.

## Approach & Logic
Tyro uses Google's **Gemini 1.5 Flash** to go beyond a normal mood tracker:

1. **Analyses open-ended journals** — reads free-text entries to surface stress triggers and emotional patterns standard trackers miss.
2. **Hyper-personalised** — every response is tuned to the student's name, exam, mood, stress feeling, and recent journal.
3. **Proactive pattern detection** — after a few check-ins, Tyro flags trends (e.g. repeated numbness = burnout) without being asked.
4. **Adaptive feedback loop** — asks if yesterday's advice helped and factors that into future support.

## How It Works
- **Onboarding** (once): name + exam, saved locally.
- **Daily Check-in** — a calm, step-by-step flow: mood → *how stress feels* (descriptive cards, not a 1–10 number) → free journal → AI analysis + pattern alert.
- **AI Companion** — conversational chat for venting, motivation, or focus help.
- **Recharge** — AI "Inspire Me", a stress-buster, and a 60-second guided breathing exercise.
- **Insights** — mood trend, average mood, most-common feeling, AI-detected patterns.
- **Need help now? (SOS)** — always reachable: one-tap verified Indian helplines (Tele-MANAS 14416, iCall, Vandrevala, AASRA) and user-saved trusted contacts. Surfaces automatically when a check-in signals high distress.

## Tech Stack
- **Frontend:** Vanilla HTML + CSS (no build step), responsive desktop sidebar / mobile bottom-nav
- **Logic:** `logic.js` — pure, testable functions (pattern detection, streak, validation, escaping)
- **AI:** Google Gemini 1.5 Flash
- **Storage:** browser `localStorage` (no backend)
- **Deploy:** static host (Vercel)

## Setup
1. Open `index.html` (or deploy the folder to any static host).
2. On first AI action, paste a **free Gemini API key** from [aistudio.google.com](https://aistudio.google.com). It is stored **only in your browser** and is never committed to the repo.
3. Prefer to explore first? Click **"Explore Demo Mode"** on the welcome screen for sample data.

## Security & Privacy
- **No API key is bundled** — each user supplies their own; it lives only in `localStorage`.
- All user/AI text is **HTML-escaped** before rendering (XSS-safe).
- All data stays on the user's device; nothing is sent to any server except the Gemini API call.

## Accessibility
- Keyboard-operable controls (`role="button"`, tab focus, Enter/Space activation)
- Visible focus outlines, `aria-label`s on inputs, high-contrast dark theme

## Assumptions
- Single-user, per-device (no accounts).
- Internet required for AI features.
- Not a substitute for professional mental-health care.

## Crisis Support (India)
Tele-MANAS **14416** · iCall **9152987821** · Vandrevala **1860-2662-2345** · AASRA **9820466726**
