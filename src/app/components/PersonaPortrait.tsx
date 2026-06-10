import type { ReactNode } from 'react';
import { cn } from './ui/utils';
import type { Persona } from '../data/personas';

/** 风格化立绘 SVG — 抽象 bust，非真实照片，避免肖像权问题 */
function PortraitSvg({ id, color }: { id: string; color: string }) {
  const skin = 'rgba(255,235,210,0.88)';
  const shadow = `${color}44`;

  const portraits: Record<string, ReactNode> = {
    musk: (
      <>
        <ellipse cx="24" cy="28" rx="11" ry="13" fill={skin} />
        <path d="M14 22 Q24 14 34 22" stroke={color} strokeWidth="1.5" fill="none" opacity="0.7" />
        <ellipse cx="20" cy="27" rx="1.2" ry="1.5" fill="#1a1208" />
        <ellipse cx="28" cy="27" rx="1.2" ry="1.5" fill="#1a1208" />
        <path d="M18 33 Q24 36 30 33" stroke="#1a1208" strokeWidth="0.8" fill="none" opacity="0.5" />
        <path d="M10 18 L14 26 M34 18 L30 26" stroke={color} strokeWidth="1.2" opacity="0.6" />
        <circle cx="38" cy="12" r="3" fill={color} opacity="0.35" />
      </>
    ),
    huang: (
      <>
        <ellipse cx="24" cy="28" rx="11" ry="13" fill={skin} />
        <path d="M13 20 Q24 12 35 20 L36 38 Q24 42 12 38 Z" fill={color} opacity="0.55" />
        <rect x="14" y="22" width="20" height="3" rx="1" fill="#1a1208" opacity="0.25" />
        <ellipse cx="20" cy="27" rx="1.2" ry="1.5" fill="#1a1208" />
        <ellipse cx="28" cy="27" rx="1.2" ry="1.5" fill="#1a1208" />
        <path d="M19 32 Q24 34 29 32" stroke="#1a1208" strokeWidth="0.8" fill="none" opacity="0.4" />
      </>
    ),
    marx: (
      <>
        <ellipse cx="24" cy="27" rx="11" ry="12" fill={skin} />
        <path d="M16 34 Q24 42 32 34 L30 38 Q24 44 18 38 Z" fill="#3a2a20" opacity="0.85" />
        <path d="M14 30 Q24 38 34 30" fill="#3a2a20" opacity="0.7" />
        <ellipse cx="20" cy="26" rx="1.2" ry="1.5" fill="#1a1208" />
        <ellipse cx="28" cy="26" rx="1.2" ry="1.5" fill="#1a1208" />
        <path d="M13 18 Q24 8 35 18" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      </>
    ),
    jobs: (
      <>
        <ellipse cx="24" cy="28" rx="10" ry="12" fill={skin} />
        <rect x="14" y="22" width="20" height="18" rx="3" fill="#1a1208" opacity="0.75" />
        <circle cx="24" cy="18" r="9" fill="#1a1208" opacity="0.6" />
        <ellipse cx="20" cy="26" rx="1.5" ry="1.8" fill={skin} />
        <ellipse cx="28" cy="26" rx="1.5" ry="1.8" fill={skin} />
        <circle cx="38" cy="14" r="4" fill={color} opacity="0.4" />
      </>
    ),
    socrates: (
      <>
        <ellipse cx="24" cy="28" rx="10" ry="12" fill={skin} />
        <path d="M12 22 Q24 10 36 22 L34 40 Q24 44 14 40 Z" fill="#e8dcc8" opacity="0.5" stroke={color} strokeWidth="0.8" />
        <path d="M16 32 Q24 38 32 32" fill="#c4b8a0" opacity="0.6" />
        <ellipse cx="20" cy="26" rx="1.2" ry="1.5" fill="#1a1208" />
        <ellipse cx="28" cy="26" rx="1.2" ry="1.5" fill="#1a1208" />
        <path d="M10 16 L16 24 M38 16 L32 24" stroke={color} strokeWidth="1" opacity="0.4" />
      </>
    ),
    luxun: (
      <>
        <ellipse cx="24" cy="28" rx="10" ry="12" fill={skin} />
        <path d="M17 32 L20 36 L28 36 L31 32" stroke="#1a1208" strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M18 30 Q24 34 30 30" fill="#2a2018" opacity="0.55" />
        <rect x="16" y="14" width="16" height="8" rx="2" fill="#1a1208" opacity="0.55" />
        <ellipse cx="20" cy="26" rx="1.2" ry="1.5" fill="#1a1208" />
        <ellipse cx="28" cy="26" rx="1.2" ry="1.5" fill="#1a1208" />
        <line x1="8" y1="38" x2="40" y2="38" stroke={color} strokeWidth="1.5" opacity="0.35" />
      </>
    ),
    feynman: (
      <>
        <ellipse cx="24" cy="28" rx="11" ry="13" fill={skin} />
        <path d="M14 20 Q24 14 34 20" stroke="#3a2a18" strokeWidth="2" fill="none" opacity="0.5" />
        <ellipse cx="20" cy="27" rx="1.5" ry="1.8" fill="#1a1208" />
        <ellipse cx="28" cy="27" rx="1.5" ry="1.8" fill="#1a1208" />
        <path d="M18 33 Q24 37 30 33" stroke="#1a1208" strokeWidth="0.8" fill="none" opacity="0.45" />
        <circle cx="38" cy="10" r="2.5" fill={color} opacity="0.5" />
        <circle cx="42" cy="14" r="2" fill={color} opacity="0.35" />
      </>
    ),
    laozi: (
      <>
        <ellipse cx="24" cy="29" rx="10" ry="11" fill={skin} />
        <path d="M14 28 Q24 42 34 28" fill="#d4c4a8" opacity="0.65" />
        <path d="M16 26 Q24 18 32 26" stroke="#c4b498" strokeWidth="1.5" fill="none" opacity="0.6" />
        <ellipse cx="20" cy="27" rx="1" ry="1.2" fill="#1a1208" opacity="0.7" />
        <ellipse cx="28" cy="27" rx="1" ry="1.2" fill="#1a1208" opacity="0.7" />
        <path d="M8 12 Q24 4 40 12" stroke={color} strokeWidth="1" fill="none" opacity="0.35" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden>
      <defs>
        <radialGradient id={`bg-${id}`} cx="40%" cy="35%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={shadow} stopOpacity="0.08" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="23" fill={`url(#bg-${id})`} />
      <g>{portraits[id] ?? portraits.musk}</g>
    </svg>
  );
}

/** 用户默认立绘 */
function UserPortrait({ initial, color }: { initial: string; color: string }) {
  const letter = initial.slice(0, 1).toUpperCase() || '我';
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden>
      <defs>
        <radialGradient id="bg-user" cx="40%" cy="35%">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="23" fill="url(#bg-user)" />
      <ellipse cx="24" cy="27" rx="12" ry="14" fill="rgba(255,235,210,0.82)" />
      <ellipse cx="20" cy="26" rx="1.2" ry="1.5" fill="#1a1208" opacity="0.6" />
      <ellipse cx="28" cy="26" rx="1.2" ry="1.5" fill="#1a1208" opacity="0.6" />
      <path d="M19 32 Q24 35 29 32" stroke="#1a1208" strokeWidth="0.7" fill="none" opacity="0.35" />
      <circle cx="38" cy="12" r="7" fill={color} opacity="0.25" />
      <text x="38" y="15" textAnchor="middle" fill={color} fontSize="9" fontWeight="600">
        {letter}
      </text>
    </svg>
  );
}

