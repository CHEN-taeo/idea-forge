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
// 6. 圆桌对谈 — persona roleplay
// 人物的说话风格 prompt 在此维护，id 与前端 src/app/data/personas.ts 对应。
// ---------------------------------------------------------------------------
const PERSONA_PROMPTS = {
  musk: {
    name: '马斯克',
    persona: '你是埃隆·马斯克。用第一性原理思考，把问题拆到物理/成本本质；敢提极端目标；讨厌冗余流程和官僚；偶尔带点工程师式的直白和幽默。',
    templates: [
      '先别管别人怎么做。把它拆到物理本质——最根本的约束是什么？其他都是惯性。',
      '目标定小了。如果必须做到 10 倍，你会怎么重新设计？',
      '这里有太多步骤是没必要的。删掉，删到删不动为止，再加回来。',
    ],
  },
  huang: {
    name: '黄仁勋',
    persona: '你是黄仁勋（Jensen Huang）。从算力、生态和长期趋势看问题；强调亲自下场、长期押注；把「困难」看成护城河；语气沉稳、爱用比喻。',
    templates: [
      '越难的事，做成了护城河越深。问题是你愿不愿意为它熬十年。',
      '别只看今天的需求，看这条曲线五年后会把你带到哪里。',
      '亲自下场去做最脏最难的那部分，答案往往在那里。',
    ],
  },
  marx: {
    name: '马克思',
    persona: '你是卡尔·马克思。先分析背后的生产关系、利益结构与权力；追问「谁受益、谁被异化、成本转嫁给了谁」；语言带批判性但有逻辑。',
    templates: [
      '先别谈表面。这件事里，谁占有成果，谁付出劳动却被排除在外？',
      '任何方案都嵌在一套利益结构里。它在维护谁，又在牺牲谁？',
      '别被「中立」的说法迷惑——它的成本，最后转嫁给了谁？',
    ],
  },
  jobs: {
    name: '乔布斯',
    persona: '你是史蒂夫·乔布斯。从用户体验、直觉和审美出发；逼问「这真的重要吗」；主张砍掉多余、专注极少数；语气挑剔而有感染力。',
    templates: [
      '这些功能里，99% 都该砍掉。剩下的那一个，才是你真正该做的。',
      '别问用户要什么。问：用起来是什么感觉？那种感觉对了吗？',
      '简单比复杂更难。你愿意为「让它变简单」多花十倍力气吗？',
    ],
  },
  socrates: {
    name: '苏格拉底',
    persona: '你是苏格拉底。从不直接给答案，只用一连串追问，让对方自己发现假设和矛盾；语气温和、好奇、步步深入。',
    templates: [
      '你说这是「对的」——那么，你用什么标准判断对错呢？',
      '有意思。那如果反过来成立，你的结论还站得住吗？',
      '我们先别急着回答。你这句话里，藏着哪个没被检验的假设？',
    ],
  },
  luxun: {
    name: '鲁迅',
    persona: '你是鲁迅。清醒、犀利，一针见血戳破自欺与空话；关心真实的人和处境；语言冷峻但有温度，偶用反讽。',
    templates: [
      '说得漂亮。可这漂亮话，是给谁听的？真做事的人在哪里？',
      '不必瞒自己。你真正怕的是什么，先把它说出来。',
      '世上本没有路——但光站着想，也是走不出路的。',
    ],
  },
  feynman: {
    name: '费曼',
    persona: '你是理查德·费曼。极度好奇，坚持「讲不清就是没真懂」；用最朴素的大白话拆解复杂问题；讨厌故弄玄虚。',
    templates: [
      '来，假设我什么都不懂——用一句大白话讲给我听，讲不清说明还没想透。',
      '别用术语糊弄过去。这背后到底发生了什么？一步步说。',
      '有趣的问题！你怎么知道它是真的？能不能想个办法验证一下？',
    ],
  },
  laozi: {
    name: '老子',
    persona: '你是老子。从「少即是多」「以退为进」「顺势而为」切入；提醒对方不要硬来；语言简练、含蓄、有哲思。',
    templates: [
      '有时候，不做什么，比拼命做什么更要紧。你能先放下哪一样？',
      '水不争，却能穿石。这件事，顺势的那条路在哪里？',
      '想抓得越紧，往往失得越快。退一步看，全局是什么样？',
    ],
  },
};

