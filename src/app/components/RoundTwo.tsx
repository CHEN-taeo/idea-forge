import { useState } from 'react';
import { GameState, Player, Idea } from '../types/game';
import { ScrollArea } from './ui/scroll-area';
import { ProgressStepper } from './ProgressStepper';
import { PhaseTimer } from './PhaseTimer';
import { PlayerAvatar } from './PlayerAvatar';
import { IdeaCard } from './IdeaCard';
import { cn } from './ui/utils';

interface RoundTwoProps {
  gameState: GameState;
  currentPlayer: Player;
  onAdaptIdea: (originalIdeaId: string, adaptedText: string) => void;
  onEndorseAdaptation: (ideaId: string) => void;
  onNextPhase: () => void;
}

export function RoundTwo({
  gameState,
  currentPlayer,
  onAdaptIdea,
  onEndorseAdaptation,
  onNextPhase
}: RoundTwoProps) {
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [adaptedText, setAdaptedText] = useState('');

  const isHost = currentPlayer.id === gameState.hostId;
  const roundOneIdeas = gameState.ideas.filter(i => i.round === 1 && i.alive);
  const roundTwoIdeas = gameState.ideas.filter(i => i.round === 2);
  const myAdaptation = roundTwoIdeas.find(i => i.authorId === currentPlayer.id);
  const adaptationsOfMyIdeas = roundTwoIdeas.filter(
    idea => idea.originalAuthorId === currentPlayer.id && !idea.endorsed
  );

  const handleAdapt = () => {
    if (selectedIdea && adaptedText.trim()) {
      onAdaptIdea(selectedIdea.id, adaptedText);
      setSelectedIdea(null);
      setAdaptedText('');
    }
  };

  const topIdeas = [...roundOneIdeas]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, Math.min(5, roundOneIdeas.length));

  return (
    <div className="min-h-screen p-3 perspective-scene">
      <div className="max-w-3xl mx-auto animate-scale-in page-card p-4">

        <ProgressStepper currentPhase="r2_adapt" template={gameState.template} />

        <div className="text-center mb-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/20">第二轮 · 改造</span>
          {!myAdaptation && (
            <PhaseTimer duration={180} onExpire={() => isHost && onNextPhase()} className="ml-auto mt-1" />
          )}
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-3">

          {/* Sidebar */}
          <div className="space-y-2">
            {/* Scoreboard */}
            <div className="glass px-3 py-2.5 rounded-xl">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-1">积分</p>
              <div className="space-y-0.5 stagger-children">
                {Object.values(gameState.players)
                  .sort((a, b) => b.score - a.score)
                  .map((player) => (
                    <div key={player.id} className="flex items-center gap-2 text-[11px]">
                      <PlayerAvatar name={player.name} size="sm" />
                      <span className={cn('flex-1', player.id === currentPlayer.id ? 'text-white/70' : 'text-white/35')}>
                        {player.name}
                      </span>
                      <span className="text-white/20 tabular-nums">{player.score}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Endorsements */}
            {adaptationsOfMyIdeas.length > 0 && (
              <div className="glass px-3 py-2.5 rounded-xl">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-1.5">待认可</p>
                <div className="space-y-1.5">
                  {adaptationsOfMyIdeas.map((idea) => {
                    const adapter = gameState.players[idea.authorId];
                    return (
                      <div key={idea.id} className="space-y-1">
                        <p className="text-[11px] text-white/50 leading-relaxed">{idea.text}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/15 flex items-center gap-1">
                            <PlayerAvatar name={adapter?.name || ''} size="sm" />
                            {adapter?.name}
                          </span>
                          <button
                            onClick={() => onEndorseAdaptation(idea.id)}
                            className="px-2 py-0.5 rounded text-[10px] btn-primary"
                          >
                            认可
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Host control */}
            {isHost && (
              <button
                onClick={onNextPhase}
                className="w-full h-7 rounded-lg btn-primary text-[11px] font-normal flex items-center justify-center gap-1"
              >
                {gameState.template === 'quick' ? '进入承诺仪式' : '下一轮'}
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </div>

          {/* Main */}
          <div className="space-y-2">
            {/* Top ideas selection */}
            {!myAdaptation && (
              <div className="glass px-3 py-2.5 rounded-xl animate-fade-in-up">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-1.5">
                  选择灵感构思进行改造
                </p>
                <div className="space-y-1">
                  {topIdeas.map((idea, index) => {
                    const author = gameState.players[idea.authorId];
                    return (
                      <button
                        key={idea.id}
                        onClick={() => setSelectedIdea(idea)}
                        className={cn(
                          'w-full p-2 text-left rounded-lg transition-all duration-200 card-hover',
                          selectedIdea?.id === idea.id
                            ? 'card-selected text-white/70'
                            : 'text-white/35'
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] text-white/15 tabular-nums">#{index + 1}</span>
                          <span className="text-[10px] text-white/10">{idea.votes}票</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">{idea.text}</p>
                        <p className="text-[10px] text-white/15 mt-0.5 flex items-center gap-1">
                          <PlayerAvatar name={author?.name || ''} size="sm" />
                          {author?.name}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Adapt input */}
                {selectedIdea && (
                  <div className="mt-2 pt-2 border-t border-white/[0.04]">
                    <textarea
                      className="w-full h-16 px-0 py-1 bg-transparent text-xs text-white/80 placeholder:text-white/15 outline-none resize-none"
                      placeholder="你的改造版本…"
                      value={adaptedText}
                      onChange={(e) => setAdaptedText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setSelectedIdea(null); setAdaptedText(''); }}
                        className="px-3 py-1 rounded-lg text-[11px] btn-danger"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleAdapt}
                        disabled={!adaptedText.trim()}
                        className="px-3 py-1 rounded-lg text-xs btn-primary disabled:btn-disabled"
                      >
                        提交改造
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* My adaptation */}
            {myAdaptation && (
              <div className="glass px-3 py-2.5 rounded-xl">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-1">我的改造</p>
                <p className="text-xs text-white/60 leading-relaxed">{myAdaptation.text}</p>
                {myAdaptation.endorsed && (
                  <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/30">
                    <svg className="size-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    已获原作者认可
                  </span>
                )}
              </div>
            )}

            {/* All adaptations */}
            <div className="glass rounded-xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-white/[0.04] flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">
                  所有改造 · {roundTwoIdeas.length}
                </span>
              </div>
              <ScrollArea className="no-nested-scroll">
                <div className="stagger-children">
                  {roundTwoIdeas.map((idea) => {
                    const author = gameState.players[idea.authorId];
                    const originalIdea = gameState.ideas.find(i => i.id === idea.adaptedFrom);
                    return (
                      <div key={idea.id}>
                        <IdeaCard
                          text={idea.text}
                          authorName={author?.name || ''}
                          round={2}
                          inspiration={originalIdea?.text}
                        />
                      </div>
                    );
                  })}
                  {roundTwoIdeas.length === 0 && (
                    <div className="px-3 py-6 text-center text-[11px] text-white/10">
                      暂无改造…
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
