const { PERSONAS } = require('./personas');

const INSPIRATION_CARDS = [
  '如果成本不是问题，你会怎么做？',
  '一个 5 岁小孩会怎么解决？',
  '把整个流程反过来会怎样？',
  '如果时间无限，你会怎么做？',
  '先把它搞砸 10 倍，再想办法修',
  '大自然会怎么处理这个问题？',
  '去掉最明显的限制条件',
  '如果所有人已经爱死这个方案呢？',
  '和完全无关的领域结合会怎样？',
  '如果这是一个游戏，规则是什么？',
  '为相反的用户群体设计',
  '如果用户规模到 10 亿，哪里会先崩？',
  '让它隐形——用户感觉不到它的存在',
  '竞争对手绝对不会做的事是什么？',
  '如果只能保留一个功能，留哪个？',
];

const ROLE_LABELS = {
  Visionary: '远见者',
  Pragmatist: '务实派',
  Contrarian: '反对派',
  Connector: '连接者',
  Analyst: '分析师',
  Storyteller: '叙事者',
  Builder: '建造者',
  Wildcard: '野路子',
};

const GUIDED_QUESTION_SETS = {
  product: { label: '产品决策', questions: ['我们的用户最痛恨产品的哪一点？', '如果我们只能保留一个功能，是哪个？', '竞争对手绝对不会做的事，我们应该做吗？'] },
  strategy: { label: '战略规划', questions: ['5年后，我们希望被记住的是什么？', '什么是现在最大的风险？', '如果资源减半，我们会首先砍掉什么？'] },
  retrospective: { label: '团队回顾', questions: ['上个季度我们最骄傲的是什么？', '如果重来，我们会改变什么？', '团队的超能力是什么？盲点是什么？'] },
};

const PRESETS = [
  { label: '创业三角', desc: '颠覆 × 产品 × 算力', ids: ['musk', 'jobs', 'huang'] },
  { label: '思辨之夜', desc: '诘问 × 批判 × 清醒', ids: ['socrates', 'marx', 'luxun'] },
  { label: '悟道组合', desc: '好奇 × 无为 × 讲清楚', ids: ['feynman', 'laozi', 'socrates'] },
];

const STARTER_PROMPTS = [
  '我目前最纠结的是……',
  '如果只能选一个方向，你会怎么选？',
  '请从各自的角度，给这条路径泼一盆冷水。',
];

function getPersona(id) {
  return PERSONAS.find(p => p.id === id);
}

module.exports = {
  INSPIRATION_CARDS,
  ROLE_LABELS,
  GUIDED_QUESTION_SETS,
  PRESETS,
  STARTER_PROMPTS,
  getPersona,
};