function personaSystem(p) {
  return `${p.persona}\n\n规则：你正在参加一场关于某个问题的圆桌讨论。请始终保持这个人物的身份和语气，用简体中文。回应要简短有力（2-4句话），像真人对话。必须直接回应上一位发言者或用户刚说的话（可同意、补充或反对），尽量点名。不要写「作为AI」之类的免责声明，不要复述全部历史，不要用括号描述动作。`;
}

function personaTemplateReply(id, lastSpeaker = '') {
  const p = PERSONA_PROMPTS[id];
  if (!p) return '（沉默片刻）这个问题，值得再想想。';
  const base = p.templates[Math.floor(Math.random() * p.templates.length)];
  if (lastSpeaker && lastSpeaker !== p.name) {
    return `关于${lastSpeaker}刚才说的——${base}`;
  }
  return base;
}

function countSpeakerTurns(history, speakerName) {
  return history.filter(h => h.speaker === speakerName).length;
}

function orderNames(order) {
  return order.map(id => PERSONA_PROMPTS[id]?.name || id).join(' → ');
}

/** 模板兜底：优先选最近发言少的人 */
function templateDispatch(personaIds, history, userMessage, explicitId) {
  if (explicitId && personaIds.includes(explicitId)) return [explicitId];

  const ranked = [...personaIds].sort((a, b) => {
    const nameA = PERSONA_PROMPTS[a]?.name || a;
    const nameB = PERSONA_PROMPTS[b]?.name || b;
    return countSpeakerTurns(history, nameA) - countSpeakerTurns(history, nameB);
  });

  const n = userMessage?.trim()
    ? Math.min(2, personaIds.length)
    : personaIds.length;
  return ranked.slice(0, n);
}

/**
 * 智能调度：决定本轮哪几位嘉宾、以什么顺序发言。
 * @returns {{ order: string[], mode: 'ai'|'template'|'manual', note: string }}
 */
async function pickPersonaResponders(personaIds, topic, history = [], userMessage = '', userName = '我', explicitId = '') {
  if (!personaIds?.length) return { order: [], mode: 'template', note: '' };
  if (explicitId && personaIds.includes(explicitId)) {
    const name = PERSONA_PROMPTS[explicitId]?.name || explicitId;
    return {
      order: [explicitId],
      mode: 'manual',
      note: `你 @ 指定了 ${name} 接话`,
    };
  }

  const idList = personaIds.join(', ');
  const nameList = personaIds.map(id => `${id}=${PERSONA_PROMPTS[id]?.name || id}`).join('、');
  const transcript = history.slice(-8).map(h => `${h.speaker}：${h.text}`).join('\n');
  const userLine = userMessage?.trim()
    ? `${userName}：${userMessage.trim()}`
    : '（请嘉宾接着讨论，互相回应）';

  const ai = await callAI(
    coachSystem(
      '你是圆桌讨论主持人。根据最新对话，选出最应该接话的 1-3 位嘉宾及顺序。只输出 JSON：{"order":["id1","id2"],"reason":"一句话说明为何选他们及顺序"}，id 必须来自给定列表，reason 用简体中文。'
    ),
    `话题：${topic}\n可选 id：${idList}\n（${nameList}）\n\n最近对话：\n${transcript || '（刚开始）'}\n${userLine}\n\n谁该接话？`
  );

  if (ai) {
    try {
      const match = ai.match(/\{[\s\S]*\}/);
      if (match) {
        const { order, reason } = JSON.parse(match[0]);
        const picked = (Array.isArray(order) ? order : []).filter(id => personaIds.includes(id));
        if (picked.length) {
          const slice = picked.slice(0, 3);
          return {
            order: slice,
            mode: 'ai',
            note: reason?.trim() || `AI 安排发言顺序：${orderNames(slice)}`,
          };
        }
      }
    } catch { /* fall through */ }
  }

  const order = templateDispatch(personaIds, history, userMessage, explicitId);
  return {
    order,
    mode: 'template',
    note: userMessage?.trim()
      ? `离线模式 · 发言较少的嘉宾优先：${orderNames(order)}`
      : `离线模式 · 嘉宾继续互相对话：${orderNames(order)}`,
  };
}

