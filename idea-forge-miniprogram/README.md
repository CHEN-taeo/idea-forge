# 炉边 · 微信小程序

暖色编辑风（`#faf9f5` + `#c4673a` + Georgia/Songti）。主路径：**拾念 → 名士围炉 → 落契**；次路径：**入炉**（多人）。

## 本地开发

```bash
# 仓库根目录
npm run server
```

微信开发者工具 → 导入 **`idea-forge-miniprogram/`** → 勾选 **不校验合法域名**

`utils/config.js` → 模拟器用 `127.0.0.1:3001`；真机用电脑局域网 IP。

## 上传发布

见 **[UPLOAD.md](./UPLOAD.md)**（配置 HTTPS、`PROD_SERVER_URL`、开发者工具上传、提审文案）。

## 页面

| 页面 | 作用 |
|------|------|
| `index` | 首页入口 |
| `spark` | 拾念 |
| `roundtable` | 名士围炉 |
| `room-entry` | 入炉（主持/加入） |
| `room` | 多人围炉进行中 |
| `create` / `join` | 重定向到 `room-entry` |
