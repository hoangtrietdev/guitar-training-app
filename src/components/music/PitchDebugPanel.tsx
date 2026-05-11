import { usePracticeStore } from '@/store/usePracticeStore';
import { frequencyToPitch } from '@/utils/frequencyToNote';
import { cn } from '@/utils/classnames';

export function PitchDebugPanel() {
  const { liveDetectedHz, notes, currentNoteIndex, phase } = usePracticeStore();

  const detectedNote = liveDetectedHz > 0 ? frequencyToPitch(liveDetectedHz) : '—';
  const expectedNote =
    phase === 'playing' && notes[currentNoteIndex]
      ? notes[currentNoteIndex].pitch
      : '—';

  const isMatch = liveDetectedHz > 0 &&
    phase === 'playing' &&
    notes[currentNoteIndex] &&
    Math.abs(liveDetectedHz - notes[currentNoteIndex].frequency) /
      notes[currentNoteIndex].frequency < 0.06;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-3 font-mono text-sm">
      <div className="flex items-center gap-2">
        {/* Live mic indicator */}
        <span
          className={cn(
            'inline-block h-2 w-2 rounded-full',
            liveDetectedHz > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600',
          )}
        />
        <span className="text-gray-500 text-xs uppercase tracking-wider">Detected</span>
      </div>

      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            'text-lg font-bold transition-colors duration-100',
            liveDetectedHz > 0 ? 'text-emerald-300' : 'text-gray-600',
          )}
        >
          {detectedNote}
        </span>
        {liveDetectedHz > 0 && (
          <span className="text-xs text-gray-500">{liveDetectedHz.toFixed(1)} Hz</span>
        )}
      </div>

      <div className="h-4 w-px bg-white/10" />

      <div className="flex items-baseline gap-2">
        <span className="text-xs uppercase tracking-wider text-gray-500">Expected</span>
        <span className="text-lg font-bold text-blue-300">{expectedNote}</span>
      </div>

      {phase === 'playing' && (
        <>
          <div className="h-4 w-px bg-white/10" />
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider transition-colors',
              isMatch ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/10 text-red-400',
            )}
          >
            {isMatch ? '✓ Match' : '✗ No match'}
          </span>
        </>
      )}
    </div>
  );
}
