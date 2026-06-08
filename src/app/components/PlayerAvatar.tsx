import { cn } from './ui/utils';

const AVATAR_COLORS = [
  'bg-blue-500/20 text-blue-400',
  'bg-pink-500/20 text-pink-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-amber-500/20 text-amber-400',
  'bg-violet-500/20 text-violet-400',
  'bg-orange-500/20 text-orange-400',
  'bg-teal-500/20 text-teal-400',
  'bg-red-500/20 text-red-400',
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

interface PlayerAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PlayerAvatar({ name, size = 'md', className }: PlayerAvatarProps) {
  const initials = name.slice(0, 2).toUpperCase();
  const colorIndex = hashString(name) % AVATAR_COLORS.length;
  const sizeClasses = {
    sm: 'size-5 text-[9px]',
    md: 'size-6 text-[10px]',
    lg: 'size-8 text-xs',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full flex-shrink-0 font-medium',
        AVATAR_COLORS[colorIndex],
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}

export function getPlayerColor(name: string): string {
  return AVATAR_COLORS[hashString(name) % AVATAR_COLORS.length];
}
