import { useState, useEffect } from 'react';
import { GameState, Player } from '../types/game';
import { ScrollArea } from './ui/scroll-area';
import { ProgressStepper } from './ProgressStepper';
import { PlayerAvatar } from './PlayerAvatar';
import { IdeaCard } from './IdeaCard';
import { CommitmentCeremony } from './CommitmentCeremony';
import { cn } from './ui/utils';
import confetti from 'canvas-confetti';

interface GameFinishedProps {
  gameState: GameState;
  currentPlayer: Player;
  onExportSession: () => string;
  onCreateCommitment: (action: string, ideaId: string, onSuccess: (c: any) => void) => void;
  onAiRoundSummary?: (roundNum: number, callback: (result: any) => void) => void;
}

export function GameFinished({
  gameState,
  currentPlayer,
  onExportSession,
  onCreateCommitment,
  onAiRoundSummary
}: GameFinishedProps) {
  const sortedPlayers = Object.values(gameState.players).sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const survivingIdeas = gameState.ideas.filter(i => i.alive);
  const mvpIdea = [...survivingIdeas].sort((a, b) => b.votes - a.votes)[0];
  const podiumColors = ['glass-gold', 'glass-silver', 'glass-bronze'];

  // Challenge-resilient ideas: challenged AND (successfully defended OR defense accepted)
  const battleTestedIdeas = survivingIdeas.filter(
    i => i.challengedBy && (i.defenseAccepted || (i.defenseVotes && Object.values(i.defenseVotes).filter(Boolean).length > 0))
  );

  // Round bests
  const roundOneIdeas = gameState.ideas.filter(i => i.round === 1 && i.alive);
  const r1Best = [...roundOneIdeas].sort((a, b) => b.votes - a.votes)[0];
  const roundTwoIdeas = gameState.ideas.filter(i => i.round === 2);
  const r2Best = [...roundTwoIdeas].sort((a, b) => (b.endorsed ? 1 : 0) - (a.endorsed ? 1 : 0))[0];

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  const handleAiSummary = () => {
    if (!onAiRoundSummary || aiSummaryLoading) return;
    setAiSummaryLoading(true);
    onAiRoundSummary(1, (result) => {
      setAiSummaryLoading(false);
      if (result?.summary) setAiSummary(result.summary);
    });
  };

  const handlePlayAgain = () => {
    if (confirm('Return to lobby? This will take everyone back to the lobby.')) {
      window.location.reload();
    }
  };

  useEffect(() => {
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.5 },
      colors: ['#5eb3e6', '#e59bb3', '#7cd992', '#f0c674', '#fbbf24', '#ffffff']
    });
  }, []);

  const handleExport = () => {
    const report = onExportSession();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idea-forge-session-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-3 perspective-scene">
      <div className="max-w-xl mx-auto animate-scale-in page-card p-4">

        <ProgressStepper currentPhase="finished" />

        {/* ════════════════════════════════════════════════════════
            PRIMARY: Commitment Ceremony — the real output of the session
            ════════════════════════════════════════════════════════ */}
        <div className="mb-6 pt-2">
          <CommitmentCeremony
            ideas={gameState.ideas}
            players={gameState.players}
            currentPlayer={currentPlayer}
            onCreateCommitment={onCreateCommitment}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.04] mb-5" />

        {/* ════════════════════════════════════════════════════════
            SECONDARY: Results recap — scoreboard, MVP, survivors
            ════════════════════════════════════════════════════════ */}
        <div className="text-center mb-5">
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/20 mb-2 block">本次会议成果</span>
          <div className="flex items-center justify-center gap-2 mb-1">
            <PlayerAvatar name={winner.name} size="lg" />
          </div>
          <p className="text-lg font-light text-white/70">{winner.name}</p>
          <p className="text-2xl font-light text-white/40 mt-0.5 animate-score-pop">{winner.score}</p>
        </div>

        {/* Podium Standings */}
        <div className="rounded-xl overflow-hidden mb-2.5">
          {sortedPlayers.slice(0, 3).map((player, index) => (
            <div
              key={player.id}
              className={cn(
                'px-3 py-2.5 flex items-center justify-between',
                podiumColors[index] || 'glass'
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-xs tabular-nums w-5',
                  index === 0 ? 'text-amber-400/60' : index === 1 ? 'text-slate-400/50' : 'text-orange-400/40'
                )}>
                  {index + 1}
                </span>
                <PlayerAvatar name={player.name} size="sm" />
                <span className={cn(
                  'text-xs',
                  index === 0 ? 'text-white/70' : 'text-white/40'
                )}>
                  {player.name}
                </span>
              </div>
              <span className={cn(
                'text-xs tabular-nums animate-score-pop',
                index === 0 ? 'text-white/50' : 'text-white/20'
              )}>
                {player.score}
              </span>
            </div>
          ))}
        </div>

        {/* Rest of standings */}
        {sortedPlayers.length > 3 && (
          <div className="glass rounded-xl overflow-hidden mb-2.5">
            <div className="divide-y divide-white/[0.03] stagger-children">
              {sortedPlayers.slice(3).map((player, index) => (
                <div key={player.id} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/12 w-5">{index + 4}</span>
                    <PlayerAvatar name={player.name} size="sm" />
                    <span className="text-xs text-white/35">{player.name}</span>
                  </div>
                  <span className="text-[11px] text-white/15">{player.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MVP */}
        {mvpIdea && (
          <div className="glass rounded-xl overflow-hidden mb-2.5">
            <div className="px-3 py-2.5 border-b border-white/[0.04]">
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">最佳构想</span>
            </div>
            <div className="px-3 py-2.5">
              <p className="text-xs text-white/60 leading-relaxed">{mvpIdea.text}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] text-white/20 flex items-center gap-1">
                  <PlayerAvatar name={gameState.players[mvpIdea.authorId]?.name || ''} size="sm" />
                  {gameState.players[mvpIdea.authorId]?.name}
                </span>
                <span className="text-[10px] text-white/12">{mvpIdea.votes} 票</span>
              </div>
            </div>
          </div>
        )}

        {/* Survivors */}
        <div className="glass rounded-xl overflow-hidden mb-2.5">
          <div className="px-3 py-2.5 border-b border-white/[0.04]">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">
              存活的构想 · {survivingIdeas.length}
            </span>
          </div>
          <ScrollArea className="no-nested-scroll">
            <div className="stagger-children">
              {survivingIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  text={idea.text}
                  authorName={gameState.players[idea.authorId]?.name || ''}
                  votes={idea.votes}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Stats */}
        <div className="glass rounded-xl mb-2.5">
          <div className="grid grid-cols-5 divide-x divide-white/[0.03]">
            {[
              { label: '总计', value: gameState.ideas.length },
              { label: '存活', value: survivingIdeas.length },
              { label: '改造', value: gameState.ideas.filter(i => i.round === 2).length },
              { label: '质询', value: gameState.challenges.length },
              { label: '经考验', value: battleTestedIdeas.length },
            ].map((stat, i) => (
              <div key={i} className="px-2 py-2.5 text-center">
                <p className="text-lg font-light text-white/40">{stat.value}</p>
                <p className="text-[8px] text-white/12">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Round Bests */}
        {(r1Best || r2Best) && (
          <div className="glass rounded-xl overflow-hidden mb-2.5">
            <div className="px-3 py-2.5 border-b border-white/[0.04]">
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">每轮最佳</span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {r1Best && (
                <div className="px-3 py-2">
                  <span className="text-[9px] text-white/12 mb-1 block">R1 · 最高票数</span>
                  <p className="text-[11px] text-white/50 leading-relaxed">{r1Best.text}</p>
                  <span className="text-[10px] text-white/15">{r1Best.votes} 票</span>
                </div>
              )}
              {r2Best && (
                <div className="px-3 py-2">
                  <span className="text-[9px] text-white/12 mb-1 block">R2 · 最佳改造</span>
                  <p className="text-[11px] text-white/50 leading-relaxed">{r2Best.text}</p>
                  <span className="text-[10px] text-white/15">
                    {r2Best.endorsed ? '已获原作者认可' : `${r2Best.votes} 票`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Round Analysis */}
        {onAiRoundSummary && (
          <div className="glass rounded-xl overflow-hidden mb-2.5">
            <div className="px-3 py-2.5 border-b border-white/[0.04] flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">AI 分析</span>
              {!aiSummary && (
                <button
                  onClick={handleAiSummary}
                  disabled={aiSummaryLoading}
                  className="text-[10px] text-amber-300/50 hover:text-amber-300/80 transition-colors disabled:opacity-30"
                >
                  {aiSummaryLoading ? '⏳ 分析中…' : '🤖 生成分析'}
                </button>
              )}
            </div>
            {aiSummary && (
              <div className="px-3 py-3">
                <p className="text-[11px] text-white/45 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mb-2.5">
          <button
            onClick={handlePlayAgain}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl glass-light text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
            返回大厅
          </button>
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl btn-primary text-xs"
          >
            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出会话报告
          </button>
        </div>
      </div>
    </div>
  );
}
