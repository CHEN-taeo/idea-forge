const DUE_DAY_OPTIONS = [7, 14, 30];

const VAGUE_PREFIX = /^(想想|考虑|研究一下|讨论|尽量|可能|看看|了解一下)/;

function formatSmartAction(playerName, what, dueDays) {
  return `${playerName.trim()} 将在 ${dueDays} 天内：${what.trim()}`;
}

function validateSmartCommitment(what, dueDays) {
  const trimmed = (what || '').trim();
  if (!trimmed || trimmed.length < 8) {
    return '请描述具体行动（至少 8 个字）';
  }
  if (DUE_DAY_OPTIONS.indexOf(dueDays) < 0) {
    return '请选择完成期限';
  }
  if (VAGUE_PREFIX.test(trimmed)) {
    return '请用可执行表述，避免「想想、讨论」等模糊承诺';
  }
  return null;
}

module.exports = {
  DUE_DAY_OPTIONS,
  formatSmartAction,
  validateSmartCommitment,
};
