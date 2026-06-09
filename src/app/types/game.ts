export type GamePhase =
  | 'lobby'
  | 'r1_submit'
  | 'r1_guess'
  | 'r2_adapt'
  | 'r3_challenge'
  | 'commitment'
  | 'finished';

export type SessionTemplate = 'full' | 'quick';

export type Role = 
  | 'Visionary' 
  | 'Pragmatist' 
  | 'Contrarian' 
  | 'Connector' 
  | 'Analyst'
  | 'Storyteller'
  | 'Builder'
  | 'Wildcard';

export interface Player {
  id: string;
  name: string;
  score: number;
  role: Role | null;
  inspirationCards: number[];
  goldCards: string[];
  ready: boolean;
  connected: boolean;
}

export interface Commitment {
  id: string;
  playerName: string;
  action: string;
  ideaId: string;
  echoUrl?: string;
  createdAt?: number;
  dueDays?: number;
}

export interface Idea {
  id: string;
  text: string;
  authorId: string;
  authorName?: string;
  round: number;
  votes: number;
  guesses: Record<string, string>;
  alive: boolean;
  adaptedFrom?: string;
  originalAuthorId?: string;
  endorsed?: boolean;
  inspirationCard?: number;
  challengedBy?: string;
  defenseResponse?: string;
  defenseAccepted?: boolean;
  defenseVotes?: Record<string, boolean>;
}

export interface Challenge {
  id: string;
  ideaId: string;
  challengerId: string;
  challengerName: string;
  reason: string;
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  round: number;
  players: Record<string, Player>;
  ideas: Idea[];
  challenges: Challenge[];
  commitments?: Commitment[];
  currentPlayerId: string | null;
  roomCode: string;
  hostId: string;
  problemStatement: string;
  timerEnd: number | null;
  template?: SessionTemplate;
}
