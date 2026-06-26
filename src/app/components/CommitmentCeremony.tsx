import { useState, useCallback, useEffect, useRef } from 'react';
import { Idea, Player, Commitment } from '../types/game';
import { cn } from './ui/utils';
import { DUE_DAY_OPTIONS, formatSmartAction, validateSmartCommitment } from '../lib/smartCommitment';
import { brand } from '../lib/brand';

interface CommitmentCeremonyProps {
  ideas: Idea[];
  players: Record<string, Player>;
  currentPlayer: Player;
  serverCommitments?: Commitment[];
  onCreateCommitment: (action: string, ideaId: string, dueDays: number, onSuccess: (commitment: Commitment) => void) => void;
  onAiSuggestAction?: (ideaText: string, onResult: (action: string, mode: string) => void, onError: (msg: string) => void) => void;
}

function getTopIdeas(ideas: Idea[], n = 5): Idea[] {
  return [...ideas]
    .filter(i => i.alive)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, n);
}

export function CommitmentCeremony({ ideas, players, currentPlayer, serverCommitments = [], onCreateCommitment, onAiSuggestAction }: CommitmentCeremonyProps) {
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [smartWhat, setSmartWhat] = useState('');
  const [dueDays, setDueDays] = useState<number>(14);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModeHint, setAiModeHint] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const commitments = serverCommitments;
  const myCommitted = commitments.some(
    c => c.playerName.toLowerCase() === currentPlayer.name.toLowerCase()
  );

  const topIdeas = getTopIdeas(ideas);
  const claimedIdeaIds = new Set(commitments.map(c => c.ideaId));
  const totalPlayers = Object.keys(players).length;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedIdeaId && textareaRef.current) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [selectedIdeaId]);

  const handleSelectIdea = useCallback((ideaId: string) => {
    if (myCommitted) return;
    if (claimedIdeaIds.has(ideaId)) return;
    setSelectedIdeaId(prev => prev === ideaId ? null : ideaId);
    setSmartWhat('');
  }, [myCommitted, claimedIdeaIds]);

  const previewAction = smartWhat.trim()
    ? formatSmartAction(currentPlayer.name, smartWhat, dueDays)
    : '';

  const handleSubmit = useCallback(() => {
    const err = validateSmartCommitment(smartWhat, dueDays);
    if (err) {
      textareaRef.current?.focus();
      return;
    }
    if (!selectedIdeaId) return;

    setSubmitting(true);
    const action = formatSmartAction(currentPlayer.name, smartWhat, dueDays);

    onCreateCommitment(action, selectedIdeaId, dueDays, (result) => {
      setSubmitting(false);
      if (result?.error) return;
      setSelectedIdeaId(null);
      setSmartWhat('');
    });
  }, [smartWhat, dueDays, selectedIdeaId, currentPlayer.name, onCreateCommitment]);

  const selectedIdea = selectedIdeaId ? ideas.find(i => i.id === selectedIdeaId) : null;

  const handleAiSuggest = useCallback(() => {
    if (!selectedIdea || !onAiSuggestAction || aiLoading) return;
    setAiLoading(true);
    setAiModeHint(null);
    onAiSuggestAction(
      selectedIdea.text,
      (action, mode) => {
        setAiLoading(false);
        setSmartWhat(action.replace(/^[^：]+将在 \d+ 天内：/, '') || action);
        setAiModeHint(mode === 'ai' ? 'AI 建议（可修改）' : brand.hostOfflineHint + '（可修改）');
        textareaRef.current?.focus();
      },
      () => {
        setAiLoading(false);
      }
    );
  }, [selectedIdea, onAiSuggestAction, aiLoading]);

  return (
    <div
      className={cn(
        'transition-all duration-600 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <div className="flex items-baseline justify-between mb-3.5 px-0.5">
        <span className="if-eyebrow text-[var(--if-accent)]">落契仪式</span>
        <span className="text-[11px] text-[var(--if-muted)]">
          {commitments.length > 0
            ? `${commitments.length} / ${totalPlayers} 人已认领`
            : '认领一件你要做的事'}
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 mb-4 scrollbar-none">
        {topIdeas.map(idea => {
          const claimed = claimedIdeaIds.has(idea.id);
          const selected = idea.id === selectedIdeaId;
          const author = players[idea.authorId];
          return (
            <button
              key={idea.id}
              onClick={() => handleSelectIdea(idea.id)}
              disabled={claimed}
              className={cn(
                'flex-shrink-0 max-w-[180px] text-left rounded-xl p-3 cursor-pointer transition-all duration-200 relative',
                'if-card--flat hover:border-[var(--if-accent-border)] hover:-translate-y-0.5',
                selected && 'bg-[var(--if-accent-soft)] border-[var(--if-accent-border)] shadow-[0_0_12px_rgba(196,103,58,0.08)]',
                claimed && 'opacity-40 pointer-events-none'
              )}
            >
              <div className="text-[10px] text-[var(--if-muted)] mb-1.5 flex items-center gap-1">
                <span>⬆</span> {idea.votes}
              </div>
              <p className="text-xs leading-relaxed text-[var(--if-ink-soft)] line-clamp-3">{idea.text}</p>
              <p className="text-[10px] text-[var(--if-muted)] mt-1.5">
                {author?.name || idea.authorId}
              </p>
              <span
                className={cn(
                  'absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-[var(--if-success)] flex items-center justify-center text-[10px] text-white shadow',
                  claimed ? 'opacity-100 scale-100' : 'opacity-0 scale-0',
                  'transition-all duration-300'
                )}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          'if-card border-[var(--if-accent-border)] bg-[var(--if-accent-soft)] rounded-xl overflow-hidden transition-all duration-400 mb-5',
          selectedIdea ? 'max-h-[240px] opacity-100 py-4 px-[18px]' : 'max-h-0 opacity-0 py-0 px-[18px]'
        )}
      >
        {selectedIdea && (
          <>
            <label className="if-field-label mb-2 block">
              针对「{selectedIdea.text.substring(0, 25)}…」，我承诺要做：
            </label>
            <textarea
              ref={textareaRef}
              value={smartWhat}
              onChange={e => setSmartWhat(e.target.value)}
              placeholder="具体、可执行的一件事（至少 8 字）&#10;例如：联系 3 位潜在用户做访谈并整理反馈"
              maxLength={200}
              rows={3}
              className="if-field-textarea min-h-[64px] mb-2"
            />
            <div className="flex flex-wrap gap-2 mb-2.5">
              {DUE_DAY_OPTIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDueDays(d)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] border transition-colors',
                    dueDays === d ? 'if-chip--on' : 'if-chip'
                  )}
                >
                  {d} 天
                </button>
              ))}
            </div>
            {previewAction && (
              <p className="text-[11px] text-[var(--if-muted)] mb-2 leading-relaxed border-l-2 border-[var(--if-accent-border)] pl-2">
                预览：{previewAction}
              </p>
            )}
            {onAiSuggestAction && (
              <div className="flex items-center gap-2 mb-2.5">
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                  className="text-[11px] text-[var(--if-accent)] hover:opacity-80 transition-colors disabled:opacity-30"
                >
                  {aiLoading ? '⏳ AI 思考中…' : '🤖 AI 帮我写行动'}
                </button>
                {aiModeHint && (
                  <span className="text-[10px] text-[var(--if-muted-soft)]">{aiModeHint}</span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-[11px] text-[var(--if-muted)] whitespace-nowrap">
                📅 <span className="text-[var(--if-accent)] font-medium">{dueDays}天</span>后系统会来提醒你
              </span>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  'btn-primary text-[13px] px-[18px] py-2 whitespace-nowrap flex items-center gap-1.5',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                {submitting ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    认领中…
                  </>
                ) : (
                  <>✍️ 认领</>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {commitments.length === 0 && (
        <div className="text-center py-5 text-xs text-[var(--if-muted-soft)]">
          还没有人认领，先在 👆 的构想中选择一个
        </div>
      )}

      <style>{`
        @keyframes commitSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
        .duration-600 { transition-duration: 600ms; }
      `}</style>
    </div>
  );
}
