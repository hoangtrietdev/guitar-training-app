# Project Plan: Interactive Guitar Scale & Arpeggio Trainer (PWA)

## 1. Project Overview & Architecture
This document outlines the architecture, design system, and implementation roadmap for a real-time, interactive web application aimed at guitarists. The application allows users to practice scales (Major, Minor, Jazz, Blues, Arpeggios) across various keys, providing a Yousician-like experience with scrolling tablature, a fretboard visualizer, and real-time pitch detection to evaluate accuracy.

### 1.1 Tech Stack
* **Framework:** Next.js (Page Router)
* **Language:** TypeScript (Strict Mode enabled)
* **Package Manager:** pnpm
* **Styling:** Tailwind CSS + `clsx` + `tailwind-merge`
* **State Management:** Zustand (for lightweight, unopinionated global state, especially crucial for audio/UI sync without excessive re-renders)
* **Sheet/Tab Rendering:** VexFlow (Standard notation and Tablature rendering via HTML5 Canvas/SVG)
* **Audio Processing:** Web Audio API + PitchFinder (YIN/AMDF algorithms for monophonic pitch detection)
* **PWA Setup:** `next-pwa`

---

## 2. Design System & UI/UX Foundations

The UI must be distraction-free, highly readable during fast practice sessions, and responsive to both mobile (especially landscape) and desktop environments.

### 2.1 Color Palette (Dark Theme Default)
A dark theme reduces eye strain during long practice sessions and makes color-coded feedback pop out.
* **Backgrounds:** * Main: `#121212` (Deep Gray/Black)
    * Surface/Cards: `#1E1E1E`
* **Typography:** * Primary Text: `#E0E0E0`
    * Muted Text: `#A0A0A0`
* **Functional/Feedback Colors:**
    * **Brand/Accent:** `#3B82F6` (Tailwind Blue-500 - for active states, metronome beats)
    * **Success (Hit Note):** `#10B981` (Tailwind Emerald-500)
    * **Error (Missed/Wrong Pitch):** `#EF4444` (Tailwind Red-500)
    * **Pending/Next Note:** `#F59E0B` (Tailwind Amber-500)

### 2.2 Typography & Spacing
* **Font:** Inter (Sans-serif) for UI elements. A monospaced font (e.g., Fira Code or Roboto Mono) for specific musical notations or tempo numbers if necessary.
* **Spacing:** 8pt grid system (Tailwind default) to ensure consistent margins and paddings.

### 2.3 UX Principles
* **Landscape First (Mobile):** The practice view (fretboard + scrolling tabs) requires horizontal real estate. Force or heavily suggest landscape orientation on mobile devices via CSS/Screen Orientation API.
* **Count-in:** Implement a 1-bar or 2-bar visual and auditory count-in before the exercise starts, giving the guitarist time to place their hands on the neck.
* **Minimal Re-renders:** The UI displaying the moving playhead must not trigger deep React component tree re-renders. Use `requestAnimationFrame` and direct DOM/Canvas manipulation where possible.

---

## 3. Application Architecture & Folder Structure

Following a feature-driven, maintainable structure within the Next.js Page Router paradigm.

```text
src/
├── pages/
│   ├── _app.tsx              # Global providers (Zustand, PWA manifest link)
│   ├── _document.tsx         # Custom Document for PWA meta tags and font imports
│   ├── index.tsx             # Dashboard / Scale Selection
│   └── practice/
│       └── [key]/[scale].tsx # Dynamic route for the practice view (e.g., /practice/C/jazz)
├── components/
│   ├── common/               # Buttons, Dropdowns, Modals, Layout
│   ├── music/
│   │   ├── Fretboard.tsx     # SVG/Canvas rendering of the guitar neck
│   │   ├── Metronome.tsx     # Visual metronome indicator
│   │   └── TabViewer.tsx     # Wrapper for VexFlow rendering
│   └── setup/
│       └── AudioSetup.tsx    # Microphone permission request UI
├── hooks/
│   ├── useAudioContext.ts    # Manages the singleton Web Audio Context
│   ├── usePitchDetection.ts  # Bridges Microphone stream with PitchFinder
│   ├── useMetronome.ts       # Logic for accurate timing (Web Audio API scheduled)
│   └── useScaleGenerator.ts  # Music theory logic (generates notes for C Jazz, G Blues, etc.)
├── store/
│   ├── useAppStore.ts        # Global UI state (theme, user preferences)
│   └── usePracticeStore.ts   # Volatile state during a session (current score, tempo, active note)
├── lib/
│   ├── vexflow/              # VexFlow specific configuration and drawing helpers
│   ├── audio/                # Pitch detection algorithms and audio worker scripts
│   └── music-theory/         # Constants for frequencies, note mappings, intervals
├── types/
│   ├── index.ts              # Global TypeScript interfaces
│   └── music.d.ts            # Specific types for Note, Scale, Tuning (Standard E)
└── utils/
    ├── frequencyToNote.ts    # Converts Hz to nearest musical note
    └── classnames.ts         # clsx + tailwind-merge wrapper

```

