# Korean Tama MVP - Language Learning Tamagotchi

## Core Concept
The bird only speaks Korean. To feed it, you figure out what it's asking for by picking the right emoji. No English, no scores, no "lesson" framing — just a pet that happens to speak Korean.

## Implementation Plan

### Step 1: Word Bank Data Structure
Add a word bank at the top of the script in `index.html`:
- ~15-20 Korean words with emoji, organized by unlock tier
- Categories: food, drinks, fruit
- Each word has: `korean`, `emoji`, `tier` (0 = starter, 1 = unlocked after ~5 correct, 2 = after ~15, etc.)
- Starter words: 사과 🍎, 바나나 🍌, 빵 🍞, 물 💧, 우유 🥛

### Step 2: Quiz State & Persistence
Add state variables for the quiz system:
- `currentQuizWord` — the word the bird is currently asking for
- `wordStats` — per-word correct count, stored in `localStorage`
- `unlockedTier` — highest unlocked tier based on total correct answers
- Save/load from `localStorage` on init and after each correct answer

### Step 3: Dynamic Food Menu (Emoji-Only)
Replace the static 3-button food menu with dynamically generated buttons:
- When bird gets hungry, pick a random word from unlocked pool
- Generate 3 buttons: 1 correct emoji + 2 random distractor emojis (from same pool)
- Shuffle button order randomly
- Buttons show **emoji only** — no text labels
- Each button is slightly larger to make emoji tappable (~48x48)

### Step 4: Thought Bubble Shows Korean Request
Modify `updateThought()`:
- When hungry, thought bubble shows `"[korean word] 주세요!"` (e.g., "사과 주세요!")
- First few times a word appears, just show the word with 주세요
- Make thought bubble tappable to repeat speech (see Step 5)

### Step 5: Speech Synthesis
Add a `speak(text)` function using the Web Speech API:
- `const utterance = new SpeechSynthesisUtterance(text)`
- `utterance.lang = 'ko-KR'`
- `utterance.rate = 0.85` (slightly slower for learners)
- Auto-speak when thought bubble appears
- Tap thought bubble to hear it again
- Make thought bubble cursor: pointer when visible

### Step 6: Quiz-Gated Feeding Logic
Modify the food button click handler:
- On click, check if the clicked emoji matches `currentQuizWord.emoji`
- **Correct:** feed bird (existing `feedBird()` flow), increment word stats, save to localStorage
- **Wrong:** show a brief feedback (bird repeats itself more insistently — thought bubble text changes to just `"사과!"` without 주세요, re-speaks), food menu stays open, wrong button gets a subtle shake or dims out

### Step 7: Progression / Word Unlocking
- Track total correct answers across all words
- Tier 0: available immediately (5 words)
- Tier 1: unlocks at 10 total correct answers (~5 more words)
- Tier 2: unlocks at 25 total correct answers (~5 more words)
- Tier 3: unlocks at 50 total correct answers (~5 more words)
- When a new tier unlocks, show a celebratory fly animation + pop text with the new emoji joining

### Step 8: Streak-Triggered Flying
- Track consecutive correct answers
- 3+ correct in a row → trigger a fly animation (bird is excited)
- Replaces random flying — flying now means "bird is happy with you"
- Keep random walking for idle behavior

### Step 9: Word Selection Weighting (Simple Spaced Repetition)
- Words the player has gotten wrong recently appear more often
- Words mastered (5+ correct in a row) appear less often
- Simple weight: `weight = max(1, 5 - correctStreak)` per word
- Weighted random selection from unlocked pool

## Files Changed
- `index.html` — all changes in this single file (CSS + JS)

### Step 10: Debug Reset Button
- Small muted "RESET" text in the bottom-left corner, low opacity, same DotGothic16 font
- On tap, show a pixel-art styled confirm dialog: "Reset all progress? This cannot be undone." with [Yes] / [No]
- On confirm, clear `koreanTamaStats` from localStorage and reload the page (back to the egg)

## What We're NOT Doing (MVP Scope)
- No English anywhere in the UI
- No typing/input — selection only
- No audio files — Web Speech API only
- No new animations — reuse existing 6
- No separate JS files — keep single-file simplicity
- No grammar or sentences — single words only
- No explicit scoring or XP — progression is implicit via word unlocks
