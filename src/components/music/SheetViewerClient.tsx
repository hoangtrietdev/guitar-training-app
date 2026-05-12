import { useEffect, useRef } from 'react';
import type { GuitarNote, NoteResult } from '@/types/music';

// VexFlow string: 1 = high e, 6 = low E. Our model: string 0 = low E, 5 = high e.
function toVexString(ourString: number): number {
  return 6 - ourString; // 0→6, 5→1
}

// Map note name + octave to VexFlow key string like "c/4"
function toVexKey(noteName: string, octave: number): string {
  return `${noteName.replace('#', '#').toLowerCase()}/${octave}`;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#3B82F6',
  active:  '#F59E0B',
  hit:     '#10B981',
  miss:    '#EF4444',
  late:    '#F97316',
};

interface Props {
  notes: GuitarNote[];
  results: NoteResult[];
  currentNoteIndex: number;
  scaleLabel: string;
  renderScale?: number;
}

export function SheetViewerClient({ notes, results, currentNoteIndex, scaleLabel, renderScale = 1 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || notes.length === 0) return;

    let Vex: typeof import('vexflow');
    (async () => {
      try {
        Vex = await import('vexflow');
      } catch {
        return;
      }

      const { Renderer, Stave, StaveNote, TabStave, TabNote, Voice, Formatter } = Vex;

      const container = containerRef.current!;
      container.innerHTML = '';

      const noteCount = notes.length;
      const NOTE_WIDTH = 56;
      const STAVE_WIDTH = Math.max(500, noteCount * NOTE_WIDTH + 80);
      const TOTAL_WIDTH = STAVE_WIDTH + 40;
      const TOTAL_HEIGHT = 140;

      const renderer = new Renderer(container, Renderer.Backends.SVG);
      renderer.resize(TOTAL_WIDTH * renderScale, TOTAL_HEIGHT * renderScale);
      const ctx = renderer.getContext();
      ctx.scale(renderScale, renderScale);
      (ctx as SVGContext).setFont('Inter', 10);

      // ── Treble staff ──
      const stave = new Stave(20, 10, STAVE_WIDTH);
      stave.addClef('treble').addTimeSignature(`${noteCount}/4`);
      stave.setContext(ctx).draw();

      // Build StaveNotes
      const staveNotes = notes.map((note, idx) => {
        const status = results[idx]?.status ?? 'pending';
        const isActive = idx === currentNoteIndex;
        const color = isActive ? STATUS_COLORS.active : STATUS_COLORS[status];

        const sn = new StaveNote({
          keys: [toVexKey(note.noteName, note.octave)],
          duration: 'q',
          autoStem: true,
        });
        sn.setStyle({ fillStyle: color, strokeStyle: color });
        return sn;
      });

      const voice = new Voice({ numBeats: noteCount, beatValue: 4 }).setMode(3 /* VoiceMode.Soft */);
      voice.addTickables(staveNotes);
      new Formatter().joinVoices([voice]).format([voice], STAVE_WIDTH - 80);
      voice.draw(ctx, stave);

      // Draw the stave and notes with default colors (black)
      stave.setContext(ctx).draw();
      
      const svg = container.querySelector('svg');
      if (svg) {
        svg.style.background = 'transparent';
      }
    })();
  }, [notes, results, currentNoteIndex, scaleLabel, renderScale]);

  return (
    <div className="w-full h-full flex items-center justify-start bg-[#F8F9FA] rounded-xl overflow-hidden shadow-inner">
      <div ref={containerRef} aria-label="Standard notation" role="img" className="pl-4" />
    </div>
  );
}

// Stub type to avoid TS complaint on setFont
interface SVGContext { setFont(family: string, size: number): void; }
