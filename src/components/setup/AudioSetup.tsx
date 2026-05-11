import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Mic, MicOff } from 'lucide-react';

interface AudioSetupProps {
  onGranted: () => void;
}

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied';

export function AudioSetup({ onGranted }: AudioSetupProps) {
  const [state, setState] = useState<PermissionState>('idle');

  const requestMic = async () => {
    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop()); // release immediately; real use starts later
      setState('granted');
      onGranted();
    } catch {
      setState('denied');
    }
  };

  if (state === 'granted') return null;

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#1E1E1E] p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/30">
        {state === 'denied' ? (
          <MicOff className="h-7 w-7 text-red-400" />
        ) : (
          <Mic className="h-7 w-7 text-blue-400" />
        )}
      </div>
      <div>
        <p className="font-semibold text-gray-200">Microphone Access Required</p>
        <p className="mt-1 text-sm text-gray-400">
          {state === 'denied'
            ? 'Permission denied. Please allow microphone access in your browser settings and refresh.'
            : 'Allow microphone access so the app can detect the notes you play.'}
        </p>
      </div>
      {state !== 'denied' && (
        <Button onClick={requestMic} disabled={state === 'requesting'} id="btn-request-mic">
          {state === 'requesting' ? 'Requesting…' : 'Enable Microphone'}
        </Button>
      )}
    </div>
  );
}
