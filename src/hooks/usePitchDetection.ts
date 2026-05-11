import { useEffect, useRef, useCallback } from 'react';
import { getAudioContext } from './useAudioContext';
import { usePracticeStore } from '@/store/usePracticeStore';
import { isFrequencyMatch } from '@/utils/frequencyToNote';

/** Autocorrelation-based pitch detection (monophonic). Returns Hz or -1 on silence. */
function autocorrelatePitch(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  const HALF = Math.floor(SIZE / 2);

  // RMS silence gate
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  // Normalized difference function (simplified YIN)
  let bestOffset = -1;
  let bestCorr = 0;
  let prevCorr = 1;

  for (let offset = 2; offset < HALF; offset++) {
    let corr = 0;
    for (let i = 0; i < HALF; i++) {
      corr += Math.abs((buffer[i]) - (buffer[i + offset]));
    }
    corr = 1 - corr / HALF;

    if (corr > 0.9 && corr > prevCorr) {
      bestCorr = corr;
      bestOffset = offset;
    }
    prevCorr = corr;
  }

  if (bestCorr > 0.01 && bestOffset > 0) {
    // Parabolic interpolation for sub-sample accuracy
    const x0 = bestOffset > 1 ? bestOffset - 1 : bestOffset;
    const x2 = bestOffset + 1 < HALF ? bestOffset + 1 : bestOffset;
    const y0 = 1 - ((() => { let c = 0; for (let i = 0; i < HALF; i++) c += Math.abs(buffer[i] - buffer[i + x0]); return c / HALF; })());
    const y1 = bestCorr;
    const y2 = 1 - ((() => { let c = 0; for (let i = 0; i < HALF; i++) c += Math.abs(buffer[i] - buffer[i + x2]); return c / HALF; })());
    const betterOffset = x0 + (y2 - y0) / (2 * (2 * y1 - y2 - y0));
    return sampleRate / betterOffset;
  }
  return -1;
}

export function usePitchDetection() {
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  // Refs always point to latest store values — no stale closures
  const storeRef = useRef(usePracticeStore.getState());
  useEffect(() => {
    const unsub = usePracticeStore.subscribe((s) => { storeRef.current = s; });
    return unsub;
  }, []);

  const start = useCallback(async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: false,
    });

    const source = ctx.createMediaStreamSource(streamRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 4096;        // Larger for lower-frequency accuracy (low E = 82 Hz)
    analyser.smoothingTimeConstant = 0;
    source.connect(analyser);
    analyserRef.current = analyser;
    sourceRef.current = source;

    const buffer = new Float32Array(analyser.fftSize);
    isRunningRef.current = true;

    const loop = () => {
      if (!isRunningRef.current || !analyserRef.current) return;

      analyserRef.current.getFloatTimeDomainData(buffer);
      const freq = autocorrelatePitch(buffer, ctx.sampleRate);

      // Always broadcast live Hz for debug panel (even in non-playing phases)
      usePracticeStore.getState().setLiveDetectedHz(freq > 0 ? freq : 0);

      const { phase, currentNoteIndex, notes, recordResult } = storeRef.current;

      if (freq > 0 && phase === 'playing') {
        const expected = notes[currentNoteIndex];
        if (expected) {
          const hit = isFrequencyMatch(freq, expected.frequency);
          recordResult(currentNoteIndex, hit ? 'hit' : 'miss', freq);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  return { start, stop };
}
