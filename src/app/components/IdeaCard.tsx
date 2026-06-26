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
        'border border-[var(--if-line)]',
        selected
          ? 'bg-[var(--if-accent-soft)] border-[var(--if-accent-border)] shadow-[0_0_12px_rgba(196,103,58,0.08)]'
          : 'bg-[var(--if-surface)] hover:bg-[var(--if-card)] hover:border-[var(--if-accent-border)]/50',
        !alive && 'opacity-35'
      )}
    >
      <div className="flex items-start gap-2 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {index !== undefined && (
              <span className="text-[10px] text-[var(--if-muted-soft)] tabular-nums">#{index}</span>
            )}
            {!hideAuthor && (
              <>
                <PlayerAvatar name={authorName} size="sm" />
                <span className="text-[10px] text-[var(--if-muted)]">{authorName}</span>
              </>
            )}
            {hideAuthor && (
              <span className="text-[10px] text-[var(--if-muted-soft)] italic">匿名</span>
            )}
            {round === 2 && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--if-card)] text-[var(--if-muted-soft)]">改造</span>
            )}
            {challenged && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-[rgba(155,34,38,0.08)] text-[var(--if-danger)]">被质询</span>
            )}
          </div>

          <p className="text-xs text-[var(--if-ink-soft)] leading-relaxed mb-0.5">{text}</p>

          {inspiration && (
            <p className="text-[10px] text-[var(--if-muted-soft)] truncate">{inspiration}</p>
          )}

          <div className="flex items-center gap-3 mt-1">
            {votes > 0 && (
              <span className="text-[10px] text-[var(--if-muted-soft)]">{votes} 票</span>
            )}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
