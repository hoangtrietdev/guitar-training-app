import type { KeyName, ScaleType, GuitarNote, NoteName } from '@/types/music';

const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4
const NOTE_NAMES_SHARP: NoteName[] = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTE_NAMES_FLAT: NoteName[] = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  major:          [0,2,4,5,7,9,11],
  minor:          [0,2,3,5,7,8,10],
  jazz:           [0,2,3,5,7,9,10],
  blues:          [0,3,5,6,7,10],
  arpeggio:       [0,4,7],       // major triad
  'arpeggio-dim': [0,3,6],       // diminished triad
  'arpeggio-aug': [0,4,8],       // augmented triad
  'arpeggio-sus2':[0,2,7],       // suspended 2nd
  'arpeggio-sus4':[0,5,7],       // suspended 4th
  'arpeggio-maj7':[0,4,7,11],    // major 7th
  'arpeggio-maj9':[0,4,7,11,14], // major 9th
  'arpeggio-m7':  [0,3,7,10],    // minor 7th
  'arpeggio-m9':  [0,3,7,10,14], // minor 9th
  'arpeggio-dom7':[0,4,7,10],    // dominant 7th
  'arpeggio-dom9':[0,4,7,10,14], // dominant 9th
};

// Root MIDI starting at octave 2 so we cover frets 1-12 naturally
const KEY_TO_ROOT_MIDI: Record<KeyName, number> = {
  C:48, 'C#':49, Db:49,
  D:50, 'D#':51, Eb:51,
  E:52,
  F:53, 'F#':54,
  Gb:54, G:55, 'G#':56,
  Ab:56, A:57, 'A#':58,
  Bb:58, B:59,
};

export function midiToFrequency(midi: number) { return 440*Math.pow(2,(midi-69)/12); }

function midiToNoteParts(midi: number, isFlat: boolean): { noteName: NoteName; octave: number } {
  const names = isFlat ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  return { noteName: names[((midi%12)+12)%12], octave: Math.floor(midi/12)-1 };
}

function noteToMidi(n: GuitarNote) {
  return OPEN_STRING_MIDI[n.string] + n.fret;
}

/** All valid positions of scale notes across frets 1-12 on all 6 strings */
export function getAllScalePositions(key: KeyName, type: ScaleType): GuitarNote[] {
  const root = KEY_TO_ROOT_MIDI[key];
  const intervals = SCALE_INTERVALS[type];
  const positions: GuitarNote[] = [];
  const isFlat = key.includes('b') || key === 'F';

  for (let oct = 0; oct <= 2; oct++) {
    for (const iv of intervals) {
      const midi = root + oct * 12 + iv;
      for (let s = 0; s < 6; s++) {
        const fret = midi - OPEN_STRING_MIDI[s];
        if (fret >= 1 && fret <= 12) {
          const { noteName, octave } = midiToNoteParts(midi, isFlat);
          positions.push({ pitch:`${noteName}${octave}`, noteName, octave, string:s, fret, frequency:midiToFrequency(midi), beat:0, duration:1 });
        }
      }
    }
  }
  return positions;
}

/** Deduplicate by MIDI note, returning sorted unique MIDI values */
function uniqueMidisSorted(positions: GuitarNote[]) {
  return [...new Set(positions.map(noteToMidi))].sort((a,b)=>a-b);
}

/** For a given MIDI, pick preferred position based on previous string (smooth voice leading) */
function pickPosition(midi: number, positions: GuitarNote[], prevString: number, bassFirst: boolean): GuitarNote {
  const opts = positions.filter(p => noteToMidi(p) === midi);
  if (!opts.length) throw new Error(`No position for midi ${midi}`);

  return opts.sort((a,b) => {
    // Prefer bass strings when bassFirst
    if (bassFirst) return a.string - b.string || a.fret - b.fret;
    // Otherwise smooth voice leading: minimize string jump
    return Math.abs(a.string - prevString) - Math.abs(b.string - prevString) || a.fret - b.fret;
  })[0];
}

/**
 * Generate a systematic exercise for difficulty levels 1-5.
 * Covers frets 1-12 by using multiple octaves.
 * Bass strings first for all levels.
 */
