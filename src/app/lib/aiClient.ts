const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

function apiUrl(path: string) {
  return `${SERVER_URL}${path}`;
}

export type AiMode = 'ai' | 'template';
export type DispatchMode = 'ai' | 'template' | 'manual';

export async function fetchAiStatus(): Promise<{ enabled: boolean; mode: AiMode; model?: string }> {
  try {
    const res = await fetch(apiUrl('/api/ai/status'));
    if (!res.ok) throw new Error('status failed');
    return res.json();
  } catch {
    return { enabled: false, mode: 'template' };
  }
}

export async function fetchSoloAngles(problem: string): Promise<{ angles: string[]; mode: AiMode }> {
  const res = await fetch(apiUrl('/api/ai/solo/angles'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '获取思考角度失败');
  }
  return res.json();
}

export async function fetchSmartAction(
  ideaText: string,
  problem: string,
  playerName?: string
): Promise<{ action: string; mode: AiMode }> {
  const res = await fetch(apiUrl('/api/ai/smart-action'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ideaText, problem, playerName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '生成行动建议失败');
  }
  return res.json();
}

export interface PersonaTurn {
  speaker: string;
  text: string;
}

export async function fetchPersonaReply(
  personaId: string,
  topic: string,
  history: PersonaTurn[],
  userMessage: string,
  userName?: string,
  lastSpeaker?: string
): Promise<{ reply: string; mode: AiMode }> {
  const res = await fetch(apiUrl('/api/ai/persona/reply'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personaId, topic, history, userMessage, userName, lastSpeaker }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '人物回应失败');
  }
  return res.json();
}

export async function fetchPersonaDispatch(
  personaIds: string[],
  topic: string,
  history: PersonaTurn[],
  userMessage: string,
  userName?: string,
  targetPersonaId?: string
): Promise<{ order: string[]; mode: DispatchMode; note: string }> {
  const res = await fetch(apiUrl('/api/ai/persona/dispatch'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personaIds, topic, history, userMessage, userName, targetPersonaId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '调度失败');
  }
  return res.json();
}

export interface RoundtableSummary {
  consensus: string;
  disagreement: string;
  gap: string;
  nextStep: string;
  raw?: string;
  mode?: AiMode;
}

export async function fetchRoundtableSummary(
  topic: string,
  history: PersonaTurn[],
  personaIds: string[]
): Promise<RoundtableSummary> {
  const res = await fetch(apiUrl('/api/ai/persona/summarize'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, history, personaIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '总结失败');
  }
  return res.json();
}

export async function fetchSoloChallenge(
  ideaText: string,
  problem: string
): Promise<{ question: string; mode: AiMode }> {
  const res = await fetch(apiUrl('/api/ai/solo/challenge'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ideaText, problem }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '生成追问失败');
  }
  return res.json();
}
