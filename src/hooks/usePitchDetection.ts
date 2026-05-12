import { useEffect, useRef, useCallback } from 'react';
import { getAudioContext } from './useAudioContext';
import { usePracticeStore } from '@/store/usePracticeStore';
import { isFrequencyMatch } from '@/utils/frequencyToNote';

/** Autocorrelation-based pitch detection (monophonic). Returns Hz or -1 on silence. */
function autocorrelatePitch(buffer: Float32Array, sampleRate: number): number {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.01) return -1; // Silence gate

  // Constrain search to typical guitar range (approx 65 Hz to 1200 Hz)
  const minFreq = 65;
  const maxFreq = 1200;
  const maxOffset = Math.ceil(sampleRate / minFreq);
  const minOffset = Math.floor(sampleRate / maxFreq);

  let c0 = 0;
  for (let i = 0; i < buffer.length; i++) {
    c0 += buffer[i] * buffer[i];
  }

  let isRising = false;
  let peaks: { offset: number; corr: number }[] = [];
  let prevCorr = -1;

  for (let offset = minOffset; offset <= maxOffset; offset++) {
    let corr = 0;
    const limit = buffer.length - offset;
    for (let i = 0; i < limit; i++) {
      corr += buffer[i] * buffer[i + offset];
    }
    const normalizedCorr = corr / c0;

    if (normalizedCorr > prevCorr) {
      isRising = true;
    } else if (isRising) {
      // Peak detected
      peaks.push({ offset: offset - 1, corr: prevCorr });
      isRising = false;
    }
    prevCorr = normalizedCorr;
  }

  if (peaks.length === 0) return -1;

  // Look for the *first* peak that crosses our confidence threshold
  // This avoids picking subharmonics which appear at multiple offsets
  const threshold = 0.85;
  let chosenPeak = peaks.find(p => p.corr > threshold);

  if (!chosenPeak) {
    let maxP = peaks[0];
    for (let i = 1; i < peaks.length; i++) {
      if (peaks[i].corr > maxP.corr) maxP = peaks[i];
    }
    if (maxP.corr < 0.5) return -1; // Signal is too noisy/inharmonic
    chosenPeak = maxP;
  }

  const T0 = chosenPeak.offset;
  
  // Parabolic interpolation for sub-sample accuracy
  if (T0 > minOffset && T0 < maxOffset) {
    const computeCorr = (off: number) => {
      let c = 0;
      for (let i = 0; i < buffer.length - off; i++) {
        c += buffer[i] * buffer[i + off];
      }
      return c / c0;
    };
    
    const x1 = computeCorr(T0 - 1);
    const x2 = chosenPeak.corr;
    const x3 = computeCorr(T0 + 1);

    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a !== 0) {
      const betterOffset = T0 - b / (2 * a);
      return sampleRate / betterOffset;
    }
  }

  return sampleRate / T0;
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
