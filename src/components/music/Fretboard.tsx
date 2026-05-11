import type { GuitarNote, NoteResult } from '@/types/music';
import { cn } from '@/utils/classnames';

interface FretboardProps {
  notes: GuitarNote[];
  results: NoteResult[];
  currentNoteIndex: number;
}

const STRINGS = 6;
const FRETS = 15;
const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'];
const MARKER_FRETS = [3, 5, 7, 9, 12];

const STATUS_COLORS: Record<string, string> = {
  pending: '#3B82F6',
  active:  '#F59E0B',
  hit:     '#10B981',
  miss:    '#EF4444',
  late:    '#F97316',
};

export function Fretboard({ notes, results, currentNoteIndex }: FretboardProps) {
  const W = 720;
  const H = 160;
  const LEFT_MARGIN = 32;
  const RIGHT_MARGIN = 16;
  const TOP_MARGIN = 24;
  const BOTTOM_MARGIN = 24;
  const stringSpacing = (H - TOP_MARGIN - BOTTOM_MARGIN) / (STRINGS - 1);
  const fretWidth = (W - LEFT_MARGIN - RIGHT_MARGIN) / FRETS;

  // Build a map: "string-fret" -> result info for this session
  const noteMap: Record<string, { status: string; isActive: boolean }> = {};
  results.forEach((r, idx) => {
    const key = `${r.note.string}-${r.note.fret}`;
    noteMap[key] = {
      status: r.status,
      isActive: idx === currentNoteIndex,
    };
  });

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-[80%] max-w-5xl max-h-full"
        aria-label="Guitar fretboard diagram"
        role="img"
      >
        {/* Nut */}
        <rect x={LEFT_MARGIN - 4} y={TOP_MARGIN} width={4} height={H - TOP_MARGIN - BOTTOM_MARGIN} fill="#D4B896" rx={1} />

        {/* Fret lines */}
        {Array.from({ length: FRETS + 1 }, (_, f) => (
          <line
            key={f}
            x1={LEFT_MARGIN + f * fretWidth}
            y1={TOP_MARGIN}
            x2={LEFT_MARGIN + f * fretWidth}
            y2={H - BOTTOM_MARGIN}
            stroke={f === 0 ? '#D4B896' : '#444'}
            strokeWidth={f === 0 ? 3 : 1}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: STRINGS }, (_, s) => (
          <line
            key={s}
            x1={LEFT_MARGIN}
            y1={TOP_MARGIN + s * stringSpacing}
            x2={W - RIGHT_MARGIN}
            y2={TOP_MARGIN + s * stringSpacing}
            stroke="#666"
            strokeWidth={1 + (STRINGS - s) * 0.2}
          />
        ))}

        {/* Fret position markers */}
        {MARKER_FRETS.map((f) => (
          <circle
            key={f}
            cx={LEFT_MARGIN + (f - 0.5) * fretWidth}
            cy={H / 2}
            r={4}
            fill="#333"
          />
        ))}

        {/* Fret numbers */}
        {[1, 3, 5, 7, 9, 12].map((f) => (
          <text
            key={f}
            x={LEFT_MARGIN + (f - 0.5) * fretWidth}
            y={H - 4}
            textAnchor="middle"
            fontSize={9}
            fill="#555"
          >
            {f}
          </text>
        ))}

        {/* String labels */}
        {STRING_LABELS.map((label, s) => (
          <text
            key={s}
            x={LEFT_MARGIN - 12}
            y={TOP_MARGIN + s * stringSpacing + 4}
            textAnchor="middle"
            fontSize={10}
            fill="#888"
          >
            {label}
          </text>
        ))}

        {/* Note dots */}
        {notes.map((note, idx) => {
          const key = `${note.string}-${note.fret}`;
          const info = noteMap[key];
          const cx = LEFT_MARGIN + (note.fret - 0.5) * fretWidth;
          const cy = TOP_MARGIN + note.string * stringSpacing;
          const isActive = idx === currentNoteIndex;
          const status = results[idx]?.status ?? 'pending';
          const color = STATUS_COLORS[status] ?? STATUS_COLORS.pending;

          return (
            <g key={`${idx}-${key}`}>
              {isActive && (
                <circle cx={cx} cy={cy} r={14} fill={color} opacity={0.2} />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={isActive ? 10 : 8}
                fill={color}
                stroke={isActive ? '#FFF' : 'transparent'}
                strokeWidth={isActive ? 2 : 0}
              />
              <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fill="#FFF" fontWeight="bold">
                {note.noteName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
