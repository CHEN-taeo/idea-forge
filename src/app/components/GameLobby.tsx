import { useState } from 'react';
import { GameState, Player } from '../types/game';
import { PlayerAvatar } from './PlayerAvatar';
import { cn } from './ui/utils';
import { brand } from '../lib/brand';

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
  const allReady = Object.values(gameState.players).every(p => p.ready);

  return (
    <div className="if-page min-h-screen flex items-center justify-center p-6">
      <div className={cn('w-full animate-scale-in if-card p-6', screenMode ? 'max-w-2xl' : 'max-w-sm')}>

        {isHost && (
          <div className="text-center mb-6">
            <p className="text-xs text-[var(--if-muted)] mb-4">
              📺 投屏本页，其他人扫码 {brand.roomEntryTitle}
            </p>

            {!qrFailed ? (
              <div className="inline-block bg-white rounded-xl p-2 mb-3 shadow-sm border border-[var(--if-line)]">
                <img src={qrUrl} alt="加入围炉二维码"
                  onError={() => setQrFailed(true)}
                  className="size-[140px]" />
              </div>
            ) : (
              <div className="inline-block if-card--flat rounded-xl p-4 mb-3">
                <p className="text-[10px] text-[var(--if-muted)] mb-2">二维码加载失败 — 请分享房间码</p>
              </div>
            )}

            <p className="if-eyebrow mb-2">房间码</p>
            <p className="text-4xl font-light tracking-[0.2em] text-[var(--if-ink)] font-display mb-2">{gameState.roomCode}</p>

            <button type="button" onClick={copyJoinLink}
              className="text-xs text-[var(--if-accent)] hover:opacity-80 transition-colors inline-flex items-center gap-1">
              {copied ? '✓ 已复制' : '复制加入链接'}
            </button>

            {onToggleScreenMode && (
              <button type="button" onClick={onToggleScreenMode}
                className={cn('mt-4 px-4 py-1.5 rounded-lg text-xs transition-colors if-btn-secondary',
                  screenMode && 'border-[var(--if-accent-border)] text-[var(--if-accent)]')}>
                {screenMode ? '📺 投屏模式已开启' : '📺 开启投屏模式'}
              </button>
            )}
          </div>
        )}

        {!isHost && (
          <div className="text-center mb-6">
            <p className="text-lg text-[var(--if-ink-soft)] mb-1">已入席</p>
            <p className="text-xs text-[var(--if-muted)]">{gameState.problemStatement}</p>
            <p className="text-[10px] text-[var(--if-muted-soft)] mt-3">房间内有 {playerCount} 人</p>
          </div>
        )}

        <div className="if-card--flat mb-4 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="if-field-label mb-0">{brand.roomTopicLabel}</span>
            {onAiPrompts && (
              <button type="button" onClick={handleAiPrompts} disabled={aiLoading}
                className="text-[10px] text-[var(--if-accent)] hover:opacity-80 disabled:opacity-30">
                {aiLoading ? '⏳ …' : '🤖 炉边引导问题'}
              </button>
            )}
          </div>
          <p className="text-sm text-[var(--if-ink-soft)] leading-relaxed">{gameState.problemStatement}</p>
          {aiPrompts && aiPrompts.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--if-line)] space-y-1.5">
              {aiPrompts.map((p, i) => (
                <p key={i} className="text-[11px] text-[var(--if-muted)] leading-relaxed">{p}</p>
              ))}
            </div>
          )}
        </div>

        <div className="if-card--flat mb-5 rounded-xl p-4">
          <p className="if-field-label">参与者 · {playerCount}</p>
          <div className="space-y-1 mt-2">
            {Object.values(gameState.players).map((p) => (
              <div key={p.id} className="flex items-center gap-2 py-0.5 text-xs text-[var(--if-ink-soft)]">
                <span className={cn('size-1.5 rounded-full flex-shrink-0', p.connected ? 'bg-[var(--if-success)]' : 'bg-[var(--if-line)]')} />
                <PlayerAvatar name={p.name} size="sm" />
                <span>{p.name}{p.id === currentPlayer.id ? '（我）' : ''}</span>
                {p.id === gameState.hostId && <span className="text-[10px] text-[var(--if-accent)] ml-auto">主持</span>}
                {p.ready && <span className="text-[10px] text-[var(--if-success)] ml-auto">已准备</span>}
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={toggleReady}
          className={cn('w-full h-10 mb-2 rounded-xl text-sm font-normal transition-all duration-200',
            ready
              ? 'bg-[rgba(45,106,79,0.1)] border border-[rgba(45,106,79,0.25)] text-[var(--if-success)]'
              : 'if-btn-secondary text-[var(--if-muted)]')}>
          {ready ? '已准备 ✓' : '点击准备'}
        </button>

        {isHost && (
          <button type="button" onClick={onStartGame}
            disabled={!allReady}
            className="w-full h-10 rounded-xl btn-primary text-sm font-normal disabled:btn-disabled">
            {!allReady ? '等待所有人准备…' : '开始讨论 →'}
          </button>
        )}
        {!isHost && (
          <p className="text-center text-[11px] text-[var(--if-muted-soft)] mt-2">等待主持人开始…</p>
        )}
      </div>
    </div>
  );
}
