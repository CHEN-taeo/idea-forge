import { useState, useEffect } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { LandingPage } from './components/LandingPage';
import { GameLobby } from './components/GameLobby';
import { RoundOne } from './components/RoundOne';
import { RoundTwo } from './components/RoundTwo';
import { RoundThree } from './components/RoundThree';
import { CommitmentPhase } from './components/CommitmentPhase';
import { GameFinished } from './components/GameFinished';
import { HotSeatApp } from './components/HotSeatApp';
import { SoloMode } from './components/SoloMode';
import { RoundtableMode } from './components/RoundtableMode';
import { ScreenView } from './components/ScreenView';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

export default function App() {
  const [hotSeat, setHotSeat] = useState(false);
  const [solo, setSolo] = useState(false);
  const [roundtable, setRoundtable] = useState(false);
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

  // Auto-join from QR code link (?room=XXXXXX)
  const [qrRoomCode, setQrRoomCode] = useState<string | null>(null);
  const [qrName, setQrName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl && connectionStatus === 'connected' && !gameState) {
      setQrRoomCode(roomFromUrl);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [connectionStatus, gameState]);

  // QR join — show name form instead of prompt()
  if (qrRoomCode && !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-scale-in page-card p-8 text-center">
          <p className="text-5xl mb-4">📱</p>
          <h2 className="text-lg font-light text-white/70 mb-1">加入围炉</h2>
          <p className="text-xs text-white/25 mb-6">房间码 <span className="text-amber-200/60 tracking-[0.15em]">{qrRoomCode}</span></p>
          <input
            className="w-full h-10 px-3 rounded-lg glass-input text-sm text-white/80 placeholder:text-white/15 outline-none mb-3 text-center"
            placeholder="你的名字"
            value={qrName}
            onChange={e => setQrName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && qrName.trim()) { joinGame(qrName.trim(), qrRoomCode); setQrRoomCode(null); } }}
            autoFocus
          />
          <button
            onClick={() => { joinGame(qrName.trim(), qrRoomCode); setQrRoomCode(null); }}
            disabled={!qrName.trim()}
            className="w-full h-10 rounded-xl btn-primary text-sm disabled:btn-disabled"
          >
            加入房间
          </button>
        </div>
        <Toaster />
      </div>
    );
  }

  const handleCreateGame = (playerName: string, problemStatement: string, template: 'full' | 'quick' = 'full') => {
    createGame(playerName, problemStatement, template);
    toast(template === 'quick' ? '快速围炉已创建 — 分享二维码' : '围炉已创建 — 分享二维码');
  };

  const handleJoinGame = (playerName: string, roomCode: string) => {
    joinGame(playerName, roomCode);
    toast('已加入围炉');
  };

  const isHost = gameState ? gameState.hostId === currentPlayer?.id : false;

  // Solo mode — one person, structured thinking
  if (solo) {
    return (
      <>
        <button onClick={() => setSolo(false)}
          className="fixed top-4 left-4 z-50 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/30 text-xs hover:text-white/50 transition-colors">
          ← 返回
        </button>
        <SoloMode />
      </>
    );
  }

  // 围炉群英会 — 和 AI 大佬们圆桌对谈
  if (roundtable) {
    return (
      <>
        <button onClick={() => setRoundtable(false)}
          className="fixed top-4 left-4 z-50 px-3.5 py-2 rounded-xl bg-black/30 backdrop-blur-md border border-white/[0.08] text-white/40 text-xs hover:text-white/65 hover:border-white/[0.14] transition-all">
          ← 离开围炉
        </button>
        <RoundtableMode />
      </>
    );
  }

  // Hot Seat mode
  if (hotSeat) {
    return (
      <>
        <button onClick={() => setHotSeat(false)}
          className="fixed top-4 left-4 z-50 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/30 text-xs hover:text-white/50 transition-colors">
          ← 返回
        </button>
        <HotSeatApp />
      </>
    );
  }

  if (!gameState) {
    return (
      <>
        <LandingPage
          connectionStatus={connectionStatus}
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
          onHotSeat={() => setHotSeat(true)}
          onSolo={() => setSolo(true)}
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
