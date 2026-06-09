import { useState, useCallback, useEffect, useRef } from 'react';
import { Idea, Player, Commitment } from '../types/game';
import { cn } from './ui/utils';

interface CommitmentCeremonyProps {
  ideas: Idea[];
  players: Record<string, Player>;
  currentPlayer: Player;
  serverCommitments?: Commitment[];
  onCreateCommitment: (action: string, ideaId: string, onSuccess: (commitment: Commitment) => void) => void;
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
  const [actionText, setActionText] = useState('');
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

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Focus textarea when form opens
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
    setActionText('');
  }, [myCommitted, claimedIdeaIds]);

  const handleSubmit = useCallback(() => {
    const action = actionText.trim();
    if (!action || action.length < 4) {
      textareaRef.current?.focus();
      return;
    }
    if (!selectedIdeaId) return;

    setSubmitting(true);

    onCreateCommitment(action, selectedIdeaId, (result) => {
      setSubmitting(false);
      if (result?.error) {
        return;
      }
      setSelectedIdeaId(null);
      setActionText('');
    });
  }, [actionText, selectedIdeaId, onCreateCommitment]);

  const selectedIdea = selectedIdeaId ? ideas.find(i => i.id === selectedIdeaId) : null;

  const handleAiSuggest = useCallback(() => {
    if (!selectedIdea || !onAiSuggestAction || aiLoading) return;
    setAiLoading(true);
    setAiModeHint(null);
    onAiSuggestAction(
      selectedIdea.text,
      (action, mode) => {
        setAiLoading(false);
        setActionText(action);
        setAiModeHint(mode === 'ai' ? 'AI 建议（可修改）' : '离线提示（可修改）');
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
      {/* Header */}
      <div className="flex items-baseline justify-between mb-3.5 px-0.5">
        <span className="text-[11px] font-medium tracking-[0.12em] uppercase text-amber-300/55">
          ☯ 承诺仪式
        </span>
        <span className="text-[11px] text-white/25">
          {commitments.length > 0
            ? `${commitments.length} / ${totalPlayers} 人已认领`
            : '认领一件你要做的事'}
        </span>
      </div>

      {/* Idea selection rail */}
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
                'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-amber-300/18 hover:-translate-y-0.5',
                selected && 'bg-amber-300/10 border-amber-300/35 shadow-[0_0_0_1px_rgba(251,191,36,.12),0_4px_16px_rgba(251,191,36,.08)]',
                claimed && 'opacity-40 pointer-events-none'
              )}
            >
              <div className="text-[10px] text-white/25 mb-1.5 flex items-center gap-1">
                <span>⬆</span> {idea.votes}
              </div>
              <p className="text-xs leading-relaxed text-white/70 line-clamp-3">{idea.text}</p>
              <p className="text-[10px] text-white/25 mt-1.5">
                {author?.name || idea.authorId}
              </p>
              {/* Claimed badge */}
              <span
                className={cn(
                  'absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-emerald-400/85 flex items-center justify-center text-[10px] shadow-lg',
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

      {/* Action form */}
      <div
        className={cn(
          'bg-white/[0.03] border border-amber-300/15 rounded-xl overflow-hidden transition-all duration-400 mb-5',
          selectedIdea ? 'max-h-[220px] opacity-100 py-4 px-[18px]' : 'max-h-0 opacity-0 py-0 px-[18px]'
        )}
      >
        {selectedIdea && (
          <>
            <label className="text-[10px] text-white/25 tracking-[0.06em] uppercase mb-2 block">
              针对「{selectedIdea.text.substring(0, 25)}…」，我承诺要做：
            </label>
            <textarea
              ref={textareaRef}
              value={actionText}
              onChange={e => setActionText(e.target.value)}
              placeholder={`具体、可执行的一件事……\n例如：下周五前联系3位潜在用户做访谈`}
              maxLength={200}
              rows={3}
              className="w-full bg-white/[0.03] border border-amber-300/14 rounded-lg text-white/85 text-[13px] leading-relaxed p-2.5 resize-none min-h-[64px] outline-none transition-colors duration-200 placeholder:text-white/20 focus:border-amber-300/30 focus:shadow-[0_0_0_2px_rgba(251,191,36,.06)] mb-2 font-[inherit]"
            />
            {onAiSuggestAction && (
              <div className="flex items-center gap-2 mb-2.5">
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                  className="text-[11px] text-amber-300/55 hover:text-amber-300/85 transition-colors disabled:opacity-30"
                >
                  {aiLoading ? '⏳ AI 思考中…' : '🤖 AI 帮我写行动'}
                </button>
                {aiModeHint && (
                  <span className="text-[10px] text-white/20">{aiModeHint}</span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-[11px] text-white/25 whitespace-nowrap">
                📅 <span className="text-amber-300/50 font-medium">14天</span>后系统会来提醒你
              </span>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  'bg-amber-300/15 border border-amber-300/30 rounded-lg text-amber-200/90 text-[13px] font-[inherit] px-[18px] py-2 cursor-pointer transition-all duration-150 whitespace-nowrap flex items-center gap-1.5',
                  'hover:bg-amber-300/24 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(251,191,36,.12)]',
                  'active:translate-y-0.5 active:shadow-none',
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

      {/* Commitments list — hidden when parent shows team summary */}
      {commitments.length === 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-center py-5 text-xs text-white/20">
            还没有人认领，先在 👆 的构想中选择一个
          </div>
        </div>
      )}

      {/* Keyframe styles */}
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