## 4. Core Logic & Data Flow
The most complex architectural challenge is synchronizing the visual tab, the scheduled tempo, and the real-time audio input.

### 4.1 Timing & Synchronization (The Game Loop)
React's standard lifecycle (useEffect, setInterval) is too imprecise for musical timing.

Audio Clock: Use AudioContext.currentTime as the absolute source of truth.

Lookahead Scheduler: Implement a web-audio lookahead scheduler. A setInterval checks every ~25ms and schedules the next notes/ticks slightly in advance (e.g., 100ms) into the AudioContext.

Visual Loop: Use requestAnimationFrame to draw the moving playhead over the VexFlow canvas based on AudioContext.currentTime.

### 4.2 Pitch Detection Flow
Input: navigator.mediaDevices.getUserMedia({ audio: true })

Processing: Route the stream through an AnalyserNode.

Detection: Use requestAnimationFrame to pull Float32Array data from the AnalyserNode and pass it to PitchFinder (AMDF algorithm is usually fast and accurate enough for real-time guitar).

Validation: Convert the detected frequency (Hz) to a MIDI note/String-Fret combination. Compare this against the expected note from the scheduled sequence.

Feedback: Update the state (Hit/Miss) to trigger UI color changes on the specific note on the Tab and Fretboard.

## 5. Implementation Roadmap (Phased Execution)
### Phase 1: Foundation & Setup
Initialize Next.js Page Router project with pnpm, TypeScript, and Tailwind.

Setup eslint and prettier for strict code quality.

Configure the basic folder structure and routing.

Implement next-pwa and manifest files for installability.

Build basic UI components (Buttons, Selectors for Key/Scale/Tempo).

### Phase 2: Music Theory & Visualizations
Develop the music-theory utility to map Scales and Keys to exact frequencies and standard guitar tuning (E A D G B E).

Implement the Fretboard.tsx component (SVG-based is highly recommended for crisp scaling and easy styling of specific frets/strings).

Integrate VexFlow into TabViewer.tsx to render static sheet music and tablature based on the selected scale.

### Phase 3: Audio Engine & Pitch Detection
Create useAudioContext to handle browser permissions and initialize the audio graph.

Integrate PitchFinder.

Build a debug view to ensure the microphone accurately detects individual strings and handles the natural decay/harmonics of a guitar.

### Phase 4: Synchronization & "The Game Loop"
Implement the lookahead scheduler for the metronome.

Animate the VexFlow canvas (or move an overlay) in sync with the tempo.

Connect the Pitch Detection output to the active note logic.

Implement the "Hit" (green), "Miss" (red), and "Missed Timing" logic.

### Phase 5: Polish & Deployment
Optimize performance: Ensure React state updates from the audio loop are debounced or handled via refs to prevent jank.

Finalize responsive design, ensuring the practice view scales perfectly on mobile landscape.

Implement offline caching via Service Workers.

Deploy via Vercel.

## 6. Code Best Practices & Maintainability
Decouple Audio from UI: The audio processing loop and the UI rendering loop should run independently. Communicate between them using lightweight Zustand stores or direct ref mutations to avoid React re-render cycles blocking the main thread.

Web Workers: If PitchFinder algorithms cause frame drops on lower-end mobile devices, move the AnalyserNode array processing into a Web Worker.

Strict Typing for Music Objects: Clearly define interfaces for Note (e.g., { pitch: 'C4', string: 5, fret: 3, frequency: 261.63 }). This prevents silent bugs when passing data between the VexFlow renderer, the audio detector, and the UI.

Browser Autoplay Policies: Browsers block AudioContext until user interaction. Ensure the application initializes audio nodes only after the user clicks a explicit "Start Practice" or "Enable Microphone" button.