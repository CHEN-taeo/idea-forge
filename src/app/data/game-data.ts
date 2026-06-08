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

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  'Visionary': 'Think big, imagine the future, push boundaries',
  'Pragmatist': 'Focus on feasibility, resources, and implementation',
  'Contrarian': 'Challenge assumptions, find flaws, play devil\'s advocate',
  'Connector': 'Link ideas, find synergies, build on others',
  'Analyst': 'Data-driven, logical, systematic thinking',
  'Storyteller': 'Craft narratives, create emotional resonance',
  'Builder': 'Focus on MVP, prototypes, hands-on solutions',
  'Wildcard': 'Break the rules, think laterally, surprise everyone'
};

export const INSPIRATION_CARDS = [
  'What if cost was irrelevant?',
  'What would a 5-year-old do?',
  'Reverse the process entirely',
  'What if you had unlimited time?',
  'Make it 10x worse, then fix it',
  'What would nature do?',
  'Remove the most obvious constraint',
  'What if everyone already loved this?',
  'Combine with something totally unrelated',
  'What if this was a game?',
  'Design for the opposite user',
  'What breaks if you scale to 1 billion users?',
  'Make it invisible',
  'What would a rival company never do?',
  'Turn competitors into collaborators',
  'What if you only had 1 day?',
  'Assume the opposite is true',
  'What would make this addictive?',
  'Design the failure case first',
  'What if users could remix everything?'
];

export const GOLD_CARDS = [
  '🎯 Double Down: Your next idea submission counts for 2x points',
  '💡 Copycat: Immediately copy and adapt another idea for +3',
  '🛡️ Immunity: Protect one of your ideas from elimination this round',
  '🔄 Role Swap: Switch roles with another player',
  '⚡ Speed Bonus: Submit 2 ideas this round instead of 1',
  '🎲 Wild Card: Draw 3 extra inspiration cards',
  '👥 Coalition: Form a team with another player for shared points',
  '🔮 Preview: See all submitted ideas before making your move'
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
