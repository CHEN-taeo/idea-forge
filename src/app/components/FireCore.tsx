import { cn } from './ui/utils';

/** 围炉中央炭火 — 品牌图腾，替代 🔥 emoji */
export function FireCore({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('rt-fire-core', className)}
      aria-hidden
    >
      <defs>
        <radialGradient id="fire-glow" cx="50%" cy="75%" r="55%">
          <stop offset="0%" stopColor="#e8a54b" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#c45c26" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c45c26" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="flame-inner" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#8b3a12" />
          <stop offset="35%" stopColor="#e8a54b" />
          <stop offset="70%" stopColor="#f5d78e" />
          <stop offset="100%" stopColor="#fff8e8" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="52" rx="18" ry="6" fill="rgba(0,0,0,0.35)" />
      <circle cx="32" cy="40" r="22" fill="url(#fire-glow)" opacity="0.85" />
      <path
        d="M32 48 C24 42 22 32 28 22 C30 28 32 30 32 30 C32 30 34 26 36 20 C40 30 40 40 32 48 Z"
        fill="url(#flame-inner)"
        opacity="0.95"
      />
      <path
        d="M28 44 C26 38 27 32 30 28 C31 33 32 35 32 35 C32 35 33 31 35 27 C37 34 36 40 28 44 Z"
        fill="#f5d78e"
        opacity="0.75"
      />
      <ellipse cx="32" cy="46" rx="4" ry="2" fill="#ffecd0" opacity="0.6" />
    </svg>
  );
}