export function generateSystematicExercise(key: KeyName, type: ScaleType, level: number): GuitarNote[] {
  const all = getAllScalePositions(key, type);
  const midis = uniqueMidisSorted(all);

  // How many notes & pattern per level
  const configs: Array<{ count: number; pattern: 'asc' | 'asc-desc' | 'asc-skip' | 'pairs' | 'zigzag' }> = [
    { count: 8,  pattern: 'asc' },        // L1: simple ascending
    { count: 12, pattern: 'asc' },        // L2: more notes ascending
    { count: 16, pattern: 'asc-desc' },   // L3: up then down
    { count: 20, pattern: 'asc-skip' },   // L4: skip a note pattern
    { count: 24, pattern: 'zigzag' },     // L5: zigzag full neck
  ];

  const { count, pattern } = configs[Math.min(level, 5) - 1];

  let sequence: number[] = [];

  if (pattern === 'asc') {
    sequence = midis.slice(0, count);
  } else if (pattern === 'asc-desc') {
    const half = Math.ceil(count / 2);
    const up = midis.slice(0, half);
    const down = [...midis.slice(0, half)].reverse().slice(1);
    sequence = [...up, ...down].slice(0, count);
  } else if (pattern === 'asc-skip') {
    // Play note[i] then note[i+2] for a sequence of thirds
    const base: number[] = [];
    for (let i = 0; i < midis.length && base.length < count; i++) {
      base.push(midis[i]);
      if (i + 2 < midis.length) base.push(midis[i + 2]);
    }
    sequence = base.slice(0, count);
  } else if (pattern === 'zigzag') {
    // Up two, down one pattern
    const base: number[] = [];
    let i = 0;
    while (base.length < count && i < midis.length) {
      base.push(midis[i]);
      if (i + 1 < midis.length) base.push(midis[i + 1]);
      if (i > 0) base.push(midis[i - 1]);
      i += 2;
    }
    sequence = base.slice(0, count);
  } else {
    sequence = midis.slice(0, count);
  }

  // Build GuitarNote array with position picking
  let prevString = 0;
  return sequence.map((midi, beat) => {
    const note = pickPosition(midi, all, prevString, level <= 2);
    prevString = note.string;
    return { ...note, beat, duration: 1 };
  });
}

export function getScaleLabel(key: KeyName, type: ScaleType): string {
  const labels: Record<ScaleType, string> = {
    major:          'Major',
    minor:          'Minor',
    jazz:           'Jazz (Dorian)',
    blues:          'Blues',
    arpeggio:       'Arpeggio (Major)',
    'arpeggio-dim': 'Arpeggio (Dim)',
    'arpeggio-aug': 'Arpeggio (Aug)',
    'arpeggio-sus2':'Arpeggio (Sus2)',
    'arpeggio-sus4':'Arpeggio (Sus4)',
    'arpeggio-maj7':'Arpeggio (Maj7)',
    'arpeggio-maj9':'Arpeggio (Maj9)',
    'arpeggio-m7':  'Arpeggio (m7)',
    'arpeggio-m9':  'Arpeggio (m9)',
    'arpeggio-dom7':'Arpeggio (Dom7)',
    'arpeggio-dom9':'Arpeggio (Dom9)',
  };
  return `${key} ${labels[type]}`;
}

export const DIFFICULTY_META: Record<number, { label: string; description: string; color: string }> = {
  1:  { label:'Novice 1',       description:'8-note ascending scale, bass strings',      color:'#30D158' },
  2:  { label:'Novice 2',       description:'12 notes ascending, full strings',           color:'#30D158' },
  3:  { label:'Beginner 3',     description:'16 notes up & down',                         color:'#34C759' },
  4:  { label:'Beginner 4',     description:'20 notes with thirds skips',                 color:'#FFD60A' },
  5:  { label:'Intermediate 5', description:'24 notes zigzag full neck',                  color:'#FFD60A' },
  6:  { label:'Intermediate 6', description:'AI exercise — position shifts',              color:'#FF9F0A' },
  7:  { label:'Advanced 7',     description:'AI exercise — string crossings',             color:'#FF9F0A' },
  8:  { label:'Advanced 8',     description:'AI exercise — musical phrases',              color:'#FF453A' },
  9:  { label:'Expert 9',       description:'AI exercise — complex licks',                color:'#FF453A' },
  10: { label:'Master 10',      description:'AI exercise — full solo-style run',          color:'#BF5AF2' },
};
