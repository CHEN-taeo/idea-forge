// ---------------------------------------------------------------------------
// Idea Forge AI Module
// OpenAI-compatible API (DeepSeek default). Falls back to templates when no key.
// ---------------------------------------------------------------------------

const API_KEY = process.env.AI_API_KEY || '';
const API_URL = process.env.AI_API_URL || 'https://api.deepseek.com/v1';
const MODEL = process.env.AI_MODEL || 'deepseek-chat';
const TIMEOUT = 15000;
const COACH_NAME = process.env.BRAND_COACH_NAME || process.env.VITE_BRAND_HOST_NAME || '陈老师';

const isAvailable = () => !!API_KEY && API_KEY !== 'sk-your-key-here';

function coachSystem(extra = '') {
  return `你是「${COACH_NAME}」的思维教练。风格：直接、少废话、不替用户做决定。用简体中文。${extra}`;
}

// ---------------------------------------------------------------------------
// Shared HTTP call
// ---------------------------------------------------------------------------
async function callAI(systemPrompt, userMessage) {
  if (!isAvailable()) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(`${API_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.8,
        max_tokens: 800
      }),
      signal: controller.signal
    });

    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error(`[AI] ${err.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 1. Generate inspiration prompts
// ---------------------------------------------------------------------------
const TEMPLATE_PROMPTS = [
  '💭 从用户视角：谁最痛苦？这个问题让谁夜不能寐？',
  '🔍 从技术视角：现有方案为什么没解决？技术瓶颈在哪？',
  '🌍 从跨界视角：其他行业是怎么解决类似问题的？',
  '⚡ 从极端视角：如果预算为零、时间只有一周，你会怎么做？',
  '🔮 从未来视角：5年后回看这个问题，你会后悔没做什么？'
];

async function generatePrompts(problem) {
  const ai = await callAI(
    coachSystem('根据用户的核心问题，生成3个深度思考角度，帮助打破思维惯性。每个角度一句话，带emoji前缀。不要编号列表外的废话。'),
    `核心问题：${problem}\n\n请生成3个思考角度：`
  );
  if (ai) {
    const lines = ai.split('\n').filter(l => l.trim()).slice(0, 3);
    if (lines.length >= 3) return lines;
  }
  return TEMPLATE_PROMPTS.slice(0, 3);
}

// ---------------------------------------------------------------------------
// 2. Expand an idea in 5 directions
// ---------------------------------------------------------------------------
const TEMPLATE_EXPANSIONS = [
  '🚀 延伸：把这个想法做到极致会怎样？技术/产品化路径是什么？',
  '🔄 反向：反过来做会怎样？如果目标人群完全相反呢？',
  '🌉 跨界：和其他领域结合会产生什么化学反应？',
  '⚡ 挑衅：在极端约束下（零预算/3天MVP）怎么实现？',
  '🔮 未来：5年后这个想法会演变成什么？'
];

async function expandIdea(ideaText) {
  const ai = await callAI(
    `你是一个创意拓展专家。对用户的想法，从5个不同角度进行拓展，每个角度一句话，用中文，带emoji前缀。角度包括：延伸、反向、跨界、挑衅、未来。`,
    `想法：${ideaText}\n\n请从5个角度拓展：`
  );
  if (ai) {
    const lines = ai.split('\n').filter(l => l.trim()).slice(0, 5);
    return lines.length >= 3 ? lines : TEMPLATE_EXPANSIONS;
  }
  return TEMPLATE_EXPANSIONS;
}

// ---------------------------------------------------------------------------
// 3. Round summary analysis
// ---------------------------------------------------------------------------
async function analyzeRound(ideas, roundNum) {
  const ideaList = ideas.map((i, idx) => `${idx + 1}. ${i.text}（${i.votes}票）`).join('\n');
  if (!ideaList.trim()) return null;

  const ai = await callAI(
    `你是一个创意分析专家。分析一轮头脑风暴的结果，输出三个部分：1) 主题聚类（2-4个主题方向）2) 亮点识别（最有趣的想法）3) 模式洞察（思维盲区或集中方向）。用中文，简洁有力，每部分2-3句话。`,
    `第${roundNum}轮想法：\n${ideaList}\n\n请分析：`
  );
  if (ai) return ai;

  // Template fallback
  const themes = new Set(ideas.map(i => {
    const t = i.text.substring(0, 10);
    return t.includes('AI') || t.includes('智能') ? 'AI/智能' :
           t.includes('社区') || t.includes('社交') ? '社区/社交' :
           t.includes('数据') ? '数据驱动' : '综合';
  }));
  return [
    `📊 主题聚类：${[...themes].join('、')}`,
    `✨ 亮点识别：共${ideas.length}个想法，最高${Math.max(...ideas.map(i => i.votes))}票`,
    `🔍 模式洞察：想法集中在${[...themes].slice(0, 2).join('和')}方向`
  ].join('\n\n');
}

// ---------------------------------------------------------------------------
// 4. SMART action for commitment / solo
// ---------------------------------------------------------------------------
const TEMPLATE_SMART_ACTIONS = [
  '下周五前，与3位目标用户各聊30分钟，记录他们最大的痛点。',
  '本周内写出一份一页纸方案，列出三个最大风险及对应缓解措施。',
  '14天内完成最小验证：用现有资源试一次，写下结果与下一步。'
];

async function generateSmartAction(ideaText, problem, playerName) {
  const ai = await callAI(
    coachSystem('把用户的构想转化为一条具体、可执行、14天内能完成的行动。只输出行动本身，一句话，不要解释、不要引号。'),
    `讨论问题：${problem}\n选定构想：${ideaText}${playerName ? `\n负责人：${playerName}` : ''}\n\n请给出一条SMART行动：`
  );
  if (ai) return ai.split('\n')[0].replace(/^[\d.)\-\s"]+/, '').replace(/["'"]$/, '').trim();
  return TEMPLATE_SMART_ACTIONS[Math.floor(Math.random() * TEMPLATE_SMART_ACTIONS.length)];
}

// ---------------------------------------------------------------------------
// 5. Solo — one challenging question per idea
// ---------------------------------------------------------------------------
const TEMPLATE_SOLO_CHALLENGE = [
  '如果最坏的情况发生，你承受得起吗？具体是什么？',
  '谁会是第一个反对这个方案的人？他们会怎么说？',
  '如果只能保留这个想法的20%，你会留下哪一部分？'
];

async function soloChallengeIdea(ideaText, problem) {
  const ai = await callAI(
    coachSystem('对用户的一条想法只提一个尖锐、具体的追问。不要给答案。只输出一个问题。'),
    `讨论问题：${problem}\n想法：${ideaText}\n\n请提一个追问：`
  );
  if (ai) return ai.split('\n').filter(l => l.trim())[0] || TEMPLATE_SOLO_CHALLENGE[0];
  return TEMPLATE_SOLO_CHALLENGE[Math.floor(Math.random() * TEMPLATE_SOLO_CHALLENGE.length)];
}

// ---------------------------------------------------------------------------
// Status check
// ---------------------------------------------------------------------------
function getStatus() {
  return {
    enabled: isAvailable(),
    model: MODEL,
    mode: isAvailable() ? 'ai' : 'template'
  };
}

export { generatePrompts, expandIdea, analyzeRound, generateSmartAction, soloChallengeIdea, getStatus, isAvailable };
