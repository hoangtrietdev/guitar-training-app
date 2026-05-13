import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { usePracticeStore } from '@/store/usePracticeStore';
import { getScaleLabel, DIFFICULTY_META } from '@/lib/music-theory/scaleGenerator';
import { TempoGauge } from '@/components/common/TempoGauge';
import type { KeyName, ScaleType } from '@/types/music';
import { ChevronRight } from 'lucide-react';

const NATURAL_KEYS: KeyName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const SHARP_OF: Partial<Record<KeyName, KeyName>> = {
  C: 'C#', D: 'D#', F: 'F#', G: 'G#', A: 'A#',
};
const FLAT_OF: Partial<Record<KeyName, KeyName>> = {
  D: 'Db', E: 'Eb', G: 'Gb', A: 'Ab', B: 'Bb',
};

function getNaturalBase(k: KeyName): KeyName {
  const map: Partial<Record<KeyName, KeyName>> = {
    'C#': 'C', Db: 'D', 'D#': 'D', Eb: 'E',
    'F#': 'F', Gb: 'G', 'G#': 'G', Ab: 'A', 'A#': 'A', Bb: 'B',
  };
  return map[k] ?? k;
}

function getAccidental(k: KeyName): 'natural' | 'sharp' | 'flat' {
  if ((['C#', 'D#', 'F#', 'G#', 'A#'] as KeyName[]).includes(k)) return 'sharp';
  if ((['Db', 'Eb', 'Gb', 'Ab', 'Bb'] as KeyName[]).includes(k)) return 'flat';
  return 'natural';
}

const SCALES: { value: ScaleType; label: string }[] = [
  { value: 'major',    label: 'Major' },
  { value: 'minor',    label: 'Minor' },
  { value: 'jazz',     label: 'Jazz' },
  { value: 'blues',    label: 'Blues' },
  { value: 'arpeggio', label: 'Arpeggio' },
];

const ARPEGGIO_QUALITIES: { value: ScaleType; label: string; symbol?: string }[] = [
  { value: 'arpeggio',       label: 'Major',     symbol: 'M' },
  { value: 'arpeggio-dim',   label: 'Dim',       symbol: '°' },
  { value: 'arpeggio-aug',   label: 'Aug',       symbol: '+' },
  { value: 'arpeggio-sus2',  label: 'Sus2',      symbol: 'sus2' },
  { value: 'arpeggio-sus4',  label: 'Sus4',      symbol: 'sus4' },
  { value: 'arpeggio-maj7',  label: 'Maj7',      symbol: 'Δ7' },
  { value: 'arpeggio-maj9',  label: 'Maj9',      symbol: 'Δ9' },
  { value: 'arpeggio-m7',    label: 'Minor 7',   symbol: 'm7' },
  { value: 'arpeggio-m9',    label: 'Minor 9',   symbol: 'm9' },
  { value: 'arpeggio-dom7',  label: 'Dom 7',     symbol: '7' },
  { value: 'arpeggio-dom9',  label: 'Dom 9',     symbol: '9' },
];

export default function Home() {
  const router = useRouter();
  const { key, scale, tempo, difficulty, setKey, setScale, setTempo, setDifficulty } = usePracticeStore();
  const meta = DIFFICULTY_META[difficulty];

  const naturalBase = getNaturalBase(key);
  const accidental = getAccidental(key);

  const handleKeyClick = (nat: KeyName) => {
    if (accidental === 'sharp') setKey(SHARP_OF[nat] ?? nat);
    else if (accidental === 'flat') setKey(FLAT_OF[nat] ?? nat);
    else setKey(nat);
  };

  const handleAccidentalChange = (acc: 'natural' | 'sharp' | 'flat') => {
    if (acc === 'sharp') setKey(SHARP_OF[naturalBase] ?? naturalBase);
    else if (acc === 'flat') setKey(FLAT_OF[naturalBase] ?? naturalBase);
    else setKey(naturalBase);
  };

  const sharpKey = SHARP_OF[naturalBase];
  const flatKey  = FLAT_OF[naturalBase];

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
            <div className="flex gap-1.5 px-3 pt-3 pb-2">
              {NATURAL_KEYS.map(k => (
                <button
                  key={k}
                  onClick={() => handleKeyClick(k)}
                  className={`flex-1 py-2 rounded-xl text-[15px] font-semibold transition-all ${
                    k === naturalBase
                      ? 'bg-[#0A84FF] text-white shadow-md shadow-blue-900/40'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            
            {/* Accidental selection */}
            <div className="flex gap-1.5 px-3 pb-3">
              <button
                onClick={() => handleAccidentalChange('natural')}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  accidental === 'natural'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                ♮ Natural
              </button>
              <button
                disabled={!sharpKey}
                onClick={() => handleAccidentalChange('sharp')}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  accidental === 'sharp'
                    ? 'bg-[#FF9F0A] text-white shadow-sm shadow-orange-900/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                ♯ Sharp
              </button>
              <button
                disabled={!flatKey}
                onClick={() => handleAccidentalChange('flat')}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  accidental === 'flat'
                    ? 'bg-[#30D158] text-white shadow-sm shadow-green-900/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                ♭ Flat
              </button>
            </div>
          </div>

          {/* SCALE — pill buttons */}
          <div className="rounded-2xl bg-[#1C1C1E] overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Scale / Pattern</p>
            </div>
            <div className="flex gap-1.5 p-3">
              {SCALES.map(s => {
                const isArpBase = s.value === 'arpeggio';
                const isArpActive = isArpBase && scale.startsWith('arpeggio');
                return (
                  <button
                    key={s.value}
                    onClick={() => setScale(s.value)}
                    className={`flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                      (isArpActive || s.value === scale)
                        ? 'bg-[#0A84FF] text-white shadow-md shadow-blue-900/40'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            <div className="px-3 pb-3">
              <select
                id="arpeggio-quality-select"
                value={scale.startsWith('arpeggio') ? scale : 'arpeggio'}
                disabled={!scale.startsWith('arpeggio')}
                onChange={e => setScale(e.target.value as ScaleType)}
                className="w-full rounded-xl bg-white/5 text-white text-[13px] font-medium px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Chord quality"
              >
                {ARPEGGIO_QUALITIES.map(q => (
                  <option key={q.value} value={q.value} className="bg-[#1C1C1E] text-white">
                    {q.symbol ? `${q.symbol} — ${q.label}` : q.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 mt-2 text-center">
                Select "Arpeggio" above to enable chord quality options.
              </p>
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
            onClick={() => router.push(`/practice/${encodeURIComponent(key)}/${scale}`)}
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
