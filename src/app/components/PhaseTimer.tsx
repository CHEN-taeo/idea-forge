import { useEffect, useRef, useState } from 'react';
import { cn } from './ui/utils';

interface PhaseTimerProps {
  duration?: number; // seconds — used when deadline absent
  deadline?: number | null; // ms timestamp from server gameState.timerEnd
  onExpire?: () => void;
  paused?: boolean;
  className?: string;
  size?: 'sm' | 'lg' | 'screen';
}

function remainingFromDeadline(deadline: number | null | undefined): number | null {
  if (!deadline) return null;
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

export function PhaseTimer({
  duration = 300,
  deadline,
  onExpire,
  paused = false,
  className,
  size = 'sm',
}: PhaseTimerProps) {
  const initial = deadline != null ? (remainingFromDeadline(deadline) ?? duration) : duration;
  const [remaining, setRemaining] = useState(initial);
  const expiredRef = useRef(false);
  const pulseRef = useRef(false);

  useEffect(() => {
    const next = deadline != null ? (remainingFromDeadline(deadline) ?? duration) : duration;
    setRemaining(next);
    expiredRef.current = false;
    pulseRef.current = false;
  }, [duration, deadline]);

  useEffect(() => {
    if (paused) return;

    const tick = () => {
      setRemaining((prev) => {
        const next = deadline != null ? (remainingFromDeadline(deadline) ?? 0) : prev - 1;
        if (next <= 10 && next > 0) pulseRef.current = !pulseRef.current;
        if (next <= 0) {
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return next;
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [paused, deadline, onExpire]);

  const baseDuration = deadline != null
    ? Math.max(remaining, 1)
    : duration;
  const progress = baseDuration > 0 ? remaining / baseDuration : 0;
  const isUrgent = remaining <= 10 && remaining > 0;
  const isCritical = remaining <= 5 && remaining > 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const svgSize = size === 'screen' ? 'size-16' : size === 'lg' ? 'size-8' : 'size-5';
  const textSize = size === 'screen' ? 'text-4xl font-light tracking-tight' : size === 'lg' ? 'text-sm' : 'text-[10px]';

  return (
    <div
      className={cn(
        'flex items-center gap-2 transition-transform duration-300',
        isUrgent && 'animate-timer-urgent',
        isCritical && 'scale-110',
        className
      )}
      aria-live="polite"
      aria-label={`剩余时间 ${display}`}
    >
      <svg className={cn(svgSize, '-rotate-90')} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="none" stroke="var(--if-line)" strokeWidth="2" />
        <circle
          cx="12" cy="12" r="10"
          fill="none"
          stroke={isUrgent ? 'var(--if-danger)' : 'var(--if-accent)'}
          strokeWidth={isCritical ? 3 : 2}
          strokeLinecap="round"
          strokeDasharray={Math.PI * 20}
          strokeDashoffset={Math.PI * 20 * (1 - progress)}
          className={cn('transition-all duration-1000 ease-linear', isUrgent && 'drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]')}
        />
      </svg>
      <span
        className={cn(
          'tabular-nums font-mono transition-colors',
          textSize,
          isUrgent ? 'text-[var(--if-danger)] font-medium' : 'text-[var(--if-muted)]',
          isCritical && 'animate-pulse text-[var(--if-danger)]'
        )}
      >
        {display}
      </span>
      <style>{`
        @keyframes timer-urgent {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.25); }
        }
        .animate-timer-urgent { animation: timer-urgent 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
