import { useEffect, useRef, useCallback } from 'react';
import { getAudioContext } from './useAudioContext';
import { usePracticeStore } from '@/store/usePracticeStore';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const COUNT_IN_BEATS = 4;

// Master gain node — we mute it instantly on stop
let masterGain: GainNode | null = null;

function getMasterGain(): GainNode {
  const ctx = getAudioContext();
  if (!masterGain || masterGain.context !== ctx) {
    masterGain = ctx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

export function useMetronome() {
  const store = usePracticeStore();

  const tempoRef = useRef(store.tempo);
  const notesLenRef = useRef(store.notes.length);
  tempoRef.current = store.tempo;
  notesLenRef.current = store.notes.length;

  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatRef = useRef(0);
  const skipCountInRef = useRef(false); // true when looping (no count-in)

  const scheduleClick = useCallback((time: number, accent: boolean) => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(getMasterGain()); // route through master
    osc.frequency.value = accent ? 1200 : 880;
    gain.gain.setValueAtTime(accent ? 0.4 : 0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    osc.start(time);
    osc.stop(time + 0.06);
  }, []);

  const getSpb = () => 60 / tempoRef.current;

  const scheduler = useCallback(() => {
    const ctx = getAudioContext();

    while (nextBeatTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
      const time = nextBeatTimeRef.current;
      const beat = beatRef.current;
      const spb = getSpb();
      const skipCountIn = skipCountInRef.current;

      // How many "offset" beats before notes start
      const offset = skipCountIn ? 0 : COUNT_IN_BEATS;

      if (!skipCountIn && beat < COUNT_IN_BEATS) {
        // ── Count-in ──
        scheduleClick(time, beat === 0);
        const msDelay = Math.max(0, (time - ctx.currentTime) * 1000);
        const b = beat;
        setTimeout(() => usePracticeStore.getState().setCountInBeat(b), msDelay);

        if (beat === COUNT_IN_BEATS - 1) {
          const transitionTime = time + spb;
          const delay = Math.max(0, (transitionTime - ctx.currentTime) * 1000);
          const tt = transitionTime;
          setTimeout(() => {
            usePracticeStore.getState().setPhase('playing');
            usePracticeStore.getState().setCurrentNoteIndex(0);
            usePracticeStore.getState().setPlayStartAudioTime(tt);
          }, delay - 10);
        }
      } else {
        // ── Playing ──
        const noteIdx = beat - offset;
        const nLen = notesLenRef.current;

        if (noteIdx < nLen) {
          scheduleClick(time, noteIdx === 0);
          const msDelay = Math.max(0, (time - ctx.currentTime) * 1000);
          const idx = noteIdx;

          // Set playing phase immediately on first note when skipCountIn
          if (noteIdx === 0 && skipCountIn) {
            setTimeout(() => {
              usePracticeStore.getState().setPhase('playing');
              usePracticeStore.getState().setCurrentNoteIndex(0);
              usePracticeStore.getState().setPlayStartAudioTime(time);
            }, msDelay - 10);
          } else {
            setTimeout(() => {
              if (usePracticeStore.getState().phase === 'playing') {
                usePracticeStore.getState().setCurrentNoteIndex(idx);
              }
            }, msDelay);
          }

          if (noteIdx === nLen - 1) {
            const finishDelay = Math.max(0, (time + spb - ctx.currentTime) * 1000);
            setTimeout(() => usePracticeStore.getState().setPhase('finished'), finishDelay);
          }
        }
      }

      nextBeatTimeRef.current += getSpb();
      beatRef.current++;
    }
  }, [scheduleClick]);

  /** Start with 4-beat count-in */
  const start = useCallback(async (skipCountIn = false) => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    // Unmute master gain (in case it was muted by stop)
    getMasterGain().gain.cancelScheduledValues(ctx.currentTime);
    getMasterGain().gain.setValueAtTime(1, ctx.currentTime);

    skipCountInRef.current = skipCountIn;
    beatRef.current = 0;
    nextBeatTimeRef.current = ctx.currentTime + 0.05;

    if (skipCountIn) {
      usePracticeStore.getState().setCurrentNoteIndex(0);
      // phase will be set to 'playing' when first note fires
    } else {
      usePracticeStore.getState().setPhase('count-in');
      usePracticeStore.getState().setCurrentNoteIndex(0);
    }

    schedulerRef.current = setInterval(scheduler, LOOKAHEAD_MS);
  }, [scheduler]);

  /** Stop immediately — mute audio AND clear scheduler */
  const stop = useCallback(() => {
    // 1. Clear the scheduler interval first
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    // 2. Mute master gain instantly to silence any already-scheduled notes
    const ctx = getAudioContext();
    const mg = getMasterGain();
    mg.gain.cancelScheduledValues(ctx.currentTime);
    mg.gain.setValueAtTime(0, ctx.currentTime);

    usePracticeStore.getState().setPhase('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (schedulerRef.current) clearInterval(schedulerRef.current);
    };
  }, []);

  return { start, stop };
}
