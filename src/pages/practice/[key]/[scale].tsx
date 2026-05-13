import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { usePracticeStore } from '@/store/usePracticeStore';
import { useExerciseGenerator } from '@/hooks/useExerciseGenerator';
import { useMetronome } from '@/hooks/useMetronome';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { getScaleLabel, DIFFICULTY_META } from '@/lib/music-theory/scaleGenerator';
import { Fretboard } from '@/components/music/Fretboard';
import { TabViewer } from '@/components/music/TabViewer';
import { SheetViewer } from '@/components/music/SheetViewer';
import { Metronome } from '@/components/music/Metronome';
import { PitchDebugPanel } from '@/components/music/PitchDebugPanel';
import { MicPermissionModal } from '@/components/setup/MicPermissionModal';
import type { KeyName, ScaleType } from '@/types/music';
import { ArrowLeft, Play, Square, RotateCcw, Mic, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/utils/classnames';

export default function PracticePage() {
  const router = useRouter();
  const { key: rKey, scale: rScale } = router.query as { key?: string; scale?: string };

  const {
    key, scale, tempo, difficulty,
    phase, countInBeat, currentNoteIndex,
    notes, results, score,
    isLoadingExercise, playStartAudioTime,
    setKey, setScale, reset,
  } = usePracticeStore();

  const { start: startMetronome, stop: stopMetronome } = useMetronome();
  const { start: startPitch, stop: stopPitch } = usePitchDetection();
  useExerciseGenerator();

  const [micGranted, setMicGranted] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [showMicModal, setShowMicModal] = useState(false);
  const [looping, setLooping] = useState(true);
  const [countInDisplay, setCountInDisplay] = useState<number | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [showLandscapePrompt, setShowLandscapePrompt] = useState(false);
  const [renderScale, setRenderScale] = useState(1);
  const [mobileView, setMobileView] = useState<'sheet' | 'tablature' | 'fretboard'>('sheet');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateScale = () => {
        const h = window.innerHeight;
        const w = window.innerWidth;
        if (h < 450) setRenderScale(0.65);
        else if (w < 768) setRenderScale(0.8);
        else setRenderScale(1);
      };
      
      updateScale();
      window.addEventListener('resize', updateScale);
      
      const isMob = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobile(isMob);
      if (isMob) {
        setShowLandscapePrompt(true);
      }
      
      return () => window.removeEventListener('resize', updateScale);
    }
  }, []);


  // Sync route params
  useEffect(() => {
    if (rKey) setKey(decodeURIComponent(rKey) as KeyName);
    if (rScale) setScale(rScale as ScaleType);
  }, [rKey, rScale, setKey, setScale]);

  // Count-in pop
  useEffect(() => {
    if (phase === 'count-in') {
      setCountInDisplay(countInBeat + 1);
      const t = setTimeout(() => setCountInDisplay(null), 400);
      return () => clearTimeout(t);
    }
    setCountInDisplay(null);
  }, [phase, countInBeat]);

  // ── Loop: when 'finished', restart automatically if looping ──
  const loopingRef = useRef(looping);
  const micGrantedRef = useRef(micGranted);
  
  useEffect(() => {
    loopingRef.current = looping;
    micGrantedRef.current = micGranted;
  }, [looping, micGranted]);

  useEffect(() => {
    if (phase === 'finished' && loopingRef.current && notes.length > 0 && !isLoadingExercise) {
      const t = setTimeout(async () => {
        reset();
        await startMetronome(true);
      }, 400); // brief pause between loops
      return () => clearTimeout(t);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = async () => {
    reset();
    await startMetronome(false); // don't skip count-in on manual start
  };

  const handleStop = () => { 
    stopMetronome(); 
    reset();
    setLooping(false);
  };
  const handleReset = () => { handleStop(); };

  const toggleMic = async () => {
    if (!micGranted) {
      setShowMicModal(true);
      return;
    }
    if (micActive) {
      setMicActive(false);
      stopPitch();
    } else {
      setMicActive(true);
      await startPitch();
    }
  };

  const isIdle = phase === 'idle' || phase === 'finished';
  const label = getScaleLabel(key, scale);
  const meta = DIFFICULTY_META[difficulty];
  const accuracy = score.hits + score.misses > 0
    ? Math.round((score.hits / (score.hits + score.misses)) * 100) : null;

  return (
    <>
      <Head>
        <title>{`${label} — GuitarTrainer`}</title>
        <meta name="description" content={`Practice ${label} scale with real-time pitch detection.`} />
      </Head>

      <MicPermissionModal
        open={showMicModal}
        onClose={() => setShowMicModal(false)}
        onGranted={async () => {
          setMicGranted(true);
          setMicActive(true);
          setShowMicModal(false);
          await startPitch();
        }}
      />

      {/* Count-in overlay */}
      {countInDisplay !== null && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center" aria-live="polite">
          <span key={countInDisplay} className="count-pop select-none text-[9rem] font-black text-[#FF9F0A] drop-shadow-[0_0_60px_rgba(255,159,10,0.8)]">
            {countInDisplay}
          </span>
        </div>
      )}

      {/* Landscape Prompt for Mobile */}
      {showLandscapePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#1C1C1E] border border-white/[0.1] p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-[18px] font-bold text-white mb-2">Rotate your device</h2>
            <p className="text-[13px] text-gray-400 mb-6">
              For the best practice experience, please use <strong>Landscape</strong> mode. We have optimized the interface to focus entirely on the Sheet & Tablature on mobile screens.
            </p>
            <button
              onClick={() => setShowLandscapePrompt(false)}
              className="w-full bg-[#0A84FF] text-white py-3 rounded-2xl font-semibold text-[15px] active:scale-[0.98] transition-transform"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── Full-screen shell ─────────────────────────── */}
      <div className="flex h-screen flex-col bg-black text-white overflow-hidden">

        {/* ── HEADER ───────────────────────────────────── */}
        <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#0A0A0A] px-4 py-2">
          <button onClick={() => router.push('/')} className="flex items-center gap-1 text-[#0A84FF] text-[14px] font-medium" aria-label="Back">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex-1 text-center">
            <p className="text-[15px] font-semibold leading-tight">{label}</p>
            <p className="text-[11px] leading-tight" style={{ color: meta.color }}>
              {phase === 'idle'     ? meta.label
                : phase === 'count-in' ? `Count In ${countInBeat + 1}/4`
                : phase === 'playing'  ? `● Playing${looping ? ' · Loop' : ''}`
                : '✓ Done — restarting…'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Score compact */}
            {(score.hits > 0 || score.misses > 0) && (
              <span className="hidden sm:flex items-center gap-2 text-[12px] font-mono bg-white/5 rounded-full px-3 py-1">
                <span className="text-[#30D158]">✓{score.hits}</span>
                <span className="text-[#FF453A]">✗{score.misses}</span>
                {accuracy !== null && <span className="text-gray-300 font-bold">{accuracy}%</span>}
              </span>
            )}

            <Metronome />

            <button
              onClick={toggleMic}
              className={cn('rounded-full p-1.5 transition-colors', micActive ? 'text-[#30D158]' : 'text-gray-500 hover:text-gray-300')}
              aria-label="Toggle microphone"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Debug bar */}
        {micActive && (
          <div className="shrink-0 px-3 py-1.5 bg-[#0A0A0A] border-b border-white/[0.06]">
            <PitchDebugPanel />
          </div>
        )}

        {/* AI loading bar */}
        {isLoadingExercise && (
          <div className="shrink-0 flex items-center gap-2 bg-[#1C1C1E] px-4 py-1.5 text-[12px] text-[#FF9F0A]">
            <span className="inline-block animate-spin">⟳</span>
            Generating AI exercise with Llama 3.3…
          </div>
        )}

        {/* ── MAIN — two full-width rows ──────────────── */}
        <main className="flex flex-col flex-1 overflow-y-auto min-h-0 custom-scrollbar pb-20 md:pb-0">

          {notes.length > 0 ? (
            <>
              {/* Mobile View Toggle */}
              {isMobile && (
                <div className="flex justify-center shrink-0 pt-3 pb-2 border-b border-white/[0.06]">
                  <div className="flex bg-[#1C1C1E] rounded-full p-1 border border-white/[0.05]">
                    <button 
                      onClick={() => setMobileView('sheet')} 
                      className={cn('px-5 py-1.5 text-[12px] font-semibold rounded-full transition-colors', mobileView === 'sheet' ? 'bg-[#0A84FF] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200')}
                    >
                      Sheet
                    </button>
                    <button 
                      onClick={() => setMobileView('tablature')} 
                      className={cn('px-5 py-1.5 text-[12px] font-semibold rounded-full transition-colors', mobileView === 'tablature' ? 'bg-[#0A84FF] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200')}
                    >
                      Tab
                    </button>
                    <button 
                      onClick={() => setMobileView('fretboard')} 
                      className={cn('px-5 py-1.5 text-[12px] font-semibold rounded-full transition-colors', mobileView === 'fretboard' ? 'bg-[#0A84FF] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200')}
                    >
                      Fretboard
                    </button>
                  </div>
                </div>
              )}

              {/* TOP ROW — Fretboard */}
              {(!isMobile || mobileView === 'fretboard') && (
                <section className={cn("flex flex-col w-full overflow-hidden px-3 pt-2 pb-1 shrink-0", isMobile ? "flex-none min-h-[250px]" : "flex-[2] min-h-[150px] border-b border-white/[0.06]")}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1 shrink-0">Fretboard</p>
                  <div className="flex-1 overflow-y-auto flex flex-col justify-center">
                    <Fretboard notes={notes} results={results} currentNoteIndex={currentNoteIndex} />
                  </div>
                </section>
              )}

              {/* BOTTOM ROW — Notation & Tablature (100% on mobile, 60% on desktop) */}
              {(!isMobile || mobileView === 'sheet' || mobileView === 'tablature') && (
                <section className="flex flex-col w-full flex-none md:flex-[3] md:min-h-[200px] shrink-0">
                <div className="shrink-0 flex items-center justify-between gap-2 px-3 pt-2 pb-2 border-b border-white/[0.06]">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                      {isMobile ? (mobileView === 'sheet' ? 'Sheet Music' : 'Tablature') : 'Sheet & Tablature'}
                    </p>
                    <span className="text-[10px] text-gray-700">— follow the amber playhead</span>
                  </div>
                  {looping && phase !== 'idle' && (
                    <span className="text-[10px] text-[#30D158] font-semibold">↺ Looping</span>
                  )}
                </div>

                <div className="w-full overflow-x-auto custom-scrollbar pb-6">
                  <div className="flex flex-col min-w-max pt-2 mx-auto origin-top" style={{ width: 'fit-content' }}>
                    {/* Notation wrapper */}
                    {(!isMobile || mobileView === 'sheet') && (
                      <div className={cn("shrink-0 flex items-center pb-2", !isMobile && "border-b border-white/[0.04]")}>
                        <SheetViewer
                          notes={notes}
                          results={results}
                          currentNoteIndex={currentNoteIndex}
                          scaleLabel={label}
                          renderScale={renderScale}
                        />
                      </div>
                    )}
                    {/* Tablature wrapper */}
                    {(!isMobile || mobileView === 'tablature') && (
                      <div className={cn("flex items-start px-3", isMobile ? "pt-2" : "pt-4")}>
                        <TabViewer
                          notes={notes}
                          results={results}
                          currentNoteIndex={currentNoteIndex}
                          scaleLabel={label}
                          tempo={tempo}
                          phase={phase}
                          playStartAudioTime={playStartAudioTime}
                          renderScale={renderScale}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 text-[14px] gap-3">
              {isLoadingExercise ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-[#0A84FF]" />
                  <p>Generating exercise…</p>
                </>
              ) : (
                <p>Configure a scale and press Start</p>
              )}
            </div>
          )}
        </main>

        {/* ── Controls bar ─────────────────────────── */}
        <div className="shrink-0 flex items-center justify-center gap-3 border-t border-white/[0.06] bg-[#0A0A0A] px-4 py-3">
          {isIdle && phase !== 'finished' ? (
            <>
              <button
                id="btn-play"
                onClick={handleStart}
                disabled={notes.length === 0 || isLoadingExercise}
                className="flex items-center gap-2 rounded-2xl bg-[#0A84FF] px-8 py-3 text-[16px] font-semibold text-white hover:bg-[#0070E0] active:scale-[0.97] transition-all disabled:opacity-40 shadow-lg shadow-blue-900/30"
              >
                <Play className="h-5 w-5 fill-current" />
                Start
              </button>
              <button
                onClick={() => setLooping(v => !v)}
                className={cn('flex items-center gap-2 rounded-2xl px-6 py-3 text-[16px] font-semibold transition-all',
                  looping 
                    ? 'bg-[#30D158]/20 text-[#30D158] hover:bg-[#30D158]/30' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                )}
                title={looping ? 'Loop is ON' : 'Loop is OFF'}
              >
                <RefreshCw className="h-5 w-5" />
                Loop
              </button>
            </>
          ) : phase !== 'finished' ? (
            <button
              id="btn-stop"
              onClick={handleStop}
              className="flex items-center gap-2 rounded-2xl bg-[#FF453A] px-8 py-3 text-[16px] font-semibold text-white hover:bg-[#e03d32] active:scale-[0.97] transition-all"
            >
              <Square className="h-5 w-5 fill-current" />
              Stop
            </button>
          ) : null}

          <button
            id="btn-reset"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl bg-white/5 px-4 py-2.5 text-[14px] text-gray-300 hover:bg-white/10 transition-all"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>
    </>
  );
}
