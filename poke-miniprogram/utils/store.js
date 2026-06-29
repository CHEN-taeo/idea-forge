const KEY = 'poke.v1';

function pad(n) { return (n < 10 ? '0' : '') + n; }
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function genUid() { return 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function seed() {
  const t = todayStr();
  const days = {};
  days[t] = [
    { id: 'a1', cat: '活动', poke: false, title: '机械工程学院 · 智能制造前沿讲座',
      summary: 'AI 摘要：上海交大教授分享数字孪生在产线上的落地，含 Q&A。和你的专业高度相关，适合写进简历的谈资。',
      time: '今天 18:30', place: '三号楼 报告厅', tags: ['专业相关', '可写简历'] },
    { id: 'a2', cat: '机会', poke: false, title: '某科技公司开放日报名',
      summary: '面向理工科，含参观与简历投递机会。', time: '周六 14:00', place: '线上报名', tags: ['实习', '机会'] },
    { id: 'a3', cat: '通知', poke: false, title: '国家奖学金申请 · 截止倒计时 3 天',
      summary: 'AI 摘要：从一堆群通知里挑出来的硬信息——你符合 GPA 门槛，材料还差一份个人陈述。别错过。',
      time: '截止 周四 17:00', place: '学院教务办 / 线上提交', tags: ['钱', '别错过'] }
  ];
  const pokeOfDay = {};
  pokeOfDay[t] = { id: 'p1', cat: '破壳', poke: true, title: '隔壁服装学院的「面料创新工坊」开放旁听',
    summary: 'AI 给你塞了条圈外的：机械 × 材料 × 设计的交叉地带，正在出新东西。跨出专业茧房，常常是灵感的来源。',
    time: '明天 14:00', place: '纺织学院 创新中心', tags: ['跨学科', '打破茧房'] };
  return {
    meName: '我',
    days: days,
    pokeOfDay: pokeOfDay,
    eng: {},
    others: { a1: 6, a2: 3, a3: 2, p1: 1 },
    othersBuddy: { a2: 3, a1: 1 },
    buddyNames: { a2: ['林·材料', '韬·机械', '小鹿·设计'], a1: ['阿哲·机械'] },
    reflect: {},
    log: { goClicks: 0, buddyClicks: 0 }
  };
}

function migrate(r) {
  const t = todayStr();
  if (!r.days) r.days = {};
  if (!r.days[t]) r.days[t] = clone(seed().days[t]);
  if (!r.pokeOfDay) r.pokeOfDay = {};
  if (!r.pokeOfDay[t]) r.pokeOfDay[t] = clone(seed().pokeOfDay[t]);
  r.eng = r.eng || {};
  r.others = r.others || {};
  r.othersBuddy = r.othersBuddy || {};
  r.buddyNames = r.buddyNames || {};
  r.reflect = r.reflect || {};
  r.log = r.log || { goClicks: 0, buddyClicks: 0 };
  r.meName = r.meName || '我';
  r.uid = r.uid || genUid();
  r.cache = r.cache || {};
  r.interests = r.interests || []; // 关注方向：竞赛/创业/展览/讲座/专业相关/机会嗅探
  r.aiInterests = r.aiInterests || []; // AI 关注：Agent/Cursor/IDE/开源项目/播客/模型
  return r;
}

function interestQuery(S) {
  return (S.interests && S.interests.length) ? { interests: S.interests.join(',') } : {};
}

function aiInterestQuery(S) {
  return (S.aiInterests && S.aiInterests.length) ? { aiInterests: S.aiInterests.join(',') } : {};
}

function aiPulseSamples() {
  return [
    { id: 'ai_s1', cat: 'AI脉动', lane: 'ai', aiTopic: '妙招', platform: 'rss',
      title: 'Cursor Rules：用 .mdc 固化你的代码风格',
      summary: '社区热议：把团队规范写进 rules，每次对话自动遵守，减少反复纠正。',
      tags: ['妙招', 'Cursor'], pulseScore: 72,
      pulseReasons: [{ label: '⚡ 24h 新发' }, { label: '✨ 匹配关注：Cursor/IDE' }],
      url: 'https://cursor.com', time: '', place: '', deadline: '' },
    { id: 'ai_s2', cat: 'AI脉动', lane: 'ai', aiTopic: '开源', platform: 'github',
      title: 'MCP 服务器合集：一键接工具到 Claude',
      summary: 'GitHub 本周 Star 上涨：把文件系统、数据库、浏览器接到 Agent 的标准协议实践。',
      tags: ['开源', 'MCP', 'Agent'], pulseScore: 68, stars: 1200,
      pulseReasons: [{ label: '⭐ 热门开源' }, { label: '🌐 GITHUB' }],
      url: 'https://github.com', time: '', place: '', deadline: '' },
    { id: 'ai_s3', cat: 'AI脉动', lane: 'ai', aiTopic: '大家在用', platform: 'hn',
      title: 'Show HN：用 AI Agent 自动写周报',
      summary: 'HN 热议：从 Git commit + 日历生成周报草稿，人在回路只改 20%。',
      tags: ['大家在用', '工作流'], pulseScore: 55,
      pulseReasons: [{ label: '📅 本周新发' }],
      url: 'https://news.ycombinator.com', time: '', place: '', deadline: '' }
  ];
}

function aiDigestSample() {
  return {
    title: '本周 AI 脉动（离线示例）',
    summary: '• Cursor Rules 固化代码风格（妙招）\n• MCP 服务器合集热度上升（开源）\n• AI Agent 自动写周报引热议（大家在用）',
    highlights: []
  };
}

const COVER_MAP = {
  lecture: '/assets/cover-lecture.svg',
  competition: '/assets/cover-competition.svg',
  exhibition: '/assets/cover-exhibition.svg',
  notice: '/assets/cover-notice.svg',
  ai: '/assets/cover-ai.svg',
  default: '/assets/cover-default.svg'
};

function coverSrc(it) {
  if (it && it.imageUrl) return it.imageUrl;
  const type = (it && it.coverType) || 'default';
  return COVER_MAP[type] || COVER_MAP.default;
}

function coverIsRemote(src) {
  return src && /^https?:\/\//i.test(src);
}

// 把「后端富化过的 item」映射成卡片视图
function serverCardVM(it) {
  const gapReasons = (it.gapReasons || it.pulseReasons || []).map(r => (typeof r === 'string' ? r : r.label)).filter(Boolean);
  const thumb = coverSrc(it);
  return {
    id: it.id, cat: it.cat, eventType: it.eventType || it.aiTopic || '', poke: !!it.poke,
    title: it.title, summary: it.summary,
    time: it.time, place: it.place, deadline: it.deadline || '', price: it.price || '',
    tags: it.tags || [], pokeReason: it.pokeReason || '',
    insiderNote: it.insiderNote || '', gapScore: it.gapScore || it.pulseScore || 0,
    gapReasons: gapReasons.slice(0, 2), deadlineTier: it.deadlineTier || '',
    platform: it.platform || '', url: it.url || '', aiTopic: it.aiTopic || '',
    room: it.room || '', lane: it.lane || '',
    coverType: it.coverType || 'default',
    imageUrl: it.imageUrl || '',
    thumbSrc: thumb,
    thumbRemote: coverIsRemote(thumb),
    daysToDeadline: it.daysToDeadline
  };
}

function fmtTs(ts) {
  const d = new Date(ts);
  const pad = (n) => (n < 10 ? '0' : '') + n;
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function detailVM(it) {
  if (!it) return null;
  const gapReasons = (it.gapReasons || it.pulseReasons || []).map(r => (typeof r === 'string' ? r : r.label)).filter(Boolean);
  const base = serverCardVM(it);
  const detail = it.detail || {};
  const lede = detail.lede || it.summary || '';
  const highlights = (detail.highlights && detail.highlights.length)
    ? detail.highlights
    : [it.time, it.place, it.deadline, it.price].filter(Boolean);
  return Object.assign({}, base, {
    rawText: it.rawText || '',
    gapReasonsFull: gapReasons,
    stars: it.stars || 0,
    engine: it.engine || '',
    createdAt: it.ts ? fmtTs(it.ts) : '',
    confidence: typeof it.confidence === 'number' ? Math.round(it.confidence * 100) : 0,
    detailLede: lede,
    whoFor: detail.whoFor || [],
    actions: detail.actions || [],
    highlights: highlights,
    caveats: detail.caveats || [],
    coverSrc: coverSrc(it),
    coverRemote: coverIsRemote(coverSrc(it)),
    daysToDeadline: it.daysToDeadline,
    deadlineUrgent: typeof it.daysToDeadline === 'number' && it.daysToDeadline >= 0 && it.daysToDeadline <= 3
  });
}

// 缓存后端 items，让其它页面能按 id 还原
function cacheItems(S, items) {
  S.cache = S.cache || {};
  (items || []).forEach(it => { if (it && it.id) S.cache[it.id] = it; });
}

function load() {
  try {
    const r = wx.getStorageSync(KEY);
    if (r && r.days) return migrate(r);
  } catch (e) {}
  return seed();
}
function save(S) { wx.setStorageSync(KEY, S); }
function reset() { const s = seed(); save(s); return s; }

function eng(S, id) {
  if (!S.eng[id]) S.eng[id] = { go: false, buddy: false, attended: false };
  return S.eng[id];
}

function todayItems(S) {
  const arr = (S.days[todayStr()] || []).slice();
  const p = S.pokeOfDay[todayStr()];
  if (p) arr.push(p);
  return arr;
}
function allItemsById(S, id) {
  if (S.cache && S.cache[id]) return S.cache[id];
  for (const d in S.days) {
    const f = (S.days[d] || []).find(x => x.id === id);
    if (f) return f;
  }
  for (const d in S.pokeOfDay) {
    if (S.pokeOfDay[d] && S.pokeOfDay[d].id === id) return S.pokeOfDay[d];
  }
  return null;
}

const COG_QS = [
  '这件事最让你意外的一点是什么？用一句话说清楚。',
  '它和你已有的知识，能连起来的一个点是？',
  '如果要讲给一个不懂的朋友听，你会怎么概括？',
  '它有没有改变你原来的某个看法？哪一个？',
  '下一步，你会因为它做一个什么小行动？'
];
function cogQ(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % COG_QS.length;
  return COG_QS[h];
}

function cardVM(S, it) {
  const thumb = coverSrc(it);
  return {
    id: it.id, cat: it.cat, poke: !!it.poke, title: it.title, summary: it.summary,
    time: it.time, place: it.place, deadline: it.deadline || '', price: it.price || '',
    tags: it.tags || [], pokeReason: it.pokeReason || '',
    gapReasons: [], insiderNote: '',
    url: it.url || '', room: it.room || '',
    coverType: it.coverType || 'default',
    thumbSrc: thumb,
    thumbRemote: coverIsRemote(thumb)
  };
}

function fmtDate() {
  const d = new Date();
  const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + wk;
}

module.exports = {
  todayStr, clone, load, save, reset, eng, todayItems, allItemsById,
  cogQ, cardVM, serverCardVM, detailVM, coverSrc, fmtDate, cacheItems, interestQuery, aiInterestQuery,
  aiPulseSamples, aiDigestSample
};
