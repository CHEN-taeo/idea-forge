import { Role } from '../types/game';

export const ROLES: Role[] = [
  'Visionary',
  'Pragmatist',
  'Contrarian',
  'Connector',
  'Analyst',
  'Storyteller',
  'Builder',
  'Wildcard'
];

export const ROLE_LABELS: Record<Role, string> = {
  'Visionary': '远见者',
  'Pragmatist': '务实派',
  'Contrarian': '反对派',
  'Connector': '连接者',
  'Analyst': '分析师',
  'Storyteller': '叙事者',
  'Builder': '建造者',
  'Wildcard': '野路子'
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  'Visionary': '想得大一点，描绘未来，突破边界',
  'Pragmatist': '关注可行性、资源和落地路径',
  'Contrarian': '挑战假设，找漏洞，唱反调',
  'Connector': '串联想法，找协同，站在他人肩膀上',
  'Analyst': '用数据和逻辑，系统化思考',
  'Storyteller': '讲故事，创造情感共鸣',
  'Builder': '聚焦最小可行方案、原型和动手做',
  'Wildcard': '打破规则，横向思考，出人意料'
};

export const INSPIRATION_CARDS = [
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
  '把对手变成合作伙伴',
  '如果只有 1 天时间，你会做什么？',
  '假设现状完全相反是真的',
  '怎样让人上瘾式地使用它？',
  '先设计失败场景，再倒推成功',
  '如果用户能 remix 一切会怎样？'
];

export const GOLD_CARDS = [
  '🎯 加倍：下一条提交的想法计双倍分',
  '💡 跟风：立刻改造他人想法，+3 分',
  '🛡️ 护盾：保护一条想法本轮不被淘汰',
  '🔄 换角：与另一位玩家交换角色',
  '⚡ 加速：本轮可提交 2 条想法',
  '🎲 野卡：再抽 3 张灵感卡',
  '👥 结盟：与另一位玩家共享积分',
  '🔮 预览：行动前先看所有已提交想法'
];

export const SCORING_RULES = {
  IDEA_SUBMITTED: 1,
  IDEA_VOTED: 1,
  CORRECT_GUESS: 2,
  ADAPTED_IDEA: 1,
  ENDORSED_ADAPTATION: 2,
  ENDORSING_ADAPTER: 2,
  SUCCESSFUL_CHALLENGE: 3,
  SUCCESSFUL_DEFENSE: 2,
  MVP_BONUS: 3,
  FINALIST: 1
};
