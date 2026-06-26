# Tabbit 妙招大赛 — 提交包

> 主题：**从信息过载到认知跃迁**  
> 作者：Chentao · DHU · Poke/破壳  
> 执行窗口：6/23 考后 → 6/30 投稿截止

## 三件武器矩阵

| 赛道 | 妙招名 | 文件夹 | 角色 |
|------|--------|--------|------|
| **脚本** | 截止日！通知页倒计时 | `script-deadline-radar/` | 初审 Adds 尖刀 |
| **脚本** | 评论区情绪脱水机 | `script-emotion-dehydrator/` | 传播 Before/After |
| **任务** | 苏格拉底 × 破壳 | `task-socratic-bubble/` | 终审创意旗舰 |
| **任务** | 跨界走私犯 | `task-knowledge-smuggler/` | 创意 + 截图爆款 |
| **提示词** | 信息食谱诊断 | `prompt-info-diet/` | 低成本试错 / 交叉引流 |
| **提示词** | 如果在你的剧本里 | `prompt-biography-reframe/` | 情绪传播 |
| **提示词** | 破壳投喂格式化 | `prompt-poke-feed/` | Tabbit → 破壳导入闭环 |

**推荐最少提交组合（4 个）：** 脚本 Deadline + 任务 苏格拉底 + 提示词 信息食谱 + 破壳投喂格式化

## 快速提交

1. 打开 Tabbit → 右上角灯泡 → **编辑妙招**
2. 按赛道选择类型（任务 / 脚本 / 提示词）
3. 复制对应文件夹内容粘贴
4. **分享 → 发布广场并参加妙招大赛**
5. 广场文案见 `plaza/*.txt`

详细步骤见 [`SUBMISSION.md`](SUBMISSION.md)。

## Tabbit → 破壳 闭环

```text
DHU 通知页 ──脚本 Deadline──► 看见还剩几天
       │
       └──提示词 破壳投喂──► 复制结构化文本
                    │
                    ▼
            破壳小程序「导入」──► AI 分类 + 信息差排序
                    │
                    └── 今天 / 机会 / 破壳推荐
```

## 脚本测试页

- https://jw.dhu.edu.cn/tzgg/list1.htm
- https://www.dhu.edu.cn/tzgg/list1.htm

## 目录结构

```text
tabbit-contest/
├── README.md
├── SUBMISSION.md
├── task-socratic-bubble/SKILL.md
├── task-knowledge-smuggler/SKILL.md
├── script-deadline-radar/{script.js,README.md}
├── script-emotion-dehydrator/{script.js,README.md}
├── prompt-info-diet/prompt.md
├── prompt-biography-reframe/prompt.md
├── prompt-poke-feed/prompt.md
├── plaza/*.txt
└── promotion/{csdn-三把武器.md,video-script-60s.md}
```

## 与破壳产品关系

本包是 **破壳（Poke）校园信息差** 的 Tabbit 侧卫星：浏览器里采集、思考、格式化；微信小程序里行动、排序、破壳反茧房。二者共享截止日期解析规则（`poke-server/src/lib/deadline.js` 与 `script-deadline-radar/script.js` 对齐）。
