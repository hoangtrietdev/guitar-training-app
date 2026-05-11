import { create } from 'zustand';
import type { KeyName, ScaleType, GuitarNote, NoteResult, NoteStatus } from '@/types/music';

export type Phase = 'idle' | 'count-in' | 'playing' | 'finished';

interface PracticeStore {
  key: KeyName;
  scale: ScaleType;
  tempo: number;
  difficulty: number;
  phase: Phase;
  countInBeat: number;
  currentNoteIndex: number;
  notes: GuitarNote[];
  results: NoteResult[];
  score: { hits: number; misses: number };
  liveDetectedHz: number;
  isLoadingExercise: boolean;
  playStartAudioTime: number | null;

  setKey: (k: KeyName) => void;
  setScale: (s: ScaleType) => void;
  setTempo: (t: number) => void;
  setDifficulty: (d: number) => void;
  setNotes: (n: GuitarNote[]) => void;
  setPhase: (p: Phase) => void;
  setCountInBeat: (b: number) => void;
  setCurrentNoteIndex: (i: number) => void;
  advanceNote: () => void;
  recordResult: (index: number, status: NoteStatus, freq?: number) => void;
  setLiveDetectedHz: (hz: number) => void;
  setLoadingExercise: (v: boolean) => void;
  setPlayStartAudioTime: (t: number | null) => void;
  reset: () => void;
}

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  key: 'C',
  scale: 'major',
  tempo: 80,
  difficulty: 1,
  phase: 'idle',
  countInBeat: 0,
  currentNoteIndex: 0,
  notes: [],
  results: [],
  score: { hits: 0, misses: 0 },
  liveDetectedHz: 0,
  isLoadingExercise: false,
  playStartAudioTime: null,

  setKey: (key) => set({ key }),
  setScale: (scale) => set({ scale }),
  setTempo: (tempo) => set({ tempo }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setNotes: (notes) =>
    set({ notes, results: notes.map((n) => ({ note: n, status: 'pending' as NoteStatus })) }),
  setPhase: (phase) => set({ phase }),
  setCountInBeat: (countInBeat) => set({ countInBeat }),
  setCurrentNoteIndex: (currentNoteIndex) => set({ currentNoteIndex }),

  advanceNote: () => {
    const { currentNoteIndex, notes } = get();
    const next = currentNoteIndex + 1;
    if (next >= notes.length) set({ phase: 'finished' });
    else set({ currentNoteIndex: next });
  },

  recordResult: (index, status, detectedFrequency) =>
    set((state) => {
      const results = [...state.results];
      if (results[index] && results[index].status !== 'hit') {
        results[index] = { ...results[index], status, detectedFrequency };
      }
      return {
        results,
        score: {
          hits: results.filter((r) => r.status === 'hit').length,
          misses: results.filter((r) => r.status === 'miss' || r.status === 'late').length,
        },
      };
    }),

  setLiveDetectedHz: (liveDetectedHz) => set({ liveDetectedHz }),
  setLoadingExercise: (isLoadingExercise) => set({ isLoadingExercise }),
  setPlayStartAudioTime: (playStartAudioTime) => set({ playStartAudioTime }),

  reset: () =>
    set((state) => ({
      phase: 'idle',
      countInBeat: 0,
      currentNoteIndex: 0,
      liveDetectedHz: 0,
      results: state.notes.map((n) => ({ note: n, status: 'pending' as NoteStatus })),
      score: { hits: 0, misses: 0 },
    })),
}));
