import { useMemo } from 'react';
import { generateSystematicExercise, getScaleLabel } from '@/lib/music-theory/scaleGenerator';
import type { KeyName, ScaleType } from '@/types/music';

/** @deprecated Use useExerciseGenerator instead. Kept for compatibility. */
export function useScaleGenerator(key: KeyName, scaleType: ScaleType) {
  const notes = useMemo(() => generateSystematicExercise(key, scaleType, 1), [key, scaleType]);
  const label = useMemo(() => getScaleLabel(key, scaleType), [key, scaleType]);
  return { notes, label };
}
