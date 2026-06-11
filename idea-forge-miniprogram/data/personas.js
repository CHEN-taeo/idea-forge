const PERSONAS = [
  { id: 'musk', name: '马斯克', emoji: '🚀', title: '第一性原理 · 颠覆者', blurb: '凡事追到物理本质，敢把目标定到看似不可能。', color: '#5eb3e6' },
  { id: 'huang', name: '黄仁勋', emoji: '💚', title: '算力 · 长期主义', blurb: '从算力与生态看趋势，押注长期。', color: '#7cd992' },
  { id: 'marx', name: '马克思', emoji: '⚒️', title: '批判 · 结构分析', blurb: '先看背后的生产关系与利益结构。', color: '#e07a5f' },
  { id: 'jobs', name: '乔布斯', emoji: '🍎', title: '产品 · 极简美学', blurb: '从用户体验出发，逼问「这真的重要吗」。', color: '#c084fc' },
  { id: 'socrates', name: '苏格拉底', emoji: '🏛️', title: '诘问 · 拆假设', blurb: '只用一连串追问让你自己发现逻辑漏洞。', color: '#f0c674' },
  { id: 'luxun', name: '鲁迅', emoji: '🖋️', title: '清醒 · 犀利', blurb: '一针见血戳破自欺，反对空话与麻木。', color: '#a8a29e' },
  { id: 'feynman', name: '费曼', emoji: '🔬', title: '好奇 · 讲清楚', blurb: '讲不清就是没懂，用最朴素的方式拆解。', color: '#4ecdc4' },
  { id: 'laozi', name: '老子', emoji: '☯️', title: '无为 · 反向思考', blurb: '从「少即是多」切入，顺势而非硬来。', color: '#d4a373' },
];

function getPersona(id) {
  return PERSONAS.find(p => p.id === id);
}

module.exports = { PERSONAS, getPersona };
