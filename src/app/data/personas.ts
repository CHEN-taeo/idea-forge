// ---------------------------------------------------------------------------
// 圆桌对谈 · 人物库（前端展示数据）
// 注意：人物的「AI 说话风格 prompt」在后端 ai.js 中按相同 id 维护。
// 这里只放展示用信息：立绘(SVG)、名字、头衔、性格、主题色。
// emoji 保留用于导出报告；界面头像见 PersonaPortrait.tsx
// ---------------------------------------------------------------------------

export interface Persona {
  id: string;
  name: string;
  emoji: string;
  title: string;
  /** 一句话性格 / 视角 */
  blurb: string;
  /** 主题色（头像光晕、气泡边框） */
  color: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'musk',
    name: '马斯克',
    emoji: '🚀',
    title: '第一性原理 · 颠覆者',
    blurb: '凡事追到物理本质，敢把目标定到看似不可能，讨厌冗余流程。',
    color: '#5eb3e6',
  },
  {
    id: 'huang',
    name: '黄仁勋',
    emoji: '💚',
    title: '算力 · 长期主义',
    blurb: '从算力与生态看趋势，强调押注长期、亲自下场、把困难当护城河。',
    color: '#7cd992',
  },
  {
    id: 'marx',
    name: '马克思',
    emoji: '⚒️',
    title: '批判 · 结构分析',
    blurb: '先看背后的生产关系与利益结构，追问「谁受益、谁被异化」。',
    color: '#e07a5f',
  },
  {
    id: 'jobs',
    name: '乔布斯',
    emoji: '🍎',
    title: '产品 · 极简美学',
    blurb: '从用户体验和直觉出发，逼问「这真的重要吗」，砍掉一切多余。',
    color: '#c084fc',
  },
  {
    id: 'socrates',
    name: '苏格拉底',
    emoji: '🏛️',
    title: '诘问 · 拆假设',
    blurb: '不给答案，只用一连串追问让你自己发现逻辑漏洞。',
    color: '#f0c674',
  },
  {
    id: 'luxun',
    name: '鲁迅',
    emoji: '🖋️',
    title: '清醒 · 犀利',
    blurb: '一针见血戳破自欺，关心真实的人，反对空话与麻木。',
    color: '#a8a29e',
  },
  {
    id: 'feynman',
    name: '费曼',
    emoji: '🔬',
    title: '好奇 · 讲清楚',
    blurb: '坚持「讲不清就是没懂」，用最朴素的方式拆解复杂问题。',
    color: '#4ecdc4',
  },
  {
    id: 'laozi',
    name: '老子',
    emoji: '☯️',
    title: '无为 · 反向思考',
    blurb: '从「少即是多」「以退为进」切入，提醒你顺势而非硬来。',
    color: '#d4a373',
  },
];

export function getPersona(id: string): Persona | undefined {
  return PERSONAS.find(p => p.id === id);
}
