import { useState, useEffect } from 'react';
import { brand } from '../lib/brand';

interface LandingPageProps {
  connectionStatus: string;
  initialRoomCode?: string;
  onCreateGame: (name: string, problem: string, template: 'full' | 'quick') => void;
  onJoinGame: (name: string, roomCode: string) => void;
  onHotSeat: () => void;
  onRoundtable: () => void;
  onSpark: () => void;
}

export function LandingPage({
  connectionStatus,
  initialRoomCode = '',
  onCreateGame,
  onJoinGame,
  onHotSeat,
  onRoundtable,
  onSpark,
}: LandingPageProps) {
  const [showRoom, setShowRoom] = useState(!!initialRoomCode);
  const [showMore, setShowMore] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState(initialRoomCode.toUpperCase());
  const [problemStatement, setProblemStatement] = useState('');
  const [template, setTemplate] = useState<'full' | 'quick'>('quick');

  const connected = connectionStatus === 'connected';
  const connecting = connectionStatus === 'connecting';
  const isJoining = roomCode.trim().length > 0;

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase());
      setShowRoom(true);
    }
  }, [initialRoomCode]);

  const handleEnterRoom = () => {
    if (!playerName.trim()) return;
    if (isJoining) {
      onJoinGame(playerName.trim(), roomCode.trim());
    } else {
      onCreateGame(playerName.trim(), problemStatement.trim(), template);
    }
  };

  if (showRoom) {
    return (
      <div className="if-page px-4 py-8 max-w-md mx-auto animate-fade-in-up">
        <button
          type="button"
          onClick={() => setShowRoom(false)}
          className="text-sm text-[var(--if-muted)] hover:text-[var(--if-ink-soft)] mb-6"
        >
          ← 返回
        </button>
        <p className="if-eyebrow mb-2">{brand.roomName}</p>
        <h2 className="font-display text-2xl text-[var(--if-ink)] mb-2">{brand.roomEntryTitle}</h2>
        <p className="if-lead mb-6">{brand.roomEntryDesc}</p>

        <div className="if-card p-5 mb-4 space-y-4">
          <div>
            <label className="if-field-label">你的名字</label>
            <input
              className="if-field-input"
              placeholder="例如：小陈"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              autoFocus={!initialRoomCode}
            />
          </div>

          <div>
            <label className="if-field-label">房间码</label>
            <input
              className="if-field-input text-center tracking-[0.2em] uppercase font-display"
              placeholder={brand.roomCodePlaceholder}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={6}
              autoFocus={!!initialRoomCode}
            />
          </div>

          {!isJoining ? (
            <>
              <div>
                <label className="if-field-label">{brand.roomTopicLabel}</label>
                <textarea
                  className="if-field-textarea"
                  placeholder="例如：Q3 优先级怎么排？"
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTemplate('quick')}
                  className={template === 'quick' ? 'if-chip if-chip--on flex-1' : 'if-chip flex-1'}
                >
                  <span className="block text-sm">⚡ {brand.roomModeQuick}</span>
                  <span className="block text-[10px] opacity-70 mt-0.5">{brand.roomModeQuickHint}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplate('full')}
                  className={template === 'full' ? 'if-chip if-chip--on flex-1' : 'if-chip flex-1'}
                >
                  <span className="block text-sm">🎯 {brand.roomModeFull}</span>
                  <span className="block text-[10px] opacity-70 mt-0.5">{brand.roomModeFullHint}</span>
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--if-muted)] leading-relaxed">
              {brand.roomJoinHint}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleEnterRoom}
          disabled={
            !connected ||
            !playerName.trim() ||
            (isJoining ? !roomCode.trim() : !problemStatement.trim())
          }
          className="w-full min-h-12 rounded-[var(--radius)] btn-primary text-sm font-medium disabled:btn-disabled"
        >
          {isJoining ? brand.roomJoinButton : brand.roomHostButton}
        </button>

        {!connected && (
          <p className="text-center text-xs text-[var(--if-danger)] mt-3">请先连接服务器</p>
        )}
      </div>
    );
  }

  return (
    <div className="if-page px-4 pb-8 max-w-md mx-auto">
      <div className="text-center pt-10 pb-6">
        <div className="if-mark">☯</div>
        <h1 className="font-display text-[1.65rem] text-[var(--if-ink)] tracking-tight">
          {brand.productName}
        </h1>
        <p className="text-xs text-[var(--if-muted)] mt-1">
          {brand.hostName} · {brand.subtitle}
        </p>
        <p className="if-lead mt-4 px-2">{brand.slogan}</p>

        <div className="if-status-pill mt-5">
          <span
            className={`size-2 rounded-full mr-2 shrink-0 ${
              connecting
                ? 'bg-[var(--if-accent)]'
                : connected
                  ? 'bg-[var(--if-success)]'
                  : 'bg-[var(--if-danger)]'
            }`}
          />
          {connecting && '正在连接…'}
          {!connecting && connected && '后端已连接'}
          {!connecting && !connected && '未连接服务器'}
        </div>
      </div>

      <div className="mt-2">
        <button
          type="button"
          onClick={() => setShowRoom(true)}
          disabled={!connected}
          className="if-mode-tile"
        >
          <span className="if-mode-icon">🔥</span>
          <span className="flex-1 min-w-0 text-left">
            <span className="block text-[0.95rem] font-medium text-[var(--if-ink)]">
              {brand.roomEntryTitle}
            </span>
            <span className="block text-xs text-[var(--if-muted)] mt-0.5">
              {brand.roomEntryDesc}
            </span>
          </span>
          <span className="text-[var(--if-muted-soft)] ml-2">›</span>
        </button>

        <button type="button" onClick={onSpark} className="if-mode-tile">
          <span className="if-mode-icon">✨</span>
          <span className="flex-1 min-w-0 text-left">
            <span className="block text-[0.95rem] font-medium text-[var(--if-ink)]">
              {brand.sparkName}
            </span>
            <span className="block text-xs text-[var(--if-muted)] mt-0.5">
              {brand.sparkDesc}
            </span>
          </span>
          <span className="text-[var(--if-muted-soft)] ml-2">›</span>
        </button>

        <button type="button" onClick={onRoundtable} className="if-mode-tile if-mode-tile--featured">
          <span className="if-mode-icon">🪑</span>
          <span className="flex-1 min-w-0 text-left">
            <span className="block text-[0.95rem] font-medium text-[var(--if-on-dark)]">
              {brand.roundtableName}
            </span>
            <span className="block text-xs text-[var(--if-on-dark-muted)] mt-0.5">
              {brand.roundtableDesc}
            </span>
          </span>
          <span className="text-[rgba(250,249,245,0.4)] ml-2">›</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="w-full text-xs text-[var(--if-muted-soft)] py-2 mt-1"
        >
          {showMore ? '收起更多' : '更多模式…'}
        </button>

        {showMore && (
          <button type="button" onClick={onHotSeat} className="if-mode-tile opacity-80">
            <span className="if-mode-icon">🎤</span>
            <span className="flex-1 min-w-0 text-left">
              <span className="block text-[0.95rem] font-medium text-[var(--if-ink)]">
                {brand.hotSeatName}
              </span>
              <span className="block text-xs text-[var(--if-muted)] mt-0.5">
                {brand.hotSeatDesc}
              </span>
            </span>
            <span className="text-[var(--if-muted-soft)] ml-2">›</span>
          </button>
        )}
      </div>
    </div>
  );
}
