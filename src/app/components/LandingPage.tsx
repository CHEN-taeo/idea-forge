import { useState } from 'react';

interface LandingPageProps {
  connectionStatus: string;
  onCreateGame: (name: string, problem: string) => void;
  onJoinGame: (name: string, roomCode: string) => void;
  onHotSeat: () => void;
  onSolo: () => void;
}

export function LandingPage({ connectionStatus, onCreateGame, onJoinGame, onHotSeat, onSolo }: LandingPageProps) {
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [template, setTemplate] = useState<'full' | 'quick'>('full');

  const connected = connectionStatus === 'connected';

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-scale-in page-card p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-amber-300/[0.06] border border-amber-300/[0.08] mb-4">
            <span className="text-xl">⚒️</span>
          </div>
          <h1 className="text-xl font-light text-white/80 tracking-tight">Idea Forge</h1>
          <p className="text-xs text-white/25 mt-1">
            Every discussion ends with a decision someone owns.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="inline-block size-1.5 rounded-full" style={{background: '#5eb3e6', boxShadow: '0 0 6px rgba(94,179,230,0.4)'}} />
            <span className="inline-block size-1.5 rounded-full" style={{background: '#e59bb3', boxShadow: '0 0 6px rgba(229,155,179,0.4)'}} />
            <span className="inline-block size-1.5 rounded-full" style={{background: '#7cd992', boxShadow: '0 0 6px rgba(124,217,146,0.4)'}} />
            <span className="inline-block size-1.5 rounded-full" style={{background: '#f0c674', boxShadow: '0 0 6px rgba(240,198,116,0.4)'}} />
          </div>
        </div>

        {mode === null && (
          <div className="space-y-2.5 stagger-children">
            {/* PRIMARY: Create Room — host casts screen, players join on phones */}
            <button
              onClick={() => setMode('create')}
              disabled={!connected}
              className="w-full h-12 rounded-xl btn-primary text-sm font-normal flex items-center justify-center gap-2 disabled:btn-disabled"
            >
              <span className="text-base">📺</span>
              Create a Room
              <span className="text-[10px] text-amber-200/40 ml-1">— you cast, they join</span>
            </button>

            <p className="text-[10px] text-white/15 text-center px-2">
              One screen in the room. Everyone else on their phone.
              Silent ideation → shared reveal → structured debate.
            </p>

            {/* SECONDARY: Join an existing room */}
            <button
              onClick={() => setMode('join')}
              disabled={!connected}
              className="w-full h-10 rounded-xl glass-light text-sm font-normal text-white/35 hover:text-white/60 transition-colors disabled:opacity-20"
            >
              Join a Room — scan QR or enter code
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 border-t border-white/[0.03]" />
              <span className="text-[9px] text-white/10">or</span>
              <div className="flex-1 border-t border-white/[0.03]" />
            </div>

            {/* SECONDARY: Solo — no server, one person */}
            <button
              onClick={onSolo}
              className="w-full h-10 rounded-xl glass-light text-sm font-normal text-white/35 hover:text-white/55 transition-colors"
            >
              🧠 Solo Brainstorm — think alone, structured
            </button>

            {/* TERTIARY: Hot Seat — no server, no phones */}
            <button
              onClick={onHotSeat}
              className="w-full h-9 rounded-xl text-xs font-normal text-white/15 hover:text-white/30 transition-colors"
            >
              🔥 Hot Seat — no server, one screen, everyone talks
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-3 animate-fade-in-up">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/20">Host a session</p>
            <input
              className="w-full h-10 px-3 rounded-lg glass-input text-sm text-white/80 placeholder:text-white/15 outline-none"
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <textarea
              className="w-full h-20 px-3 py-2 rounded-lg glass-input text-sm text-white/80 placeholder:text-white/15 outline-none resize-none"
              placeholder="What are we discussing? e.g. How should we prioritize Q3?"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setTemplate('quick')}
                className={template === 'quick'
                  ? 'flex-1 h-9 rounded-lg bg-amber-300/10 border border-amber-300/25 text-amber-200/70 text-xs'
                  : 'flex-1 h-9 rounded-lg glass-light text-white/25 text-xs hover:text-white/40 transition-colors'}>
                ⚡ Quick · 30 min<br />
                <span className="text-[9px] text-white/15">Brainstorm + Vote + Decide</span>
              </button>
              <button onClick={() => setTemplate('full')}
                className={template === 'full'
                  ? 'flex-1 h-9 rounded-lg bg-amber-300/10 border border-amber-300/25 text-amber-200/70 text-xs'
                  : 'flex-1 h-9 rounded-lg glass-light text-white/25 text-xs hover:text-white/40 transition-colors'}>
                🎯 Full · 60 min<br />
                <span className="text-[9px] text-white/15">Brainstorm + Remix + Challenge + Decide</span>
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMode(null)}
                className="flex-1 h-10 rounded-lg text-sm text-white/20 hover:text-white/40 transition-colors">
                Back
              </button>
              <button
                onClick={() => onCreateGame(playerName, problemStatement)}
                disabled={!playerName.trim() || !problemStatement.trim()}
                className="flex-1 h-10 rounded-lg btn-primary text-sm disabled:btn-disabled"
              >
                Create Room
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-3 animate-fade-in-up">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/20">Join a session</p>
            <input
              className="w-full h-10 px-3 rounded-lg glass-input text-sm text-white/80 placeholder:text-white/15 outline-none"
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <input
              className="w-full h-10 px-3 rounded-lg glass-input text-sm text-white/80 placeholder:text-white/15 outline-none uppercase tracking-[0.2em] text-center"
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <div className="flex gap-2">
              <button onClick={() => setMode(null)}
                className="flex-1 h-10 rounded-lg text-sm text-white/20 hover:text-white/40 transition-colors">
                Back
              </button>
              <button
                onClick={() => onJoinGame(playerName, roomCode)}
                disabled={!playerName.trim() || !roomCode.trim()}
                className="flex-1 h-10 rounded-lg btn-primary text-sm disabled:btn-disabled"
              >
                Join
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
