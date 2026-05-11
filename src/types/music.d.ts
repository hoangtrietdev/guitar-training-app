export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type KeyName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type ScaleType = 'major' | 'minor' | 'jazz' | 'blues' | 'arpeggio';

export interface GuitarNote {
  /** e.g. "C4" */
  pitch: string;
  noteName: NoteName;
  octave: number;
  /** 0 = low E, 5 = high E */
  string: number;
  fret: number;
  /** Frequency in Hz */
  frequency: number;
  /** Beat index within bar */
  beat: number;
  /** Duration in beats (1 = quarter note) */
  duration: number;
}

export interface Scale {
  key: KeyName;
  type: ScaleType;
  notes: GuitarNote[];
  label: string;
}

export type NoteStatus = 'pending' | 'active' | 'hit' | 'miss' | 'late';

export interface NoteResult {
  note: GuitarNote;
  status: NoteStatus;
  detectedFrequency?: number;
}
