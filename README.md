# MindMate – Mental Wellness Tracker

An AI-powered mental wellness companion for students preparing for competitive exams like NEET, JEE, CUET, CAT, GATE, and UPSC.

## Chosen Vertical
**Mental Wellness Tracker** – Built for high-stakes exam students facing stress, burnout, and self-doubt.

## Approach & Logic

MindMate uses Google's Gemini 1.5 Flash API to:
1. **Analyze journal entries** – Detects hidden stress triggers and emotional patterns from open-ended text
2. **Personalize responses** – Tailors advice based on mood score, stress level, exam type, and journal content
3. **Conversational AI companion** – Maintains chat context for empathetic, ongoing support
4. **Track patterns** – Mood trends and streak tracking via localStorage

## How It Works

1. **Daily Check-in** – Student selects mood (1–5), sets stress level (1–10), picks their exam, and journals freely
2. **AI Analysis** – Gemini reads the journal and returns a personalized, empathetic response with one coping strategy
3. **AI Chat** – Always-available conversational companion with quick-reply prompts for common stress states
4. **Insights** – Visual mood trend chart, average mood/stress scores, check-in streak
5. **Mindfulness** – 4-7-8 breathing (animated), 5-4-3-2-1 grounding, affirmations, Pomodoro break guide

## Tech Stack
- **Frontend:** Vanilla HTML + Tailwind CSS (CDN)
- **AI:** Google Gemini 1.5 Flash API
- **Storage:** localStorage (no backend required)
- **Deploy:** Vercel

## Assumptions
- Single-user app (no auth needed for MVP)
- Internet connection required for AI features
- Data stored locally in the browser
- Not a substitute for professional mental health care

## Crisis Support
iCall (India): **9152987821**
