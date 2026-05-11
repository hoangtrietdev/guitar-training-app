import { useEffect, useRef } from 'react';

let sharedContext: AudioContext | null = null;

/** Returns the singleton AudioContext. Creates it lazily on first call. */
export function getAudioContext(): AudioContext {
  if (!sharedContext || sharedContext.state === 'closed') {
    sharedContext = new AudioContext();
  }
  return sharedContext;
}

/**
 * Hook that provides the AudioContext and ensures it is resumed after
 * a user gesture (required by browser autoplay policies).
 */
export function useAudioContext() {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    ctxRef.current = getAudioContext();
    return () => {
      // Do NOT close the shared context on unmount — it is a singleton.
    };
  }, []);

  const resume = async () => {
    const ctx = ctxRef.current ?? getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    ctxRef.current = ctx;
    return ctx;
  };

  return { resume, ctxRef };
}
