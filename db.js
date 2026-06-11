// ---------------------------------------------------------------------------
// SQLite persistence layer for Idea Forge
// Sessions, commitments, and echo URL tracking
// ---------------------------------------------------------------------------
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'ideaforge.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    console.log(`[DB] Connected to ${DB_PATH}`);
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      room_code TEXT NOT NULL,
      problem_statement TEXT NOT NULL,
      player_count INTEGER NOT NULL,
      idea_count INTEGER NOT NULL,
      challenge_count INTEGER NOT NULL,
      mvp_idea_text TEXT,
      mvp_idea_author TEXT,
      standings_json TEXT,
      challenges_json TEXT,
      survivors_json TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS commitments (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      player_name TEXT NOT NULL,
      action TEXT NOT NULL,
      idea_id TEXT,
      idea_text TEXT,
      echo_token TEXT UNIQUE NOT NULL,
      due_days INTEGER DEFAULT 14,
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_commitments_token ON commitments(echo_token);
    CREATE INDEX IF NOT EXISTS idx_commitments_session ON commitments(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_room_code ON sessions(room_code);

    CREATE TABLE IF NOT EXISTS active_rooms (
      room_code TEXT PRIMARY KEY,
      game_state_json TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      room_code TEXT,
      session_id TEXT,
      player_name TEXT,
      meta_json TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_room ON analytics_events(room_code);
  `);

  // Migration: echo open tracking on commitments
  const cols = db.prepare(`PRAGMA table_info(commitments)`).all().map(c => c.name);
  if (!cols.includes('echo_opened_at')) {
    db.exec(`ALTER TABLE commitments ADD COLUMN echo_opened_at TEXT`);
  }
  if (!cols.includes('template')) {
    db.exec(`ALTER TABLE commitments ADD COLUMN template TEXT`);
  }
}

// ---------------------------------------------------------------------------
// In-progress room checkpoints (survives server restart)
// ---------------------------------------------------------------------------
export function saveActiveRoom(gameState) {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO active_rooms (room_code, game_state_json, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(room_code) DO UPDATE SET
      game_state_json = excluded.game_state_json,
      updated_at = datetime('now')
  `);
  stmt.run(gameState.roomCode, JSON.stringify(gameState));
}

export function loadActiveRoom(roomCode) {
  const d = getDb();
  const row = d.prepare('SELECT game_state_json FROM active_rooms WHERE room_code = ?').get(roomCode);
  if (!row) return null;
  try {
    return JSON.parse(row.game_state_json);
  } catch {
    return null;
  }
}

export function loadAllActiveRooms() {
  const d = getDb();
  const rows = d.prepare('SELECT game_state_json FROM active_rooms ORDER BY updated_at DESC').all();
  const rooms = [];
  for (const row of rows) {
    try {
      rooms.push(JSON.parse(row.game_state_json));
    } catch {
      // skip corrupt rows
    }
  }
  return rooms;
}

export function deleteActiveRoom(roomCode) {
  const d = getDb();
  d.prepare('DELETE FROM active_rooms WHERE room_code = ?').run(roomCode);
}

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------
export function saveSession(gameState) {
  const d = getDb();
  const id = `sess_${Date.now()}_${randomBytes(4).toString('hex')}`;
  const survivingIdeas = gameState.ideas.filter(i => i.alive);
  const mvpIdea = [...survivingIdeas].sort((a, b) => b.votes - a.votes)[0];

  const standings = Object.values(gameState.players)
    .sort((a, b) => b.score - a.score)
    .map(p => ({ name: p.name, score: p.score, role: p.role }));

  const challengesSummary = gameState.challenges.map(c => ({
    ideaId: c.ideaId,
    challenger: c.challengerName,
    reason: c.reason
  }));

  const survivors = survivingIdeas.map(i => ({
    text: i.text,
    author: gameState.players[i.authorId]?.name || 'Unknown',
    votes: i.votes,
    round: i.round,
    challenged: !!i.challengedBy,
    defenseAccepted: !!i.defenseAccepted
  }));

  const stmt = d.prepare(`
    INSERT INTO sessions (id, room_code, problem_statement, player_count, idea_count, challenge_count, mvp_idea_text, mvp_idea_author, standings_json, challenges_json, survivors_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    gameState.roomCode,
    gameState.problemStatement,
    Object.keys(gameState.players).length,
    gameState.ideas.length,
    gameState.challenges.length,
    mvpIdea?.text || null,
    mvpIdea ? (gameState.players[mvpIdea.authorId]?.name || null) : null,
    JSON.stringify(standings),
    JSON.stringify(challengesSummary),
    JSON.stringify(survivors)
  );

  console.log(`[DB] Session saved: ${id} (${gameState.roomCode})`);
  return id;
}

export function getSession(roomCode) {
  const d = getDb();
  return d.prepare('SELECT * FROM sessions WHERE room_code = ? ORDER BY created_at DESC LIMIT 1').get(roomCode);
}

// ---------------------------------------------------------------------------
// Commitment persistence
// ---------------------------------------------------------------------------
export function createCommitment({ playerName, action, ideaId, ideaText, sessionId, dueDays = 14, template = null }) {
  const d = getDb();
  const id = `tok_${Date.now()}_${randomBytes(4).toString('hex')}`;
  const echoToken = randomBytes(12).toString('hex');
  const dueDate = new Date(Date.now() + dueDays * 86400000).toISOString().split('T')[0];

  const stmt = d.prepare(`
    INSERT INTO commitments (id, session_id, player_name, action, idea_id, idea_text, echo_token, due_days, due_date, template)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, sessionId, playerName, action, ideaId, ideaText, echoToken, dueDays, dueDate, template);

  console.log(`[DB] Commitment created: ${id} by ${playerName} (due: ${dueDate})`);
  return { id, echoToken, dueDate, echoUrl: `/echo/${echoToken}` };
}

export function getCommitmentByToken(token) {
  const d = getDb();
  return d.prepare('SELECT * FROM commitments WHERE echo_token = ?').get(token);
}

export function getCommitmentsBySession(sessionId) {
  const d = getDb();
  return d.prepare('SELECT * FROM commitments WHERE session_id = ? ORDER BY created_at').all(sessionId);
}

export function getDueCommitments() {
  const d = getDb();
  const today = new Date().toISOString().split('T')[0];
  return d.prepare('SELECT * FROM commitments WHERE due_date <= ?').all(today);
}

export function getAllSessions(limit = 20) {
  const d = getDb();
  return d.prepare('SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?').all(limit);
}

// ---------------------------------------------------------------------------
// Analytics & metrics (P0 hypothesis validation)
// ---------------------------------------------------------------------------
export function logEvent(eventType, { roomCode = null, sessionId = null, playerName = null, meta = null } = {}) {
  const d = getDb();
  d.prepare(`
    INSERT INTO analytics_events (event_type, room_code, session_id, player_name, meta_json)
    VALUES (?, ?, ?, ?, ?)
  `).run(eventType, roomCode, sessionId, playerName, meta ? JSON.stringify(meta) : null);
}

export function recordEchoOpen(token) {
  const d = getDb();
  const row = d.prepare('SELECT echo_opened_at, session_id, player_name FROM commitments WHERE echo_token = ?').get(token);
  if (!row) return false;
  if (!row.echo_opened_at) {
    d.prepare(`UPDATE commitments SET echo_opened_at = datetime('now') WHERE echo_token = ?`).run(token);
    logEvent('echo_opened', {
      sessionId: row.session_id || null,
      playerName: row.player_name || null,
      meta: { echoToken: token }
    });
  }
  return true;
}

export function getMetrics() {
  const d = getDb();

  const sessionsStarted = d.prepare(`SELECT COUNT(*) AS n FROM analytics_events WHERE event_type = 'session_started'`).get().n;
  const commitmentsCreated = d.prepare(`SELECT COUNT(*) AS n FROM analytics_events WHERE event_type = 'commitment_created'`).get().n;
  const echoOpens = d.prepare(`SELECT COUNT(*) AS n FROM commitments WHERE echo_opened_at IS NOT NULL`).get().n;
  const totalCommitments = d.prepare(`SELECT COUNT(*) AS n FROM commitments`).get().n;

  const byTemplate = d.prepare(`
    SELECT COALESCE(json_extract(meta_json, '$.template'), 'unknown') AS template, COUNT(*) AS n
    FROM analytics_events WHERE event_type = 'session_started'
    GROUP BY template
  `).all();

  const commitmentByTemplate = d.prepare(`
    SELECT COALESCE(template, 'unknown') AS template, COUNT(*) AS n
    FROM commitments GROUP BY template
  `).all();

  const recentEvents = d.prepare(`
    SELECT event_type, room_code, player_name, meta_json, created_at
    FROM analytics_events ORDER BY id DESC LIMIT 30
  `).all();

  const playersAtCommitment = d.prepare(`
    SELECT COALESCE(SUM(CAST(json_extract(meta_json, '$.playerCount') AS INTEGER)), 0) AS n
    FROM analytics_events WHERE event_type = 'phase_entered' AND json_extract(meta_json, '$.phase') = 'commitment'
  `).get().n;

  return {
    sessionsStarted,
    commitmentsCreated,
    totalCommitments,
    echoOpens,
    commitmentRate: playersAtCommitment > 0 ? commitmentsCreated / playersAtCommitment : null,
    echoOpenRate: totalCommitments > 0 ? echoOpens / totalCommitments : null,
    sessionsByTemplate: byTemplate,
    commitmentsByTemplate: commitmentByTemplate,
    recentEvents
  };
}
