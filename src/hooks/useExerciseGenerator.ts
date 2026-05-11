import { useEffect, useCallback } from 'react';
import { usePracticeStore } from '@/store/usePracticeStore';
import { generateSystematicExercise } from '@/lib/music-theory/scaleGenerator';
import type { KeyName, ScaleType, GuitarNote } from '@/types/music';

export function useExerciseGenerator() {
  const { key, scale, difficulty, setNotes, setLoadingExercise, setPhase } = usePracticeStore();

  const generate = useCallback(async (k: KeyName, s: ScaleType, d: number) => {
    setPhase('idle'); // Reset phase whenever we generate new exercise
    if (d <= 5) {
      // Levels 1-5: deterministic, no API call
      const notes = generateSystematicExercise(k, s, d);
      setNotes(notes);
    } else {
      // Levels 6-10: Groq AI
      setLoadingExercise(true);
      try {
        const res = await fetch('/api/generate-exercise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: k, scale: s, level: d }),
        });
        if (!res.ok) throw new Error(await res.text());
        const { notes } = await res.json() as { notes: GuitarNote[] };
        setNotes(notes);
      } catch (err) {
        console.error('AI exercise generation failed, falling back to systematic', err);
        const notes = generateSystematicExercise(k, s, Math.min(d - 1, 5));
        setNotes(notes);
      } finally {
        setLoadingExercise(false);
      }
    }
  }, [setNotes, setLoadingExercise]);

  // Auto-generate when key/scale/difficulty changes
  useEffect(() => {
    generate(key, scale, difficulty);
  }, [key, scale, difficulty, generate]);

  return { generate };
}
