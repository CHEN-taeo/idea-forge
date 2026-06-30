/** 流萤 · 设计令牌 — Apple 分组美学 + 柔彩分类 */
const brand = require('./brand.js');

const TAG_PALETTE = ['#5B8DEF', '#E8A0B4', '#5AC8A8', '#A78BFA', '#F5B87A'];

const WELCOME_QUOTES = [
  '散落的光，值得被拾起',
  '灵感如萤，一闪即藏',
  '留白处，自有天地',
  '翻阅之间，收获发生',
  '一念落下，万象更新',
  '时光流逝，记忆留痕',
  '让念头，有处栖息'
];

const FILTER_PILLS = ['全部', '活动', '机会', '通知', '破壳', 'AI'];

const EASE_SPRING = 'cubic-bezier(0.34, 1.2, 0.64, 1)';

/** 分类色：饱和前景 + 12% 透明底，克制但有辨识度 */
const CATEGORY_COLORS = {
  lecture: { fg: '#3D7DD4', bg: 'rgba(61, 125, 212, 0.12)', label: '雾蓝' },
  competition: { fg: '#D4567A', bg: 'rgba(212, 86, 122, 0.12)', label: '蔷薇' },
  exhibition: { fg: '#8B6CC1', bg: 'rgba(139, 108, 193, 0.12)', label: '薰衣草' },
  notice: { fg: '#D4923A', bg: 'rgba(212, 146, 58, 0.12)', label: '暖杏' },
  ai: { fg: '#2EAD7A', bg: 'rgba(46, 173, 122, 0.12)', label: '薄荷' },
  poke: { fg: '#5B8DEF', bg: 'rgba(91, 141, 239, 0.14)', label: '破壳' },
  default: { fg: '#3D7DD4', bg: 'rgba(61, 125, 212, 0.10)', label: '默认' }
};

const LIGHT = {
  bgBase: '#F2F2F7',
  bgGlass: 'rgba(255, 255, 255, 0.72)',
  borderGlass: 'rgba(255, 255, 255, 0.85)',
  textPrimary: '#1C1C1E',
  textSecondary: 'rgba(60, 60, 67, 0.6)',
  accent: '#5B8DEF',
  accentSoft: 'rgba(91, 141, 239, 0.14)',
  cloudGray: '#AEAEB2'
};

const DARK = {
  bgBase: '#000000',
  bgGlass: 'rgba(28, 28, 30, 0.82)',
  borderGlass: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#F2F2F7',
  textSecondary: 'rgba(235, 235, 245, 0.6)',
  accent: '#6B9FFF',
  accentSoft: 'rgba(107, 159, 255, 0.18)',
  cloudGray: '#636366'
};

module.exports = {
  TAG_PALETTE,
  WELCOME_QUOTES,
  FILTER_PILLS,
  EASE_SPRING,
  CATEGORY_COLORS,
  LIGHT,
  DARK,
  BRAND_NAME: brand.NAME,
  BRAND_SLOGAN: brand.SLOGAN
};
