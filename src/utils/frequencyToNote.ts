import type { NoteName } from '@/types/music';

const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Convert a frequency in Hz to a MIDI note number (A4 = 69 = 440 Hz) */
export function frequencyToMidi(frequency: number): number {
  return Math.round(12 * Math.log2(frequency / 440) + 69);
}

/** Convert a MIDI note number to note name + octave */
export function midiToNoteParts(midi: number): { noteName: NoteName; octave: number; pitch: string } {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];
  return { noteName, octave, pitch: `${noteName}${octave}` };
}

/** Convert a frequency in Hz to pitch string like "A4" */
export function frequencyToPitch(frequency: number): string {
  if (frequency <= 0) return '';
  const midi = frequencyToMidi(frequency);
  const { pitch } = midiToNoteParts(midi);
  return pitch;
}

/** How many semitones apart are two MIDI notes */
export function semitoneDifference(midiA: number, midiB: number): number {
  return Math.abs(midiA - midiB);
}

/** Tolerance: within 1 semitone (±50 cents) counts as a hit */
export function isFrequencyMatch(detected: number, expected: number, toleranceSemitones = 1): boolean {
  if (detected <= 0 || expected <= 0) return false;
  const detectedMidi = frequencyToMidi(detected);
  const expectedMidi = frequencyToMidi(expected);
  return semitoneDifference(detectedMidi, expectedMidi) <= toleranceSemitones;
}
