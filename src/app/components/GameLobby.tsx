import { useState } from 'react';
import { GameState, Player } from '../types/game';
import { PlayerAvatar } from './PlayerAvatar';
import { cn } from './ui/utils';

interface GameLobbyProps {
  gameState: GameState;
  currentPlayer: Player;
  onStartGame: () => void;
  onUpdateReady: (ready: boolean) => void;
  onAiPrompts?: (callback: (result: any) => void) => void;
  screenMode?: boolean;
  onToggleScreenMode?: () => void;
}

export function GameLobby({ gameState, currentPlayer, onStartGame, onUpdateReady, onAiPrompts, screenMode, onToggleScreenMode }: GameLobbyProps) {
  const isHost = gameState.hostId === currentPlayer.id;
  const ready = gameState.players[currentPlayer.id]?.ready ?? false;
  const [aiPrompts, setAiPrompts] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  const joinUrl = `${window.location.origin}?room=${gameState.roomCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(joinUrl)}`;

  const copyJoinLink = () => {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleReady = () => {
    onUpdateReady(!ready);
  };

  const handleAiPrompts = () => {
    if (!onAiPrompts || aiLoading) return;
    setAiLoading(true);
    onAiPrompts((result: any) => {
      setAiLoading(false);
      if (result?.prompts) setAiPrompts(result.prompts);
    });
  };

  const playerCount = Object.values(gameState.players).length;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className={cn('w-full animate-scale-in page-card p-6', screenMode ? 'max-w-2xl' : 'max-w-sm')}>

        {isHost && (
          <div className="text-center mb-6">
            <p className="text-xs text-white/30 mb-4">
              📺 投屏本页面，其他人用手机加入
            </p>

            {!qrFailed ? (
              <div className="inline-block bg-white rounded-xl p-2 mb-3 shadow-lg">
                <img src={qrUrl} alt="加入围炉二维码"
                  onError={() => setQrFailed(true)}
                  className="size-[140px]" />
              </div>
            ) : (
              <div className="inline-block bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-3">
                <p className="text-[10px] text-white/20 mb-2">二维码加载失败 — 请分享房间码：</p>
              </div>
            )}

            <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 mb-2">房间码</p>
            <p className="text-4xl font-light tracking-[0.2em] text-white/80 mb-2">{gameState.roomCode}</p>

            <div className="flex items-center justify-center gap-2">
              <button onClick={copyJoinLink}
                className="text-xs text-white/25 hover:text-white/50 transition-colors flex items-center gap-1">
                {copied ? '✓ 已复制' : '复制加入链接'}
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
            </div>

            {onToggleScreenMode && (
              <button onClick={onToggleScreenMode}
                className={cn('mt-4 px-4 py-1.5 rounded-lg text-xs transition-colors',
                  screenMode ? 'bg-amber-300/10 border border-amber-300/25 text-amber-200/70' : 'text-white/20 hover:text-white/40')}>
                {screenMode ? '📺 投屏模式已开启' : '📺 投屏模式已关闭'}
              </button>
            )}
          </div>
        )}

        {!isHost && (
          <div className="text-center mb-6">
            <p className="text-lg font-light text-white/70 mb-1">已加入</p>
            <p className="text-xs text-white/25">{gameState.problemStatement}</p>
            <p className="text-[10px] text-white/15 mt-3">房间内有 {playerCount} 人</p>
          </div>
        )}

        <div className="glass mb-4 rounded-xl">
          <div className="pb-1.5 pt-3 px-4 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-normal">讨论问题</span>
            {onAiPrompts && (
              <button onClick={handleAiPrompts} disabled={aiLoading}
                className="text-[10px] text-amber-300/50 hover:text-amber-300/80 transition-colors disabled:opacity-30">
                {aiLoading ? '⏳ …' : '🤖 AI 引导问题'}
              </button>
            )}
          </div>
          <div className="px-4 pb-3">
            <p className="text-sm text-white/60 leading-relaxed">{gameState.problemStatement}</p>
            {aiPrompts && aiPrompts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-1.5">
                {aiPrompts.map((p, i) => (
                  <p key={i} className="text-[11px] text-white/30 leading-relaxed">{p}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="glass mb-5 rounded-xl overflow-hidden">
          <div className="pb-1.5 pt-3 px-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-normal">
              参与者 · {playerCount}
            </span>
          </div>
          <div className="px-4 pb-3">
            <div className="space-y-1">
              {Object.values(gameState.players).map((p) => (
                <div key={p.id} className="flex items-center gap-2 py-0.5 text-xs text-white/45">
                  <span className={cn('size-1.5 rounded-full flex-shrink-0', p.connected ? 'bg-emerald-400/50' : 'bg-white/8')} />
                  <PlayerAvatar name={p.name} size="sm" />
                  <span>{p.name}{p.id === currentPlayer.id ? '（我）' : ''}</span>
                  {p.id === gameState.hostId && <span className="text-[10px] text-amber-300/30 ml-auto">主持</span>}
                  {p.ready && <span className="text-[10px] text-emerald-400/50 ml-auto">已准备</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button onClick={toggleReady}
          className={cn('w-full h-10 mb-2 rounded-xl text-sm font-normal transition-all duration-200',
            ready ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300' : 'glass-light btn-hover')}>
          {ready ? '已准备 ✓' : '点击准备'}
        </button>

        {isHost && (
          <button onClick={onStartGame}
            disabled={!Object.values(gameState.players).every(p => p.ready)}
            className="w-full h-10 rounded-xl btn-primary text-sm font-normal disabled:btn-disabled">
            {!Object.values(gameState.players).every(p => p.ready) ? '等待所有人准备…' : '开始讨论 →'}
          </button>
        )}
        {!isHost && (
          <p className="text-center text-[11px] text-white/15 mt-2">等待主持人开始…</p>
        )}
      </div>
    </div>
  );
}
