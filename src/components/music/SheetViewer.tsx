import dynamic from 'next/dynamic';
import type { GuitarNote, NoteResult } from '@/types/music';

// VexFlow touches the DOM — must be client-side only
const SheetViewerClient = dynamic(
  () => import('./SheetViewerClient').then((m) => m.SheetViewerClient),
  { ssr: false, loading: () => <div className="flex h-40 items-center justify-center text-gray-500 text-sm">Loading notation…</div> }
);

interface SheetViewerProps {
  notes: GuitarNote[];
  results: NoteResult[];
  currentNoteIndex: number;
  scaleLabel: string;
  renderScale?: number;
}

export function SheetViewer(props: SheetViewerProps) {
  return <SheetViewerClient {...props} />;
}
