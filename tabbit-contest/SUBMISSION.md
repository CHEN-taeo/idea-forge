# Tabbit 妙招大赛 — 逐步提交指南

> 投稿期：6/6 – 6/30 · 需 Tabbit 1.0+  
> 路径：**编辑妙招 → 分享 → 发布广场并参加妙招大赛**

## 一、提交清单（7 条，可分天完成）

| # | 赛道 | 妙招名（广场用） | 源文件 |
|---|------|------------------|--------|
| 1 | 脚本 | 截止日！通知页倒计时 | `script-deadline-radar/script.js` |
| 2 | 脚本 | 评论区情绪脱水机 | `script-emotion-dehydrator/script.js` |
| 3 | 任务 | 苏格拉底 × 破壳 | `task-socratic-bubble/SKILL.md`（打包 zip） |
| 4 | 任务 | 跨界走私犯 | `task-knowledge-smuggler/SKILL.md`（打包 zip） |
| 5 | 提示词 | 信息食谱诊断 | `prompt-info-diet/prompt.md` |
| 6 | 提示词 | 如果在你的剧本里 | `prompt-biography-reframe/prompt.md` |
| 7 | 提示词 | 破壳投喂格式化 | `prompt-poke-feed/prompt.md` |

广场标题/描述：复制 `plaza/` 下对应 `.txt`。

## 二、脚本妙招

适用：`script-deadline-radar/`、`script-emotion-dehydrator/`

1. 新建妙招 → 类型选 **脚本**
2. 在目标页打开（如 `*.edu.cn` 通知列表，或知乎/B站评论区）
3. 粘贴 `script.js` 全文
4. 保存 → 在声明的适用页面试跑 → 截图 Before/After
5. 发布广场，说明中写明适用域名与局限

### Deadline 脚本自测

1. 打开 https://jw.dhu.edu.cn/tzgg/list1.htm
2. 运行脚本 → 每条通知旁应出现彩色「还剩 X 天」标签
3. 若无标签：打开 F12 看列表 DOM，在 README 中注明站点结构差异

## 三、任务妙招

适用：`task-socratic-bubble/`、`task-knowledge-smuggler/`

1. 将文件夹内 `SKILL.md` 单独打成 **zip**（根目录含 `SKILL.md`）
2. 新建妙招 → 类型选 **任务** → 上传 zip
3. 在 UI 添加 SKILL 中声明的变量（输入模式、问题强度等）
4. 用真实页面试跑：@ 一篇校园通知或新闻 → 检查输出含具体实体与 3 个问题
5. 发布广场

## 四、提示词妙招

适用：`prompt-info-diet/`、`prompt-biography-reframe/`、`prompt-poke-feed/`

1. 新建妙招 → 类型选 **提示词**
2. 复制 `prompt.md` 正文（不含 frontmatter 也可，Tabbit 不强制）
3. 变量按文件内说明在 UI 添加
4. 发布广场

### 破壳投喂闭环（Tabbit → 微信小程序）

1. 运行 **截止日倒计时** 脚本查看 DHU 通知页
2. 点开一条紧急通知详情
3. 运行 **破壳投喂格式化** → 复制输出全文
4. 破壳小程序 → **导入** → 粘贴 → 「今天」下拉刷新 / 「机会」页查看信息差排序

## 五、交叉引流（不写硬广）

- 苏格拉底输出里的「发给朋友的版本」→ 自然带到微信讨论
- 信息食谱「分享版」→ 小红书/朋友圈截图
- CSDN 长文见 `promotion/csdn-三把武器.md`
- 60 秒演示分镜见 `promotion/video-script-60s.md`

## 六、初审 Adds 策略（6 月）

- **脚本 Deadline**：DHU 同学刚需，标题含「截止日」「倒计时」
- **苏格拉底**：截图一张好问题比长说明更有效
- **破壳投喂**：闭环演示视频 15 秒即可
- 三条互相 @ 在广场描述里，引导用户 add 组合

## 七、合规

- 演示内容真实，不夸大
- 脚本仅改 DOM 展示，不爬取上传用户数据
- 校园通知示例使用公开页面