export function PersonaPortrait({
  persona,
  userInitial,
  color,
  size = 44,
  active = false,
  speaking = false,
  label,
  sublabel,
  className,
}: {
  persona?: Persona | null;
  userInitial?: string;
  color: string;
  size?: number;
  active?: boolean;
  speaking?: boolean;
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)}>
      <div
        className={cn(
          'relative rounded-full overflow-hidden flex-shrink-0 transition-shadow duration-300',
          speaking && 'rt-speak'
        )}
        style={{
          width: size,
          height: size,
          border: `2px solid ${color}${active || speaking ? 'ee' : '55'}`,
          boxShadow: active || speaking
            ? `0 0 22px ${color}66, 0 0 44px ${color}22, inset 0 0 12px ${color}18`
            : `0 2px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)`,
          ['--seat-color' as string]: `${color}66`,
        }}
      >
        {persona ? (
          <PortraitSvg id={persona.id} color={color} />
        ) : (
          <UserPortrait initial={userInitial ?? '我'} color={color} />
        )}
        {active && (
          <span
            className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-[#1c1410] z-10"
            style={{ background: color }}
          />
        )}
        {speaking && (
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ boxShadow: `inset 0 0 16px ${color}55` }}
          />
        )}
      </div>
      {label && (
        <div className="text-center max-w-[80px]">
          <p className="text-[10px] text-white/55 truncate">{label}</p>
          {sublabel && (
            <p className="text-[9px] mt-0.5 truncate animate-pulse" style={{ color: `${color}cc` }}>
              {sublabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
