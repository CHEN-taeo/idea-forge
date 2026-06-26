# 围炉群英会 · 角色立绘资产

> 设计语言：[`docs/构想熔炉-设计语言.md`](../../docs/构想熔炉-设计语言.md)  
> 风格：**Q 版半身 · 水墨淡彩 · 炉光自下而上**

## 文件命名

| 文件 | 说明 |
|------|------|
| `{id}.png` | 默认立绘（必须） |
| `{id}-thinking.png` | 思考中（可选 v2） |
| `{id}-speaking.png` | 发言中（可选 v2） |

`id` 与 `src/app/data/personas.ts` 一致：`musk`, `huang`, `marx`, `jobs`, `socrates`, `luxun`, `feynman`, `laozi`。

## 技术规格

- 尺寸：**512×512 px**
- 格式：**PNG，透明背景**
- 主体居中，头部占画面约 60%
- 去掉白底：remove.bg 或 PS 抠图

## 统一风格后缀（Midjourney / SD）

```
chibi half-body character portrait, Chinese ink wash light color illustration,
flat clean shapes, warm charcoal firelight from below left, soft round face,
expressive but restrained, game card art, transparent background,
single character centered, no text, no watermark --ar 1:1 --stylize 200
```

## 分角色描述（接在统一后缀前）

### musk · 天青
Visionary tech founder, swept-back dark hair, black casual blazer, sharp confident eyes, subtle rocket motif, cool blue accent glow.

### huang · 竹青
Semiconductor leader, black leather jacket, warm squint smile, green circuit chip particles, calm powerful presence.

### marx · 赭石
19th century philosopher, large bushy beard, Victorian dark coat, serious brow, faint red structural motif, intellectual intensity.

### jobs · 丁香
Minimalist product visionary, black turtleneck, round glasses, focused perfectionist gaze, purple soft aura, apple silhouette hint.

### socrates · 藤黄
Ancient Greek philosopher, white draped toga shoulders, curly beard, raised eyebrow questioning look, golden laurel wreath.

### luxun · 玄青
Sharp Chinese writer, flat-top hair, thin mustache, dark zhongshan collar, cold piercing eyes, ink brush detail, grey cool tones.

### feynman · 湖蓝
Playful physicist, messy wavy hair, big cheerful smile, open casual shirt, teal sparkles, curious excited eyebrows.

### laozi · 秋香
Taoist sage, long white beard, bald head, long white eyebrows, loose earthy robe, serene half-closed eyes, yin-yang hint, misty calm.

## 设计师 Brief

- 8 角色 × 1 状态（v1）= 8 张；完整 8×3 = 24 张
- 禁止写实照片感；保持抽象卡通，降低肖像权风险
- 交付后覆盖本目录同名 PNG，**无需改代码**
