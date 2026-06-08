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
  `);
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
export function createCommitment({ playerName, action, ideaId, ideaText, sessionId, dueDays = 14 }) {
  const d = getDb();
  const id = `tok_${Date.now()}_${randomBytes(4).toString('hex')}`;
  const echoToken = randomBytes(12).toString('hex');
  const dueDate = new Date(Date.now() + dueDays * 86400000).toISOString().split('T')[0];

  const stmt = d.prepare(`
    INSERT INTO commitments (id, session_id, player_name, action, idea_id, idea_text, echo_token, due_days, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, sessionId, playerName, action, ideaId, ideaText, echoToken, dueDays, dueDate);

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
