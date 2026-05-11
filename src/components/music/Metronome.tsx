import { usePracticeStore } from '@/store/usePracticeStore';
import { cn } from '@/utils/classnames';

export function Metronome() {
  const { phase, countInBeat, tempo } = usePracticeStore();

  const isCountIn = phase === 'count-in';

  return (
    <div className="flex items-center gap-3">
      {/* Beat dots */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            'h-3 w-3 rounded-full transition-all duration-75',
            isCountIn && countInBeat === i
              ? i === 0
                ? 'scale-150 bg-blue-400 shadow-lg shadow-blue-400/50'
                : 'scale-125 bg-blue-300 shadow-md shadow-blue-300/30'
              : 'bg-white/10',
          )}
        />
      ))}
      <span className="ml-2 font-mono text-sm text-gray-400">
        {tempo} <span className="text-xs text-gray-500">BPM</span>
      </span>
    </div>
  );
}
