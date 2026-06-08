import { cn } from './ui/utils';
import { PlayerAvatar } from './PlayerAvatar';

interface IdeaCardProps {
  index?: number;
  text: string;
  authorName: string;
  votes?: number;
  round?: number;
  inspiration?: string;
  challenged?: boolean;
  alive?: boolean;
  selected?: boolean;
  hideAuthor?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function IdeaCard({
  index,
  text,
  authorName,
  votes = 0,
  round,
  inspiration,
  challenged,
  alive = true,
  selected = false,
  hideAuthor = false,
  onClick,
  children,
}: IdeaCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative mx-2 my-1.5 px-3 py-2.5 rounded-2xl transition-all duration-300 cursor-pointer',
        'border border-white/[0.06]',
        selected
          ? 'bg-white/[0.06] border-blue-400/20 shadow-[0_0_16px_rgba(96,165,250,0.12)]'
          : 'bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/[0.1] hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)]',
        !alive && 'opacity-35'
      )}
    >
      <div className="flex items-start gap-2 relative z-10">
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-1.5 mb-1">
            {index !== undefined && (
              <span className="text-[10px] text-white/12 tabular-nums">#{index}</span>
            )}
            {!hideAuthor && (
              <>
                <PlayerAvatar name={authorName} size="sm" />
                <span className="text-[10px] text-white/30">{authorName}</span>
              </>
            )}
            {hideAuthor && (
              <span className="text-[10px] text-white/12 italic">匿名</span>
            )}
            {round === 2 && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-white/[0.04] text-white/15">改造</span>
            )}
            {challenged && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-400/60">被质询</span>
            )}
          </div>

          {/* Content */}
          <p className="text-xs text-white/65 leading-relaxed mb-0.5">{text}</p>

          {/* Inspiration line */}
          {inspiration && (
            <p className="text-[10px] text-white/12 truncate">{inspiration}</p>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 mt-1">
            {votes > 0 && (
              <span className="text-[10px] text-white/15">{votes} 票</span>
            )}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