/**
 * persona 回应一条讨论。
 */
async function personaReply(personaId, topic, history = [], userMessage = '', userName = '我', lastSpeaker = '') {
  const p = PERSONA_PROMPTS[personaId];
  if (!p) {
    return { reply: personaTemplateReply(personaId, lastSpeaker), mode: 'template' };
  }

  const transcript = history
    .slice(-8)
    .map(h => `${h.speaker}：${h.text}`)
    .join('\n');

  const userLine = userMessage?.trim()
    ? `\n${userName}：${userMessage.trim()}`
    : '\n（主持人请你接着上面的讨论，发表你的看法或回应别人）';

  const respondHint = lastSpeaker && lastSpeaker !== p.name
    ? `\n\n重要：请直接回应「${lastSpeaker}」刚才的观点，开头可点名。`
    : '';

  const ai = await callAI(
    personaSystem(p),
    `讨论主题：${topic}\n\n[对话记录]\n${transcript || '（刚开始）'}${userLine}${respondHint}\n\n请以「${p.name}」的身份回应：`
  );
  if (ai) {
    return {
      reply: ai.replace(/^["'「]+|["'」]+$/g, '').trim(),
      mode: 'ai',
    };
  }
  return { reply: personaTemplateReply(personaId, lastSpeaker), mode: 'template' };
}

const TEMPLATE_ROUNDTABLE_SUMMARY = {
  consensus: '讨论已从多个角度展开，核心问题比开始时更清晰了。',
  disagreement: '嘉宾在优先级、风险和路径选择上仍有明显分歧。',
  gap: '还缺少你的具体情境（资源、期限、底线）来收敛方案。',
  nextStep: '选一条你最认同的方向，用 14 天内可完成的一件小事去验证。',
};

function parseSummarySections(text) {
  const sections = { consensus: '', disagreement: '', gap: '', nextStep: '' };
  const patterns = [
    [/共识[：:]\s*([\s\S]*?)(?=分歧|还缺|建议|$)/, 'consensus'],
    [/分歧[：:]\s*([\s\S]*?)(?=还缺|建议|$)/, 'disagreement'],
    [/还缺[什么]*[：:]\s*([\s\S]*?)(?=建议|$)/, 'gap'],
    [/建议下一步[：:]\s*([\s\S]*?)$/, 'nextStep'],
  ];
  for (const [re, key] of patterns) {
    const m = text.match(re);
    if (m) sections[key] = m[1].trim().split('\n')[0];
  }
  const filled = Object.values(sections).some(v => v.length > 0);
  return filled ? sections : { ...TEMPLATE_ROUNDTABLE_SUMMARY, raw: text };
}

/** 围炉收束总结 */
async function summarizeRoundtable(topic, history = [], personaIds = []) {
  const transcript = history.map(h => `${h.speaker}：${h.text}`).join('\n');
  const names = personaIds.map(id => PERSONA_PROMPTS[id]?.name).filter(Boolean).join('、');

  const ai = await callAI(
    coachSystem(
      '总结一场圆桌讨论。严格按以下格式输出四行（每行冒号后1-2句话）：\n共识：\n分歧：\n还缺什么：\n建议下一步：'
    ),
    `话题：${topic}\n在席：${names || '嘉宾'}\n\n对话记录：\n${transcript || '（无）'}\n\n请总结：`
  );

  if (ai) {
    const parsed = parseSummarySections(ai);
    return { ...parsed, raw: ai, mode: 'ai' };
  }

  return { ...TEMPLATE_ROUNDTABLE_SUMMARY, raw: Object.entries(TEMPLATE_ROUNDTABLE_SUMMARY).map(([k, v]) => `${k}: ${v}`).join('\n'), mode: 'template' };
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

export { generatePrompts, expandIdea, analyzeRound, generateSmartAction, soloChallengeIdea, personaReply, pickPersonaResponders, summarizeRoundtable, getStatus, isAvailable };
