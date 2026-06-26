import { useId } from 'react';
import { cn } from './ui/utils';

/** 炉边 · 品牌标 — 极简余烬，用于首页等 */
export function BrandMark({ className, size = 28 }: { className?: string; size?: number }) {
  const uid = useId().replace(/:/g, '');
  const glowId = `brand-glow-${uid}`;
  const flameId = `brand-flame-${uid}`;

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={cn('brand-mark', className)}
      aria-hidden
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="72%" r="50%">
          <stop offset="0%" stopColor="#e8a54b" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#c4673a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={flameId} x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#a84a1f" />
          <stop offset="45%" stopColor="#c4673a" />
          <stop offset="85%" stopColor="#e8b86d" />
          <stop offset="100%" stopColor="#f5e6c8" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="26" r="11" fill={`url(#${glowId})`} />
      <path
        d="M20 31 C14.5 27.5 13.5 20 17 13 C18.2 17 20 19 20 19 C20 19 21.8 15.5 23.5 11.5 C27 19.5 26 27 20 31 Z"
        fill={`url(#${flameId})`}
      />
      <path
        d="M20 28 C17.5 25.5 17 21 18.5 17.5 C19.2 20 20 21 20 21 C20 21 20.8 19 21.5 17 C22.5 21 22 25 20 28 Z"
        fill="#f5e6c8"
        opacity="0.55"
      />
    </svg>
  );
}
