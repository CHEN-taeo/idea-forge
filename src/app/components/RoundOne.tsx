import { useState } from 'react';
import { GameState, Player } from '../types/game';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, INSPIRATION_CARDS } from '../data/game-data';
import { ScrollArea } from './ui/scroll-area';
import { ProgressStepper } from './ProgressStepper';
import { PhaseTimer } from './PhaseTimer';
import { PlayerAvatar } from './PlayerAvatar';
import { IdeaCard } from './IdeaCard';
import { cn } from './ui/utils';

interface RoundOneProps {
  gameState: GameState;
  currentPlayer: Player;
  onSubmitIdea: (text: string, inspirationCard?: number) => void;
  onVoteIdea: (ideaId: string) => void;
  onGuessAuthor: (ideaId: string, authorId: string) => void;
  onNextPhase: () => void;
}

export function RoundOne({
  gameState,
  currentPlayer,
  onSubmitIdea,
  onVoteIdea,
  onGuessAuthor,
  onNextPhase
}: RoundOneProps) {
  const [ideaText, setIdeaText] = useState('');
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [guesses, setGuesses] = useState<Record<string, string>>({});

  const isSubmitPhase = gameState.phase === 'r1_submit';
  const isGuessPhase = !isSubmitPhase;
  const isHost = currentPlayer.id === gameState.hostId;
  const roundOneIdeas = gameState.ideas.filter(i => i.round === 1);
  const myIdea = roundOneIdeas.find(i => i.authorId === currentPlayer.id);
  const otherPlayers = Object.values(gameState.players).filter(p => p.id !== currentPlayer.id);
  const allSubmitted = roundOneIdeas.length >= Object.keys(gameState.players).length;

  const handleSubmit = () => {
    if (ideaText.trim() && selectedCard !== null) {
      onSubmitIdea(ideaText, selectedCard);
      setIdeaText('');
      setSelectedCard(null);
    }
  };

  const handleGuess = (ideaId: string, authorId: string) => {
    setGuesses({ ...guesses, [ideaId]: authorId });
    onGuessAuthor(ideaId, authorId);
  };

  const phase = isSubmitPhase ? 'r1_submit' : 'r1_guess';
  const phaseLabel = isSubmitPhase ? '构思' : '竞猜';

  return (
    <div className="min-h-screen p-3 perspective-scene">
      <div className="max-w-3xl mx-auto animate-scale-in page-card p-4">

        <ProgressStepper currentPhase={phase} template={gameState.template} />

        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/20">
            第一轮 · {phaseLabel}
          </span>
          {isSubmitPhase && !myIdea && (
            <PhaseTimer duration={120} onExpire={() => isHost && onNextPhase()} className="ml-auto" />
          )}
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-3">

          {/* Sidebar */}
          <div className="space-y-2">
            {/* Role */}
            <div className="glass px-3 py-2.5 rounded-xl">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-1">角色</p>
              <p className="text-xs text-white/60">{currentPlayer.role ? ROLE_LABELS[currentPlayer.role] : ''}</p>
              {currentPlayer.role && ROLE_DESCRIPTIONS[currentPlayer.role] && (
                <p className="text-[11px] text-white/25 mt-0.5 leading-relaxed">
                  {ROLE_DESCRIPTIONS[currentPlayer.role]}
                </p>
              )}
            </div>

            {/* Inspiration */}
            {isSubmitPhase && (
              <div className="glass px-3 py-2.5 rounded-xl">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-1.5">灵感卡</p>
                <div className="space-y-1">
                  {currentPlayer.inspirationCards.map((cardIndex) => (
                    <button
                      key={cardIndex}
                      onClick={() => setSelectedCard(cardIndex)}
                      className={cn(
                        'w-full p-2 text-left rounded-lg text-[11px] leading-relaxed transition-all duration-200 card-hover',
                        selectedCard === cardIndex
                          ? 'card-selected text-white/80'
                          : 'text-white/35'
                      )}
                    >
                      {INSPIRATION_CARDS[cardIndex]}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            {/* Host control */}
            {isHost && allSubmitted && (
              <button
                onClick={onNextPhase}
                className="w-full h-7 rounded-lg btn-primary text-[11px] font-normal flex items-center justify-center gap-1"
              >
                {isSubmitPhase ? '开始竞猜' : '下一轮'}
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </div>

          {/* Main */}
          <div className="space-y-2">

            {/* Submit */}
            {isSubmitPhase && !myIdea && (
              <div className="glass px-3 py-2.5 rounded-xl animate-fade-in-up">
                <textarea
                  className="w-full h-16 px-0 py-1 bg-transparent text-xs text-white/80 placeholder:text-white/15 outline-none resize-none"
                  placeholder="写下你的构想…"
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-white/15">
                    {selectedCard !== null ? '已选择灵感卡' : '请先选择灵感卡'}
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={!ideaText.trim() || selectedCard === null}
                    className="px-3 py-1 rounded-lg text-xs btn-primary disabled:btn-disabled"
                  >
                    提交
                  </button>
                </div>
              </div>
            )}

            {/* Submitted */}
            {isSubmitPhase && myIdea && (
              <div className="glass px-3 py-2.5 rounded-xl">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-1">我的构思</p>
                <p className="text-xs text-white/60 leading-relaxed">{myIdea.text}</p>
              </div>
            )}

            {/* Ideas list */}
            <div className="glass rounded-xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-white/[0.04] flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">
                  所有构思 · {roundOneIdeas.length}
                </span>
              </div>
              <ScrollArea className="no-nested-scroll">
                <div className="stagger-children">
                  {roundOneIdeas.map((idea, index) => {
                    const isMyIdea = idea.authorId === currentPlayer.id;
                    return (
                      <div key={idea.id}>
                        <IdeaCard
                          index={index + 1}
                          text={idea.text}
                          authorName={gameState.players[idea.authorId]?.name || ''}
                          votes={idea.votes}
                          hideAuthor={isGuessPhase}
                          inspiration={idea.inspirationCard !== undefined ? INSPIRATION_CARDS[idea.inspirationCard] : undefined}
                        >
                          {isGuessPhase && !isMyIdea && (
                            <button
                              onClick={() => onVoteIdea(idea.id)}
                              className={cn(
                                'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-all duration-200 flex-shrink-0',
                                idea.votes > 0
                                  ? 'bg-white/[0.04] text-white/15'
                                  : 'bg-white/[0.04] text-white/30 hover:bg-white/8 hover:text-white/50'
                              )}
                            >
                              <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z" fill="currentColor" />
                              </svg>
                              {idea.votes}
                            </button>
                          )}
                        </IdeaCard>

                        {/* Guessing */}
                        {isGuessPhase && !isMyIdea && (
                          <div className="px-3 pb-2 flex flex-wrap gap-1">
                            {otherPlayers.map((player) => (
                              <button
                                key={player.id}
                                onClick={() => handleGuess(idea.id, player.id)}
                                className={cn(
                                  'px-2 py-0.5 rounded text-[10px] transition-all duration-200',
                                  guesses[idea.id] === player.id
                                    ? 'bg-white/8 text-white/60'
                                    : 'bg-white/[0.02] text-white/20 hover:bg-white/5 hover:text-white/35'
                                )}
                              >
                                {player.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
