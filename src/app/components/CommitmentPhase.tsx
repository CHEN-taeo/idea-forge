import { GameState, Player, Commitment } from '../types/game';
import { ProgressStepper } from './ProgressStepper';
import { CommitmentCeremony } from './CommitmentCeremony';
import { PlayerAvatar } from './PlayerAvatar';
import { fetchSmartAction } from '../lib/aiClient';

interface CommitmentPhaseProps {
  gameState: GameState;
  currentPlayer: Player;
  onCreateCommitment: (action: string, ideaId: string, onSuccess: (c: Commitment | { error?: string }) => void) => void;
  onNextPhase: () => void;
}

export function CommitmentPhase({
  gameState,
  currentPlayer,
  onCreateCommitment,
  onNextPhase
}: CommitmentPhaseProps) {
  const isHost = currentPlayer.id === gameState.hostId;
  const commitments = gameState.commitments || [];
  const totalPlayers = Object.keys(gameState.players).length;
  const survivingCount = gameState.ideas.filter(i => i.alive).length;

  return (
    <div className="min-h-screen p-3 perspective-scene">
      <div className="max-w-xl mx-auto animate-scale-in page-card p-4">
        <ProgressStepper currentPhase="commitment" template={gameState.template} />

        <div className="text-center mb-4 pt-1">
          <span className="text-[10px] uppercase tracking-[0.25em] text-amber-300/40">
            决策时刻
          </span>
          <h2 className="text-lg font-light text-white/75 mt-1">认领一件你要负责的事</h2>
          <p className="text-xs text-white/25 mt-1 leading-relaxed px-2">
            {gameState.problemStatement}
          </p>
          <p className="text-[10px] text-white/15 mt-2">
            {survivingCount} 个存活构想 · {commitments.length}/{totalPlayers} 人已认领
          </p>
        </div>

        <CommitmentCeremony
          ideas={gameState.ideas}
          players={gameState.players}
          currentPlayer={currentPlayer}
          serverCommitments={commitments}
          onCreateCommitment={onCreateCommitment}
          onAiSuggestAction={(ideaText, onResult, onError) => {
            fetchSmartAction(ideaText, gameState.problemStatement, currentPlayer.name)
              .then(({ action, mode }) => onResult(action, mode))
              .catch((err) => onError(err.message));
          }}
        />

        {isHost && (
          <button
            onClick={onNextPhase}
            className="w-full mt-4 h-10 rounded-xl glass-light text-xs text-white/40 hover:text-white/60 transition-colors flex items-center justify-center gap-1.5"
          >
            查看会议总结
            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        {!isHost && (
          <p className="text-center text-[10px] text-white/15 mt-4">
            等待主持人结束承诺环节…
          </p>
        )}

        {commitments.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/[0.04]">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/15 mb-2">团队承诺一览</p>
            <div className="space-y-1.5">
              {commitments.map((c) => (
                <div key={c.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02]">
                  <PlayerAvatar name={c.playerName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-white/30">{c.playerName}</p>
                    <p className="text-[11px] text-white/55 leading-relaxed">{c.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
