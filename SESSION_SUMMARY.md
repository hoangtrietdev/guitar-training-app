# Guitar Trainer App – Session Summary

## 1. Project Context & Current State
The project is a Progressive Web App (PWA) designed to help guitarists practice scales, arpeggios, and custom sequences. The core functionality centers around visual learning and metronome-based timing, supported by real-time AI-generated exercises (via Llama 3.3).

**Active Features:**
- **Two-row Vertical Practice UI**: Top half displays a fully interactive Fretboard. The bottom half contains a unified, perfectly centered scrolling view of Standard Notation (VexFlow) and Tablature (HTML Canvas).
- **Scale Generation**: Covers C, D, E, F, G, A, B in Major, Minor, Jazz (Dorian), Blues, and Arpeggios. Difficulty 1-5 are algorithmic; 6-10 are fetched from the Groq AI API.
- **Metronome Engine**: AudioContext-based sequencer with a precise Web Audio clock.
- **Dark Mode UI**: Features a clean, Apple-inspired aesthetic with `#0A84FF` and `#FF9F0A` accents. The Sheet Viewer sits on a `#F8F9FA` card with original black notation rendering for highest legibility.

## 2. Recent Fixes & Implementation Details
- **Tablature rendering bug**: Fixed the vertical scaling cutoff issue (`height` vs `overflow-y-hidden`) and corrected the string indexing so that the Low E string is correctly placed at the bottom, matching standard tablature conventions. 
- **Auto-start loop race condition**: Fixed an infinite loop bug where API loading (while `notes.length` became 0) triggered the end-of-exercise `finished` state prematurely, which caused the auto-looper to fire infinitely.
- **Metronome lifecycle**: Ensured that the Stop/Reset mechanisms correctly flush out scheduled audio events and reset `currentNoteIndex` to 0.

## 3. Pending Roadmap (For Next Session)
- **Record & Evaluation Mode (New Feature)**: The Pitch Detection via Microphone logic has been fully disabled during standard metronome practice. The next step is to branch out a dedicated "Record" feature. This feature should listen to user playing, advance notes strictly based on pitch detection (or measure precise timing accuracy against a backing track), and generate a final "Accuracy Report" to give the user structured feedback on missed notes and rhythmic errors.
- **Audio Tuning**: Further testing the robust Pitch Detection (currently built with auto-correlation logic in `usePitchDetection.ts`) at higher speeds (e.g. 150+ BPM) during the upcoming Record Mode phase.
