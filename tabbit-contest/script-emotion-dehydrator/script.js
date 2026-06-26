/**
 * Tabbit 妙招：评论区情绪脱水机
 * 适用：知乎、B站、新闻站等带评论区的页面
 * 将高情绪评论折叠为 🧽 脱水摘要气泡，保留事实性评论
 */
(function () {
  'use strict';

  const STYLE_ID = 'poke-emotion-dehydrator-style';
  const PROCESSED = 'data-poke-dehydrated';
  const BUBBLE_CLASS = 'poke-dehydrate-bubble';

  const EMOTION_RE = /(哈哈哈|笑死|破防|绝了|无语|服了|太真实|泪目|吃瓜|蹲一个|啊啊啊|！！！|emoji|😭|🤣|👍|❤)/;
  const FACT_RE = /(\d+[%％]|\d{4}年|\d+月\d+日|据.*报道|研究|数据|因为.*所以|我认为|经验|步骤|第一|第二)/;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .${BUBBLE_CLASS} {
        display: inline-block;
        max-width: 100%;
        margin: 4px 0;
        padding: 6px 10px;
        border-radius: 12px;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border: 1px dashed #7dd3fc;
        color: #0369a1;
        font-size: 13px;
        line-height: 1.5;
        cursor: pointer;
      }
      .${BUBBLE_CLASS}:hover { background: #e0f2fe; }
      .poke-dehydrate-hidden { display: none !important; }
      .poke-dehydrate-toolbar {
        position: fixed; bottom: 16px; right: 16px; z-index: 99999;
        background: #0f172a; color: #f8fafc; padding: 10px 14px;
        border-radius: 12px; font-size: 13px; box-shadow: 0 4px 20px rgba(0,0,0,.25);
      }
    `;
    document.head.appendChild(style);
  }

  function emotionScore(text) {
    const t = (text || '').trim();
    if (t.length < 2) return 1;
    let score = 0;
    if (EMOTION_RE.test(t)) score += 0.4;
    if (/！{2,}/.test(t) || /!{2,}/.test(t)) score += 0.2;
    if (t.length < 15 && !FACT_RE.test(t)) score += 0.3;
    if (FACT_RE.test(t)) score -= 0.35;
    if (/\d/.test(t)) score -= 0.15;
    return Math.max(0, Math.min(1, score));
  }

  function dehydrate(text) {
    const t = (text || '').trim();
    const len = t.length;
    if (len <= 20) return '🧽 情绪气泡（短评）';
    const themes = [];
    if (/支持|赞同|同意/.test(t)) themes.push('支持');
    if (/反对|不同意|离谱/.test(t)) themes.push('质疑');
    if (/羡慕|嫉妒|酸/.test(t)) themes.push('羡慕');
    if (/感动|泪|心疼/.test(t)) themes.push('共情');
    if (/笑|哈|搞笑/.test(t)) themes.push('玩梗');
    if (!themes.length) themes.push('情绪反应');
    return '🧽 脱水：' + themes.slice(0, 2).join('+') + ' · 原文 ' + len + ' 字（点击展开）';
  }

  function pickCommentNodes() {
    const selectors = [
      '.CommentItem', '.CommentContent', '.reply-content',
      '.comment-content', '.text-con', '[class*="comment"] [class*="content"]',
      '.List-item .RichContent', '.reply-item .content',
    ];
    const nodes = [];
    const seen = new Set();
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (seen.has(el) || el.closest('.' + BUBBLE_CLASS)) return;
        const text = (el.innerText || '').trim();
        if (text.length < 4 || text.length > 800) return;
        seen.add(el);
        nodes.push(el);
      });
    });
    return nodes;
  }

  function processNode(el) {
    if (el.getAttribute(PROCESSED)) return false;
    const text = (el.innerText || '').trim();
    const score = emotionScore(text);
    if (score < 0.55) {
      el.setAttribute(PROCESSED, 'skip');
      return false;
    }

    const bubble = document.createElement('div');
    bubble.className = BUBBLE_CLASS;
    bubble.textContent = dehydrate(text);
    bubble.title = '点击展开原文';

    const original = document.createElement('div');
    original.className = 'poke-dehydrate-hidden';
    original.innerHTML = el.innerHTML;

    bubble.addEventListener('click', () => {
      const hidden = bubble.nextElementSibling;
      if (hidden && hidden.classList.contains('poke-dehydrate-hidden')) {
        const showing = !hidden.classList.contains('poke-dehydrate-hidden');
        if (showing) {
          hidden.classList.add('poke-dehydrate-hidden');
          bubble.textContent = dehydrate(text);
        } else {
          hidden.classList.remove('poke-dehydrate-hidden');
          bubble.textContent = '🧽 点击收起';
        }
      }
    });

    el.innerHTML = '';
    el.appendChild(bubble);
    el.appendChild(original);
    el.setAttribute(PROCESSED, 'yes');
    return true;
  }

  function showToolbar(dehydrated, scanned) {
    let bar = document.querySelector('.poke-dehydrate-toolbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'poke-dehydrate-toolbar';
      document.body.appendChild(bar);
    }
    bar.textContent = '🧽 脱水 ' + dehydrated + '/' + scanned + ' 条 · 点击气泡展开';
  }

  injectStyles();
  const nodes = pickCommentNodes();
  let n = 0;
  nodes.forEach((el) => { if (processNode(el)) n++; });
  showToolbar(n, nodes.length);
  console.log('[poke-emotion-dehydrator] 扫描 ' + nodes.length + ' 条，脱水 ' + n + ' 条');
})();
