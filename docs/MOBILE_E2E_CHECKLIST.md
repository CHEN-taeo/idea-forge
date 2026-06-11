# Idea Forge 移动端全流程验收清单

Web 大屏 + 微信小程序（`idea-forge-miniprogram`）+ 后端 `npm run server`（`:3001`）

## 前置

- [ ] 根目录 `npm run server` 运行中
- [ ] 微信开发者工具：不校验合法域名
- [ ] `idea-forge-miniprogram/utils/config.js` → `http://127.0.0.1:3001`
- [ ] 浏览器打开 Web 版同一房间（投屏）

## Lobby

- [ ] 首页健康检查通过（绿点）
- [ ] 创建房间 → 进入 room 页，无「创建中…」卡死
- [ ] 房间码可复制；第二台设备可加入
- [ ] 全员就绪 → 主持人「开始围炉」

## Round 1

- [ ] 角色在构思阶段展示（非提交后才出现）
- [ ] 选灵感卡 + 提交想法
- [ ] 大屏 ideas wall 更新
- [ ] 竞猜作者；主持人可推进

## Round 2

- [ ] 选 Top 构想改造并提交
- [ ] 原作者可认可改造

## Round 3

- [ ] 质询他人构想（非自己的）
- [ ] 被质询者辩护（接受/反驳）
- [ ] 第三方表决辩护成败

## Commitment

- [ ] SMART 三栏：做什么 / 何时（7·14·30 天）/ 预览合成句
- [ ] AI 建议（可选）
- [ ] 认领后全员可见；不重复认领
- [ ] `/api/metrics` 中 `commitmentRate` 上升

## Finished

- [ ] 主持人推进至结束
- [ ] 承诺列表与 echo 链接可访问
- [ ] 打开 echo URL 后 metrics 中 `echoOpenRate` 计数

## 计时器（P0）

- [ ] 大屏末 10 秒计时器变红脉冲
- [ ] 小程序 room 页顶部倒计时同步（约 ±2s 可接受）

## 回归

- [ ] 创建房间不再导致 server 崩溃（`ack is not a function`）
- [ ] 断线重进 `rejoin_room` 成功
