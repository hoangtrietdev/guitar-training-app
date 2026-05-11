import { useEffect, type ReactNode } from 'react';
import { cn } from '@/utils/classnames';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  // Trap body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet (mobile = bottom-sheet, desktop = centered card) */}
      <div
        className={cn(
          'relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-2xl',
          'bg-[#1C1C1E] shadow-2xl ring-1 ring-white/10',
          'animate-modal-up',
          className,
        )}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            {title && <h2 className="text-[17px] font-semibold text-white">{title}</h2>}
            {onClose && (
              <button
                onClick={onClose}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-gray-400 hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="px-5 pb-6 pt-2">{children}</div>
      </div>
    </div>
  );
}
