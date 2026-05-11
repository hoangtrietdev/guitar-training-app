export * from './music';

export interface AppSettings {
  theme: 'dark' | 'light';
  volume: number;
  countInBars: number;
}

export interface PracticeSession {
  key: import('./music').KeyName;
  scale: import('./music').ScaleType;
  tempo: number;
  isPlaying: boolean;
  currentNoteIndex: number;
  score: { hits: number; misses: number };
}
