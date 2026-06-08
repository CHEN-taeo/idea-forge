import { useEffect, useRef, useState } from 'react';
import { cn } from './ui/utils';

interface PhaseTimerProps {
  duration: number; // seconds
  onExpire?: () => void;
  paused?: boolean;
  className?: string;
}

export function PhaseTimer({ duration, onExpire, paused = false, className }: PhaseTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const expiredRef = useRef(false);

  useEffect(() => {
    setRemaining(duration);
    expiredRef.current = false;
  }, [duration]);

  useEffect(() => {
    if (paused || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paused, remaining, onExpire]);

  const progress = remaining / duration;
  const isUrgent = remaining <= 10;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Circular progress */}
      <svg className="size-5 -rotate-90" viewBox="0 0 24 24">
        <circle
          cx="12" cy="12" r="10"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="2"
        />
        <circle
          cx="12" cy="12" r="10"
          fill="none"
          stroke={isUrgent ? 'rgba(248,113,113,0.6)' : 'rgba(96,165,250,0.5)'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={Math.PI * 20}
          strokeDashoffset={Math.PI * 20 * (1 - progress)}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span
        className={cn(
          'text-[10px] tabular-nums font-mono transition-colors',
          isUrgent ? 'text-red-400' : 'text-white/25'
        )}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
