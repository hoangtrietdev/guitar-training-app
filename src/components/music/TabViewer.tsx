import { useEffect, useRef, useCallback } from 'react';
import type { GuitarNote, NoteResult } from '@/types/music';
import { getAudioContext } from '@/hooks/useAudioContext';

const STATUS_COLORS: Record<string, string> = {
  pending: '#3B82F6',
  active:  '#FF9F0A',
  hit:     '#30D158',
  miss:    '#FF453A',
  late:    '#FF9F0A',
};

// Standard tab order: High e is top line (index 0), Low E is bottom line (index 5)
const STRING_LABELS = ['e','B','G','D','A','E'];

interface TabViewerProps {
  notes: GuitarNote[];
  results: NoteResult[];
  currentNoteIndex: number;
  scaleLabel: string;
  tempo: number;
  phase: string;
  playStartAudioTime: number | null;
}

export function TabViewer({ notes, results, currentNoteIndex, scaleLabel, tempo, phase, playStartAudioTime }: TabViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const NOTE_W = 56;
  const LEFT = 44;
  const TOP = 30;
  const GAP = 30;       // string spacing px — reduced to prevent vertical cropping
  const STRINGS = 6;
  const HEIGHT = TOP + (STRINGS - 1) * GAP + 50;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || notes.length === 0) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const W = canvas.width;
    const H = canvas.height;

    // ── Smooth playhead interpolation ──────────────────────
    let playheadX = LEFT + currentNoteIndex * NOTE_W + NOTE_W / 2;

    if (phase === 'playing' && playStartAudioTime !== null) {
      const spb = 60 / tempo;
      const elapsed = getAudioContext().currentTime - playStartAudioTime;
      const exactBeat = elapsed / spb;
      const smoothIdx = Math.max(0, Math.min(exactBeat, notes.length - 0.01));
      playheadX = LEFT + smoothIdx * NOTE_W + NOTE_W / 2;
    }

    ctx2d.clearRect(0, 0, W, H);

    // Background
    ctx2d.fillStyle = '#0A0A0A';
    ctx2d.fillRect(0, 0, W, H);

    // Scale label
    ctx2d.fillStyle = 'rgba(255,255,255,0.2)';
    ctx2d.font = '11px system-ui';
    ctx2d.fillText(scaleLabel, LEFT, 14);

    // String lines
    for (let s = 0; s < STRINGS; s++) {
      const y = TOP + s * GAP;
      // String label
      ctx2d.fillStyle = 'rgba(255,255,255,0.3)';
      ctx2d.font = `${11 + (STRINGS - s - 1) * 0.5}px "Fira Code", monospace`;
      ctx2d.textAlign = 'right';
      ctx2d.fillText(STRING_LABELS[s], LEFT - 6, y + 4);
      ctx2d.textAlign = 'left';

      // Line (thickness varies with string thickness)
      ctx2d.strokeStyle = `rgba(255,255,255,${0.08 + (STRINGS - s - 1) * 0.02})`;
      ctx2d.lineWidth = 0.5 + (STRINGS - s - 1) * 0.2;
      ctx2d.beginPath();
      ctx2d.moveTo(LEFT, y);
      ctx2d.lineTo(W - 16, y);
      ctx2d.stroke();
    }

    // Beat grid lines (subtle)
    for (let i = 0; i < notes.length; i++) {
      const x = LEFT + i * NOTE_W;
      ctx2d.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx2d.lineWidth = 1;
      ctx2d.beginPath();
      ctx2d.moveTo(x, TOP - 10);
      ctx2d.lineTo(x, TOP + (STRINGS - 1) * GAP + 4);
      ctx2d.stroke();
    }

    // Playhead glow zone
    const glowGrad = ctx2d.createLinearGradient(playheadX - 40, 0, playheadX + 40, 0);
    glowGrad.addColorStop(0, 'rgba(255,159,10,0)');
    glowGrad.addColorStop(0.5, 'rgba(255,159,10,0.06)');
    glowGrad.addColorStop(1, 'rgba(255,159,10,0)');
    ctx2d.fillStyle = glowGrad;
    ctx2d.fillRect(playheadX - 40, TOP - 10, 80, (STRINGS - 1) * GAP + 24);

    // Note dots
    notes.forEach((note, idx) => {
      const cx = LEFT + idx * NOTE_W + NOTE_W / 2;
      // Reverse string index so Low E (string 0) is at the bottom (i=5)
      const visualStringIdx = 5 - note.string;
      const cy = TOP + visualStringIdx * GAP;
      const status = results[idx]?.status ?? 'pending';
      const isActive = idx === currentNoteIndex;
      const color = isActive ? STATUS_COLORS.active : STATUS_COLORS[status];
      const r = isActive ? 13 : 10;

      // Erase line behind dot
      ctx2d.fillStyle = '#0A0A0A';
      ctx2d.fillRect(cx - r - 2, cy - r - 2, (r + 2) * 2, (r + 2) * 2);

      // Glow for active
      if (isActive && phase === 'playing') {
        ctx2d.shadowColor = color;
        ctx2d.shadowBlur = 16;
      }

      // Circle
      ctx2d.fillStyle = color;
      ctx2d.beginPath();
      ctx2d.arc(cx, cy, r, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.shadowBlur = 0;

      // Fret number
      ctx2d.fillStyle = '#000';
      ctx2d.font = `bold ${isActive ? 12 : 11}px "Fira Code", monospace`;
      ctx2d.textAlign = 'center';
      ctx2d.textBaseline = 'middle';
      ctx2d.fillText(String(note.fret), cx, cy);

      // Note name below the tab
      ctx2d.fillStyle = isActive ? '#fff' : 'rgba(255,255,255,0.3)';
      ctx2d.font = `${isActive ? 10 : 9}px system-ui`;
      ctx2d.fillText(note.noteName, cx, TOP + (STRINGS - 1) * GAP + 24);
      ctx2d.textAlign = 'left';
      ctx2d.textBaseline = 'alphabetic';
    });

    // Playhead line
    ctx2d.strokeStyle = 'rgba(255,159,10,0.7)';
    ctx2d.lineWidth = 1.5;
    ctx2d.setLineDash([3, 3]);
    ctx2d.beginPath();
    ctx2d.moveTo(playheadX, TOP - 12);
    ctx2d.lineTo(playheadX, TOP + (STRINGS - 1) * GAP + 12);
    ctx2d.stroke();
    ctx2d.setLineDash([]);

    // Playhead triangle indicator
    ctx2d.fillStyle = '#FF9F0A';
    ctx2d.beginPath();
    ctx2d.moveTo(playheadX - 5, TOP - 16);
    ctx2d.lineTo(playheadX + 5, TOP - 16);
    ctx2d.lineTo(playheadX, TOP - 8);
    ctx2d.closePath();
    ctx2d.fill();
  }, [notes, results, currentNoteIndex, scaleLabel, tempo, phase, playStartAudioTime, NOTE_W, LEFT, TOP, GAP, STRINGS]);

  // Animation loop
  useEffect(() => {
    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const canvasWidth = Math.max(600, notes.length * NOTE_W + LEFT + 32);

  return (
    <div className="w-full h-full">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={HEIGHT}
        aria-label="Guitar tablature"
        role="img"
        className="block"
        style={{ minWidth: canvasWidth, height: HEIGHT }}
      />
    </div>
  );
}
