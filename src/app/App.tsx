import { useState, useEffect } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { LandingPage } from './components/LandingPage';
import { GameLobby } from './components/GameLobby';
import { RoundOne } from './components/RoundOne';
import { RoundTwo } from './components/RoundTwo';
import { RoundThree } from './components/RoundThree';
import { CommitmentPhase } from './components/CommitmentPhase';
import { GameFinished } from './components/GameFinished';
import { SparkNotes } from './components/SparkNotes';
import { RoundtableMode } from './components/RoundtableMode';
import { ScreenView } from './components/ScreenView';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

export default function App() {
  const [spark, setSpark] = useState(false);
  const [roundtable, setRoundtable] = useState(false);
  const [roundtableSeed, setRoundtableSeed] = useState('');
  const [screenMode, setScreenMode] = useState(false);
  const {
    gameState,
    currentPlayer,
    connectionStatus,
    lastError,
    joinGame,
    createGame,
    updatePlayerReady,
    startGame,
    submitIdea,
    voteForIdea,
    guessAuthor,
    adaptIdea,
    endorseAdaptation,
    challengeIdea,
    defendIdea,
    voteOnDefense,
    nextPhase,
    exportSession,
    createCommitment,
    aiGeneratePrompts,
    aiExpand,
    aiRoundSummary
  } = useGameSocket();

  // Display server errors
  useEffect(() => {
    if (lastError) toast.error(lastError);
  }, [lastError]);

  const [inviteRoomCode, setInviteRoomCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl && !gameState) {
      setInviteRoomCode(roomFromUrl.toUpperCase());
      window.history.replaceState({}, '', window.location.pathname);
    }
    const sparkFromUrl = params.get('spark');
    if (sparkFromUrl === '1' && !gameState) {
      setSpark(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
    const roundtableFromUrl = params.get('roundtable');
    if (roundtableFromUrl === '1' && !gameState) {
      setRoundtable(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [gameState]);

  const handleCreateGame = (playerName: string, problemStatement: string, template: 'full' | 'quick' = 'full') => {
    createGame(playerName, problemStatement, template);
    toast(template === 'quick' ? '快速围炉已创建 — 分享二维码' : '围炉已创建 — 分享二维码');
  };

  const handleJoinGame = (playerName: string, roomCode: string) => {
    joinGame(playerName, roomCode);
    toast('已加入围炉');
  };

  const isHost = gameState ? gameState.hostId === currentPlayer?.id : false;

  const subPageBack =
    'fixed top-4 left-4 z-50 px-3.5 py-2 rounded-xl if-btn-secondary text-xs text-[var(--if-muted)] hover:text-[var(--if-ink-soft)]';

  // 拾念
  if (spark) {
    return (
      <>
        <button type="button" onClick={() => setSpark(false)} className={subPageBack}>
          ← 返回
        </button>
        <SparkNotes
          onStartRoundtable={(topic) => {
            setRoundtableSeed(topic);
            setSpark(false);
            setRoundtable(true);
          }}
        />
      </>
    );
  }

  // 名士围炉
  if (roundtable) {
    return (
      <>
        <button type="button" onClick={() => { setRoundtable(false); setRoundtableSeed(''); }} className={subPageBack}>
          ← 回炉边
        </button>
        <RoundtableMode seedTopic={roundtableSeed} />
      </>
    );
  }

  if (!gameState) {
    return (
      <>
        <LandingPage
          connectionStatus={connectionStatus}
          initialRoomCode={inviteRoomCode}
          onCreateGame={handleCreateGame}
          onJoinGame={(name, code) => {
            handleJoinGame(name, code);
            setInviteRoomCode('');
          }}
          onSpark={() => setSpark(true)}
          onRoundtable={() => setRoundtable(true)}
        />
        <Toaster />
      </>
    );
  }

  const handleStartGame = () => { startGame(); toast('讨论开始'); };
  const handleSubmitIdea = (text: string, card?: number) => { submitIdea(text, card); };
  const handleVoteIdea = (ideaId: string) => { voteForIdea(ideaId); };
  const handleGuessAuthor = (ideaId: string, authorId: string) => { guessAuthor(ideaId, authorId); };
  const handleAdaptIdea = (oid: string, text: string) => { adaptIdea(oid, text); };
  const handleEndorseAdaptation = (id: string) => { endorseAdaptation(id); };
  const handleChallengeIdea = (id: string, reason: string) => { challengeIdea(id, reason); };
  const handleDefendIdea = (id: string, resp: string, ok: boolean) => { defendIdea(id, resp, ok); };
  const handleVoteOnDefense = (id: string, ok: boolean) => { voteOnDefense(id, ok); };
  const handleNextPhase = () => { nextPhase(); };

  // ── Screen Mode: host sees projection view, players use phones ──
  if (screenMode && isHost && currentPlayer) {
    return (
      <>
        <button
          onClick={() => setScreenMode(false)}
          className="fixed top-4 right-4 z-50 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/30 text-sm hover:text-white/50 transition-colors"
        >
          ✕ 退出投屏模式
        </button>
        <ScreenView gameState={gameState} currentPlayer={currentPlayer} isHost={isHost} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      {/* Screen mode indicator */}
      {isHost && !screenMode && (
        <button
          onClick={() => setScreenMode(true)}
          className="fixed top-3 right-3 z-50 px-3 py-1 rounded-full bg-amber-300/10 border border-amber-300/20 text-amber-200/50 text-[10px] hover:bg-amber-300/20 transition-colors"
        >
          📺 投屏模式
        </button>
      )}

      {gameState.phase === 'lobby' && (
        <GameLobby
          gameState={gameState}
          currentPlayer={currentPlayer!}
          onUpdateReady={updatePlayerReady}
          onStartGame={handleStartGame}
          onAiPrompts={(cb: any) => aiGeneratePrompts(gameState.problemStatement, cb)}
          screenMode={screenMode}
          onToggleScreenMode={() => setScreenMode(!screenMode)}
        />
      )}

      {(gameState.phase === 'r1_submit' || gameState.phase === 'r1_guess') && currentPlayer && (
        <RoundOne
          gameState={gameState}
          currentPlayer={currentPlayer}
          onSubmitIdea={handleSubmitIdea}
          onVoteIdea={handleVoteIdea}
          onGuessAuthor={handleGuessAuthor}
          onNextPhase={handleNextPhase}
        />
      )}

      {gameState.phase === 'r2_adapt' && currentPlayer && (
        <RoundTwo
          gameState={gameState}
          currentPlayer={currentPlayer}
          onAdaptIdea={handleAdaptIdea}
          onEndorseAdaptation={handleEndorseAdaptation}
          onNextPhase={handleNextPhase}
        />
      )}

      {gameState.phase === 'r3_challenge' && currentPlayer && (
        <RoundThree
          gameState={gameState}
          currentPlayer={currentPlayer}
          onChallengeIdea={handleChallengeIdea}
          onDefendIdea={handleDefendIdea}
          onVoteOnDefense={handleVoteOnDefense}
          onNextPhase={handleNextPhase}
        />
      )}

      {gameState.phase === 'commitment' && currentPlayer && (
        <CommitmentPhase
          gameState={gameState}
          currentPlayer={currentPlayer}
          onCreateCommitment={(action, ideaId, dueDays, onSuccess) => createCommitment(action, ideaId, dueDays, onSuccess)}
          onNextPhase={handleNextPhase}
        />
      )}

      {gameState.phase === 'finished' && currentPlayer && (
        <GameFinished
          gameState={gameState}
          currentPlayer={currentPlayer}
          onExportSession={exportSession}
          onAiRoundSummary={(roundNum, callback) => aiRoundSummary(roundNum, callback)}
        />
      )}

      <Toaster />
    </>
  );
}
