/**
 * Tabbit 妙招：截止日！通知页倒计时
 * 适用：*.edu.cn 通知列表页（树维 CMS / 常见 list 结构）
 * 用法：在通知列表页运行脚本，每条通知旁显示「还剩 X 天」彩色标签
 * 规则与 poke-server/src/lib/deadline.js 对齐
 */
(function () {
  'use strict';

  const STYLE_ID = 'poke-deadline-radar-style';
  const BADGE_CLASS = 'poke-deadline-badge';

  const COLORS = {
    safe: { bg: '#dcfce7', fg: '#166534', label: '安全' },
    warn: { bg: '#ffedd5', fg: '#c2410c', label: '注意' },
    urgent: { bg: '#fee2e2', fg: '#b91c1c', label: '紧急' },
    critical: { bg: '#fecaca', fg: '#7f1d1d', label: '最后冲刺', pulse: true },
    unknown: { bg: '#f3f4f6', fg: '#6b7280', label: '日期未知' },
  };

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .${BADGE_CLASS} {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.4;
        vertical-align: middle;
        white-space: nowrap;
      }
      .${BADGE_CLASS}.pulse {
        animation: poke-dl-pulse 1.2s ease-in-out infinite;
      }
      @keyframes poke-dl-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.03); }
      }
    `;
    document.head.appendChild(style);
  }

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function daysUntil(target) {
    const today = startOfDay(new Date());
    const end = startOfDay(target);
    return Math.round((end - today) / 86400000);
  }

  function parseRelative(text, baseDate) {
    const now = baseDate || new Date();
    const wd = ['日', '一', '二', '三', '四', '五', '六'];
    const m = text.match(/(?:本|这|下)?周([一二三四五六日天])/);
    if (m) {
      const target = wd.indexOf(m[1] === '天' ? '日' : m[1]);
      if (target < 0) return null;
      let day = now.getDay();
      let add = target - day;
      if (text.includes('下') && add <= 0) add += 7;
      if (!text.includes('下') && add < 0) add += 7;
      const d = new Date(now);
      d.setDate(d.getDate() + add);
      return d;
    }
    if (/明天/.test(text)) {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return d;
    }
    if (/后天/.test(text)) {
      const d = new Date(now);
      d.setDate(d.getDate() + 2);
      return d;
    }
    return null;
  }

  function extractDeadlineDate(text) {
    if (!text) return null;
    const t = text.replace(/\s+/g, ' ');
    const year = new Date().getFullYear();
    const candidates = [];

    const reFull = /(\d{4})年(\d{1,2})月(\d{1,2})日/g;
    let m;
    while ((m = reFull.exec(t))) candidates.push(new Date(+m[1], +m[2] - 1, +m[3]));

    const reIso = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/g;
    while ((m = reIso.exec(t))) candidates.push(new Date(+m[1], +m[2] - 1, +m[3]));

    const reMd = /(?:截至|截止|报名|提交|于)?\s*(\d{1,2})月(\d{1,2})日?/g;
    while ((m = reMd.exec(t))) {
      const d = new Date(year, +m[1] - 1, +m[2]);
      if (d < startOfDay(new Date()) && !t.includes(String(year))) d.setFullYear(year + 1);
      candidates.push(d);
    }

    const reShort = /\b(\d{2})-(\d{2})\b/g;
    while ((m = reShort.exec(t))) {
      const mo = +m[1], da = +m[2];
      if (mo >= 1 && mo <= 12 && da >= 1 && da <= 31) {
        let d = new Date(year, mo - 1, da);
        if (d < startOfDay(new Date())) d.setFullYear(year + 1);
        candidates.push(d);
      }
    }

    const rel = parseRelative(t);
    if (rel) candidates.push(rel);

    const valid = candidates.filter((d) => !isNaN(d.getTime()));
    if (!valid.length) return null;

    const today = startOfDay(new Date());
    const future = valid.filter((d) => startOfDay(d) >= today);
    const pool = future.length ? future : valid;
    pool.sort((a, b) => a - b);
    return pool[0];
  }

  function deadlineTier(days) {
    if (days === null || days === undefined) return 'unknown';
    if (days < 0) return 'past';
    if (days <= 2) return 'critical';
    if (days <= 7) return 'urgent';
    if (days <= 14) return 'warn';
    return 'safe';
  }

  function badgeText(days, tier) {
    if (tier === 'unknown') return '日期未知';
    if (tier === 'past') return '已过期';
    if (days === 0) return '今天截止';
    if (days === 1) return '还剩 1 天';
    return '还剩 ' + days + ' 天';
  }

  function makeBadge(days, tier) {
    const c = COLORS[tier] || COLORS.unknown;
    const span = document.createElement('span');
    span.className = BADGE_CLASS + (c.pulse ? ' pulse' : '');
    span.style.background = c.bg;
    span.style.color = c.fg;
    span.title = COLORS[tier] ? COLORS[tier].label : '未知';
    span.textContent = '⏰ ' + badgeText(days, tier);
    return span;
  }

  function pickListItems() {
    const selectors = [
      '.news_list li a',
      '.list li a',
      'ul.list li a',
      '.wp_article_list li a',
      '.Article_List li a',
      'table tr td a',
      '.lm_list li a',
      'li a[href*="info"]',
      'li a[href*="/tzgg/"]',
      'li a[href*=".htm"]',
    ];
    const seen = new Set();
    const items = [];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach((a) => {
        if (seen.has(a)) return;
        const text = (a.textContent || '').trim();
        if (text.length < 4 || text.length > 120) return;
        if (/首页|更多|下一页|上一页|尾页/.test(text)) return;
        seen.add(a);
        items.push(a);
      });
    }
    return items;
  }

  function annotate() {
    injectStyles();
    const links = pickListItems();
    let n = 0;
    links.forEach((a) => {
      const row = a.closest('li') || a.parentElement;
      if (!row || row.querySelector('.' + BADGE_CLASS)) return;
      const text = (a.textContent || '') + ' ' + (a.getAttribute('title') || '');
      const date = extractDeadlineDate(text);
      let days = null;
      let tier = 'unknown';
      if (date) {
        days = daysUntil(date);
        tier = deadlineTier(days);
      } else if (/(截止|报名|提交|ddl|deadline)/i.test(text)) {
        tier = 'unknown';
      } else {
        return;
      }
      row.appendChild(makeBadge(days, tier));
      n++;
    });
    return n;
  }

  const count = annotate();
  if (count === 0) {
    console.warn('[poke-deadline-radar] 未找到可标注的通知项。请确认在 *.edu.cn 列表页，或列表 DOM 与常见 CMS 不同。');
  } else {
    console.log('[poke-deadline-radar] 已标注 ' + count + ' 条');
  }
})();
