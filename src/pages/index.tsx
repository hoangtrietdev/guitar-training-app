import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { usePracticeStore } from '@/store/usePracticeStore';
import { getScaleLabel, DIFFICULTY_META } from '@/lib/music-theory/scaleGenerator';
import { TempoGauge } from '@/components/common/TempoGauge';
import type { KeyName, ScaleType } from '@/types/music';
import { ChevronRight } from 'lucide-react';

const KEYS: KeyName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const SCALES: { value: ScaleType; label: string }[] = [
  { value: 'major',    label: 'Major' },
  { value: 'minor',    label: 'Minor' },
  { value: 'jazz',     label: 'Jazz' },
  { value: 'blues',    label: 'Blues' },
  { value: 'arpeggio', label: 'Arpeggio' },
];

export default function Home() {
  const router = useRouter();
  const { key, scale, tempo, difficulty, setKey, setScale, setTempo, setDifficulty } = usePracticeStore();
  const meta = DIFFICULTY_META[difficulty];

  return (
    <>
      <Head>
        <title>GuitarTrainer — Scale & Arpeggio Practice</title>
        <meta name="description" content="Real-time pitch detection guitar training with AI-generated exercises." />
        <meta name="theme-color" content="#000000" />
      </Head>

      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-10">
        {/* App icon + title */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/logo.png"
            alt="GuitarTrainer Logo"
            width={64}
            height={64}
            className="rounded-[22px] shadow-xl shadow-blue-900/40"
            priority
          />
          <div className="text-center">
            <h1 className="text-[28px] font-bold text-white tracking-tight">GuitarTrainer</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Real-time pitch feedback · AI exercises</p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3">

          {/* KEY */}
          <div className="rounded-2xl bg-[#1C1C1E] overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Key</p>
            </div>
            <div className="flex gap-1.5 p-3">
              {KEYS.map(k => (
                <button
                  key={k}
                  onClick={() => setKey(k)}
                  className={`flex-1 py-2 rounded-xl text-[15px] font-semibold transition-all ${
                    k === key
                      ? 'bg-[#0A84FF] text-white shadow-md shadow-blue-900/40'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* SCALE — pill buttons in a row (same style as KEY) */}
          <div className="rounded-2xl bg-[#1C1C1E] overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Scale / Pattern</p>
            </div>
            <div className="flex gap-1.5 p-3">
              {SCALES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setScale(s.value)}
                  className={`flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                    s.value === scale
                      ? 'bg-[#0A84FF] text-white shadow-md shadow-blue-900/40'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* TEMPO — Speedometer gauge */}
          <div className="rounded-2xl bg-[#1C1C1E] overflow-hidden">
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Tempo</p>
              <p className="text-[11px] text-gray-500">Drag the needle · 80 – 240 BPM</p>
            </div>
            <div className="px-4 pb-4">
              <TempoGauge value={tempo} onChange={setTempo} />
            </div>
          </div>

          {/* DIFFICULTY */}
          <div className="rounded-2xl bg-[#1C1C1E] overflow-hidden">
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Difficulty</p>
              <span className="text-[11px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
            </div>
            <div className="px-4 pt-2 pb-4 space-y-2">
              <input
                type="range"
                min={1} max={10} step={1}
                value={difficulty}
                onChange={e => setDifficulty(Number(e.target.value))}
                className="difficulty-slider w-full"
                aria-label="Difficulty level"
              />
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>1 Novice</span><span>5 Mid</span><span>10 Master</span>
              </div>
              <p className="text-[12px] text-gray-400">{meta.description}</p>
              {difficulty >= 6 && (
                <p className="text-[11px] text-[#FF9F0A] flex items-center gap-1">
                  <span>✨</span> AI-generated via Llama 3.3
                </p>
              )}
            </div>
          </div>

          {/* Start */}
          <button
            id="btn-start-practice"
            onClick={() => router.push(`/practice/${key}/${scale}`)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0A84FF] py-4 text-[17px] font-semibold text-white shadow-lg shadow-blue-900/30 hover:bg-[#0070E0] active:scale-[0.98] transition-all"
          >
            Start Practice <ChevronRight className="h-5 w-5" />
          </button>

          <p className="text-center text-[11px] text-gray-600">
            Standard E Tuning · Frets 1–12 · Microphone required
          </p>
        </div>
      </div>
    </>
  );
}
