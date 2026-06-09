import { useState, useEffect } from 'react';
import { GameState, Player } from '../types/game';
import { ScrollArea } from './ui/scroll-area';
import { ProgressStepper } from './ProgressStepper';
import { PhaseTimer } from './PhaseTimer';
import { PlayerAvatar } from './PlayerAvatar';
import { IdeaCard } from './IdeaCard';
import { useIsMobile } from './ui/use-mobile';
import { cn } from './ui/utils';

type MobileTab = 'ideas' | 'defend' | 'vote';

interface RoundThreeProps {
  gameState: GameState;
  currentPlayer: Player;
  onChallengeIdea: (ideaId: string, reason: string) => void;
  onDefendIdea: (ideaId: string, response: string, accepted: boolean) => void;
  onVoteOnDefense: (ideaId: string, successful: boolean) => void;
  onNextPhase: () => void;
}

export function RoundThree({
  gameState,
  currentPlayer,
  onChallengeIdea,
  onDefendIdea,
  onVoteOnDefense,
  onNextPhase
}: RoundThreeProps) {
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>('ideas');
  const [challengingIdea, setChallengingIdea] = useState<string | null>(null);
  const [challengeReason, setChallengeReason] = useState('');
  const [defendingIdea, setDefendingIdea] = useState<string | null>(null);
  const [defenseResponse, setDefenseResponse] = useState('');
  const [defenseType, setDefenseType] = useState<'refute' | 'accept'>('refute');

  const isHost = currentPlayer.id === gameState.hostId;
  const allIdeas = gameState.ideas.filter(i => i.alive);
  const myIdeasUnderChallenge = allIdeas.filter(
    i => i.authorId === currentPlayer.id && i.challengedBy && !i.defenseResponse
  );
  const defensesToVote = allIdeas.filter(
    i => i.defenseResponse &&
    i.authorId !== currentPlayer.id &&
    i.challengedBy !== currentPlayer.id &&
    (!i.defenseVotes || !(currentPlayer.id in i.defenseVotes))
  );

  useEffect(() => {
    if (!isMobile) return;
    if (myIdeasUnderChallenge.length > 0) setMobileTab('defend');
    else if (defensesToVote.length > 0) setMobileTab('vote');
  }, [isMobile, myIdeasUnderChallenge.length, defensesToVote.length]);

  const handleChallenge = (ideaId: string) => {
    if (challengeReason.trim()) {
      onChallengeIdea(ideaId, challengeReason);
      setChallengingIdea(null);
      setChallengeReason('');
    }
  };

  const handleDefense = (ideaId: string) => {
    if (defenseResponse.trim()) {
      onDefendIdea(ideaId, defenseResponse, defenseType === 'accept');
      setDefendingIdea(null);
      setDefenseResponse('');
    }
  };

  const scoreboard = (
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
  );

  const defendPanel = myIdeasUnderChallenge.length > 0 ? (
    <div className="glass px-3 py-2.5 rounded-xl">
      <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-1.5">捍卫你的构思</p>
      <div className="space-y-2">
        {myIdeasUnderChallenge.map((idea) => {
          const challenge = gameState.challenges.find(c => c.ideaId === idea.id);
          const isDefending = defendingIdea === idea.id;
          return (
            <div key={idea.id} className="space-y-1.5">
              <p className="text-[11px] text-white/50 leading-relaxed">{idea.text}</p>
              {challenge && (
                <p className="text-[10px] text-white/20 px-2 py-1 rounded bg-white/[0.02]">
                  质询: {challenge.reason}
                </p>
              )}
              {isDefending ? (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setDefenseType('refute')}
                      className={cn(
                        'flex-1 px-2 py-1 rounded text-[9px] transition-all',
                        defenseType === 'refute' ? 'btn-primary' : 'bg-white/[0.02] text-white/20'
                      )}
                    >
                      反驳
                    </button>
                    <button
                      onClick={() => setDefenseType('accept')}
                      className={cn(
                        'flex-1 px-2 py-1 rounded text-[9px] transition-all',
                        defenseType === 'accept' ? 'btn-primary' : 'bg-white/[0.02] text-white/20'
                      )}
                    >
                      接受改进
                    </button>
                  </div>
                  <textarea
                    className="w-full h-14 px-2 py-1 rounded bg-white/[0.02] text-[10px] text-white/60 placeholder:text-white/10 outline-none resize-none"
                    placeholder={defenseType === 'refute' ? '回应质询…' : '如何改进…'}
                    value={defenseResponse}
                    onChange={(e) => setDefenseResponse(e.target.value)}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => setDefendingIdea(null)}
                      className="flex-1 px-2 py-1 rounded text-[10px] btn-danger"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleDefense(idea.id)}
                      disabled={!defenseResponse.trim()}
                      className="flex-1 px-2 py-1 rounded text-[10px] btn-primary disabled:btn-disabled"
                    >
                      提交
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setDefendingIdea(idea.id)}
                  className="w-full px-2 py-1 rounded text-[10px] btn-primary"
                >
                  回应质询
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  const votePanel = defensesToVote.length > 0 ? (
    <div className="glass px-3 py-2.5 rounded-xl">
      <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-1.5">表决</p>
      <div className="space-y-1.5">
        {defensesToVote.map((idea) => {
          const challenge = gameState.challenges.find(c => c.ideaId === idea.id);
          return (
            <div key={idea.id} className="space-y-1">
              <p className="text-[11px] text-white/50 leading-relaxed">{idea.text}</p>
              {challenge && (
                <p className="text-[10px] text-white/15">质询: {challenge.reason}</p>
              )}
              <p className="text-[10px] text-white/20">回应: {idea.defenseResponse}</p>
              <div className="flex gap-1">
                <button
                  onClick={() => onVoteOnDefense(idea.id, true)}
                  className="flex-1 px-2 py-1 rounded text-[10px] btn-primary"
                >
                  辩护成功
                </button>
                <button
                  onClick={() => onVoteOnDefense(idea.id, false)}
                  className="flex-1 px-2 py-1 rounded text-[10px] btn-danger"
                >
                  辩护失败
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  const hostButton = isHost ? (
    <button
      onClick={onNextPhase}
      className="w-full h-9 rounded-lg btn-primary text-[11px] font-normal flex items-center justify-center gap-1"
    >
      进入承诺仪式
      <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  ) : null;

  const ideasPanel = (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-3 py-2.5 border-b border-white/[0.04] flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">
          所有构想 · {allIdeas.length}
        </span>
      </div>
      <ScrollArea className={cn('no-nested-scroll', isMobile ? 'max-h-[55vh]' : undefined)}>
        <div className="stagger-children">
          {allIdeas.map((idea) => {
            const author = gameState.players[idea.authorId];
            const challenge = gameState.challenges.find(c => c.ideaId === idea.id);
            const isChallenged = !!idea.challengedBy;
            const hasDefense = !!idea.defenseResponse;
            const canChallenge = !isChallenged && idea.authorId !== currentPlayer.id;
            const isChallenging = challengingIdea === idea.id;

            return (
              <div key={idea.id}>
                <IdeaCard
                  text={idea.text}
                  authorName={author?.name || ''}
                  round={idea.round}
                  challenged={isChallenged}
                >
                  {canChallenge && !isChallenging && (
                    <button
                      onClick={() => setChallengingIdea(idea.id)}
                      className="px-2 py-0.5 rounded text-[10px] btn-danger flex-shrink-0"
                    >
                      质询
                    </button>
                  )}
                </IdeaCard>

                {isChallenging && (
                  <div className="px-3 pb-2 space-y-1.5">
                    <textarea
                      className="w-full h-14 px-2 py-1 rounded bg-white/[0.02] text-[10px] text-white/60 placeholder:text-white/10 outline-none resize-none"
                      placeholder="这个构想的致命缺陷是…"
                      value={challengeReason}
                      onChange={(e) => setChallengeReason(e.target.value)}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setChallengingIdea(null); setChallengeReason(''); }}
                        className="flex-1 px-2 py-1 rounded text-[10px] btn-danger"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleChallenge(idea.id)}
                        disabled={!challengeReason.trim()}
                        className="flex-1 px-2 py-1 rounded text-[10px] btn-primary disabled:btn-disabled"
                      >
                        提交质询
                      </button>
                    </div>
                  </div>
                )}

                {isChallenged && challenge && (
                  <div className="px-3 pb-2 space-y-1">
                    <div className="flex items-start gap-1.5 px-2 py-1 rounded bg-white/[0.02]">
                      <div>
                        <p className="text-[10px] text-white/20">{challenge.challengerName} 质询:</p>
                        <p className="text-[10px] text-white/30">{challenge.reason}</p>
                      </div>
                    </div>
                    {hasDefense && (
                      <div className="flex items-start gap-1.5 px-2 py-1 rounded bg-white/[0.02]">
                        <div>
                          <p className="text-[10px] text-white/30">{idea.defenseResponse}</p>
                          {idea.defenseAccepted && (
                            <span className="text-[9px] text-white/15">已接受并改进</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  const mobileTabs: { id: MobileTab; label: string; badge?: number }[] = [
    { id: 'ideas', label: '质询' },
    { id: 'defend', label: '答辩', badge: myIdeasUnderChallenge.length || undefined },
    { id: 'vote', label: '表决', badge: defensesToVote.length || undefined },
  ];

  return (
    <div className="min-h-screen p-3 perspective-scene">
      <div className="max-w-3xl mx-auto animate-scale-in page-card p-4">

        <ProgressStepper currentPhase="r3_challenge" template={gameState.template} />

        <div className="text-center mb-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/20">第三轮 · 挑战</span>
          <PhaseTimer duration={300} onExpire={() => isHost && onNextPhase()} className="ml-auto mt-1" />
        </div>

        {isMobile && (
          <div className="flex gap-1 mb-3 p-1 rounded-xl bg-white/[0.03] border border-white/[0.04]">
            {mobileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={cn(
                  'flex-1 relative py-2 rounded-lg text-[11px] transition-colors',
                  mobileTab === tab.id
                    ? 'bg-amber-300/12 text-amber-200/80 border border-amber-300/20'
                    : 'text-white/30'
                )}
              >
                {tab.label}
                {tab.badge ? (
                  <span className="absolute -top-1 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-400/80 text-[9px] text-black/80 flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}

        {isMobile ? (
          <div className="space-y-2">
            {mobileTab === 'ideas' && ideasPanel}
            {mobileTab === 'defend' && (defendPanel || (
              <div className="glass rounded-xl px-3 py-6 text-center text-xs text-white/20">
                暂无需要答辩的构思
              </div>
            ))}
            {mobileTab === 'vote' && (votePanel || (
              <div className="glass rounded-xl px-3 py-6 text-center text-xs text-white/20">
                暂无待表决的答辩
              </div>
            ))}
            {scoreboard}
            {hostButton}
          </div>
        ) : (
          <div className="grid lg:grid-cols-[220px_1fr] gap-3">
            <div className="space-y-2">
              {scoreboard}
              {defendPanel}
              {votePanel}
              {hostButton}
            </div>
            {ideasPanel}
          </div>
        )}
      </div>
    </div>
  );
}
