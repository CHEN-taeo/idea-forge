# 构想熔炉 · 微信小程序

暖色编辑风 UI（奶油底 + 陶土强调色 + 衬线标题），适配微信 tap 规范。

## 运行

```bash
# 仓库根目录
npm run server
```

微信开发者工具 → 导入本目录 → **不校验合法域名**

`utils/config.js` → `SERVER_URL`（真机用局域网 IP）

## 设计

| Token | 值 | 用途 |
|-------|-----|------|
| canvas | `#faf9f5` | 页面底 |
| card | `#efe9de` | 卡片 |
| accent | `#c4673a` | 主按钮 / 强调 |
| ink | `#141413` | 正文 |

交互使用 `<view bindtap>` 替代原生 `button`，避免微信默认样式导致点不动、重叠。

## 页面

- `index` — 模式入口（tile 列表，无重叠卡片）
- `create` — 发起围炉（独立页）
- `solo` / `roundtable` — AI 模式
- `join` / `room` — 多人 Socket.IO
