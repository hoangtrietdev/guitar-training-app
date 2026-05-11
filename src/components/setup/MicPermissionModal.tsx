import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Mic, ShieldCheck, MicOff } from 'lucide-react';

interface MicPermissionModalProps {
  open: boolean;
  onGranted: () => void;
  onClose: () => void;
}

type State = 'idle' | 'requesting' | 'granted' | 'denied';

export function MicPermissionModal({ open, onGranted, onClose }: MicPermissionModalProps) {
  const [state, setState] = useState<State>('idle');

  const request = async () => {
    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setState('granted');
      setTimeout(() => { onGranted(); onClose(); }, 600);
    } catch {
      setState('denied');
    }
  };

  return (
    <Modal open={open} onClose={state !== 'requesting' ? onClose : undefined} title="Microphone Access">
      <div className="flex flex-col items-center gap-5 text-center pt-2">
        {/* Icon */}
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
          state === 'denied' ? 'bg-red-500/15' : state === 'granted' ? 'bg-green-500/15' : 'bg-blue-500/15'
        }`}>
          {state === 'denied' ? (
            <MicOff className="h-8 w-8 text-red-400" />
          ) : state === 'granted' ? (
            <ShieldCheck className="h-8 w-8 text-green-400" />
          ) : (
            <Mic className="h-8 w-8 text-[#0A84FF]" />
          )}
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <p className="text-[15px] font-medium text-white">
            {state === 'denied' ? 'Access Denied' : state === 'granted' ? 'Microphone Ready!' : '"GuitarTrainer" Would Like to Use Your Microphone'}
          </p>
          <p className="text-[13px] text-gray-400">
            {state === 'denied'
              ? 'Please allow microphone access in your browser settings, then refresh the page.'
              : state === 'granted'
              ? 'Your microphone is connected. Starting practice…'
              : 'This allows real-time pitch detection to check the notes you play on your guitar.'}
          </p>
        </div>

        {/* Privacy note */}
        {state === 'idle' && (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-[12px] text-gray-400">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-green-400" />
            Audio is processed locally — never recorded or uploaded.
          </div>
        )}

        {/* Action */}
        {state !== 'denied' && state !== 'granted' && (
          <div className="flex w-full flex-col gap-2">
            <Button
              id="btn-allow-mic"
              className="w-full"
              onClick={request}
              disabled={state === 'requesting'}
            >
              {state === 'requesting' ? 'Requesting…' : 'Allow Microphone'}
            </Button>
            <button
              className="text-[13px] text-gray-500 hover:text-gray-300 transition-colors py-1"
              onClick={onClose}
            >
              Not Now
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
