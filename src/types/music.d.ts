export type NoteName = 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B';
export type KeyName =
  | 'C' | 'C#' | 'Db'
  | 'D' | 'D#' | 'Eb'
  | 'E'
  | 'F' | 'F#'
  | 'Gb' | 'G' | 'G#'
  | 'Ab' | 'A' | 'A#'
  | 'Bb' | 'B';
export type ScaleType =
  | 'major'
  | 'minor'
  | 'jazz'
  | 'blues'
  | 'arpeggio'
  | 'arpeggio-dim'
  | 'arpeggio-aug'
  | 'arpeggio-sus2'
  | 'arpeggio-sus4'
  | 'arpeggio-maj7'
  | 'arpeggio-maj9'
  | 'arpeggio-m7'
  | 'arpeggio-m9'
  | 'arpeggio-dom7'
  | 'arpeggio-dom9';

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
