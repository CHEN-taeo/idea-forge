import { useState } from 'react';
import { brand } from '../lib/brand';

interface LandingPageProps {
  connectionStatus: string;
  onCreateGame: (name: string, problem: string, template: 'full' | 'quick') => void;
  onJoinGame: (name: string, roomCode: string) => void;
  onHotSeat: () => void;
  onSolo: () => void;
}

export function LandingPage({ connectionStatus, onCreateGame, onJoinGame, onHotSeat, onSolo }: LandingPageProps) {
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [template, setTemplate] = useState<'full' | 'quick'>('quick');

  const connected = connectionStatus === 'connected';

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-scale-in page-card p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-amber-300/[0.06] border border-amber-300/[0.08] mb-4">
            <span className="text-xl">☯</span>
          </div>
          <h1 className="text-xl font-light text-white/80 tracking-tight">{brand.productName}</h1>
          <p className="text-xs text-amber-200/40 mt-1">{brand.hostName} · {brand.subtitle}</p>
          <p className="text-[11px] text-white/30 mt-2 leading-relaxed px-1">{brand.slogan}</p>
        </div>

        {mode === null && (
          <div className="space-y-2.5 stagger-children">
            <button
              onClick={() => setMode('create')}
              disabled={!connected}
              className="w-full h-12 rounded-xl btn-primary text-sm font-normal flex items-center justify-center gap-2 disabled:btn-disabled"
            >
              <span className="text-base">🔥</span>
              发起{brand.roomName}
              <span className="text-[10px] text-amber-200/40 ml-1">— 你投屏，大家用手机</span>
            </button>

            <p className="text-[10px] text-white/15 text-center px-2 leading-relaxed">
              一屏在会议室。其他人用手机。
              静默写想法 → 一起揭晓 → 结构化讨论 → 每人认领一件事。
            </p>

            <button
              onClick={onSolo}
              className="w-full h-12 rounded-xl glass-light text-sm font-normal text-white/50 hover:text-white/75 transition-colors flex items-center justify-center gap-2 border border-white/[0.06]"
            >
              <span className="text-base">🧠</span>
              开始{brand.soloName}
              <span className="text-[10px] text-white/20">— 一个人，15 分钟想明白</span>
            </button>

            <button
              onClick={() => setMode('join')}
              disabled={!connected}
              className="w-full h-10 rounded-xl text-sm font-normal text-white/30 hover:text-white/50 transition-colors disabled:opacity-20"
            >
              加入{brand.roomName} — 扫码或输入房间码
            </button>

            <button
              onClick={() => setShowMore(!showMore)}
              className="w-full text-[10px] text-white/15 hover:text-white/30 py-1"
            >
              {showMore ? '收起更多' : '更多模式…'}
            </button>

            {showMore && (
              <button
                onClick={onHotSeat}
                className="w-full h-9 rounded-xl text-xs font-normal text-white/15 hover:text-white/30 transition-colors"
              >
                🎤 热座模式 — 无服务器，一屏口述讨论
              </button>
            )}

            {!connected && (
              <p className="text-[10px] text-red-300/40 text-center">正在连接服务器…</p>
            )}
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-3 animate-fade-in-up">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/20">主持一场{brand.roomName}</p>
            <input
              className="w-full h-10 px-3 rounded-lg glass-input text-sm text-white/80 placeholder:text-white/15 outline-none"
              placeholder="你的名字"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <textarea
              className="w-full h-20 px-3 py-2 rounded-lg glass-input text-sm text-white/80 placeholder:text-white/15 outline-none resize-none"
              placeholder="今天要讨论什么？例如：Q3 优先级怎么排？"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setTemplate('quick')}
                className={template === 'quick'
                  ? 'flex-1 h-9 rounded-lg bg-amber-300/10 border border-amber-300/25 text-amber-200/70 text-xs'
                  : 'flex-1 h-9 rounded-lg glass-light text-white/25 text-xs hover:text-white/40 transition-colors'}
              >
                ⚡ 快速 · 约 30 分钟<br />
                <span className="text-[9px] text-white/15">构思 → 投票 → 认领</span>
              </button>
              <button
                onClick={() => setTemplate('full')}
                className={template === 'full'
                  ? 'flex-1 h-9 rounded-lg bg-amber-300/10 border border-amber-300/25 text-amber-200/70 text-xs'
                  : 'flex-1 h-9 rounded-lg glass-light text-white/25 text-xs hover:text-white/40 transition-colors'}
              >
                🎯 完整 · 约 60 分钟<br />
                <span className="text-[9px] text-white/15">构思 → 改造 → 挑战 → 认领</span>
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMode(null)}
                className="flex-1 h-10 rounded-lg text-sm text-white/20 hover:text-white/40 transition-colors"
              >
                返回
              </button>
              <button
                onClick={() => onCreateGame(playerName, problemStatement, template)}
                disabled={!playerName.trim() || !problemStatement.trim()}
                className="flex-1 h-10 rounded-lg btn-primary text-sm disabled:btn-disabled"
              >
                创建房间
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-3 animate-fade-in-up">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/20">加入{brand.roomName}</p>
            <input
              className="w-full h-10 px-3 rounded-lg glass-input text-sm text-white/80 placeholder:text-white/15 outline-none"
              placeholder="你的名字"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <input
              className="w-full h-10 px-3 rounded-lg glass-input text-sm text-white/80 placeholder:text-white/15 outline-none uppercase tracking-[0.2em] text-center"
              placeholder="房间码"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setMode(null)}
                className="flex-1 h-10 rounded-lg text-sm text-white/20 hover:text-white/40 transition-colors"
              >
                返回
              </button>
              <button
                onClick={() => onJoinGame(playerName, roomCode)}
                disabled={!playerName.trim() || !roomCode.trim()}
                className="flex-1 h-10 rounded-lg btn-primary text-sm disabled:btn-disabled"
              >
                加入
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
