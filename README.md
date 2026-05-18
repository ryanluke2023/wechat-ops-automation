# 公众号自动化运营系统

一个面向公众号内容团队、个人 IP 和企业新媒体运营的 AI 内容生产工作台。系统把选题、文章、标题、发布包、运营日历、数据复盘和素材库放在同一个三栏工作区里，适合持续生产、沉淀和复用内容资产。

## 功能

- 选题中枢：根据领域、目标人群、账号定位生成选题、角度、争议点、情绪钩子、信息增量和文章结构。
- 文章生成器：输出标题、副标题、开头钩子、正文模块、案例/数据点、金句、总结和引导话术。
- 标题实验室：生成悬念型、反常识型、数字型、情绪型、趋势型等多组标题，并给出评分和风险提示。
- 发布包：生成 Markdown、公众号排版版本、摘要、封面图提示词、文中配图提示词、朋友圈文案、小红书标题和短视频大纲。
- 运营日历：支持新增、编辑、删除发布计划，并可自动生成一周内容计划。
- 数据复盘：根据阅读、点赞、转发、收藏、涨粉、打开率、完读率等数据生成复盘建议。
- 素材库：保存选题、标题、金句、案例和图片提示词，支持本地搜索与标签。

## UI 结构

当前版本采用三栏内容生产工作台：

- 左栏：生产模块、运营资产、素材快取。
- 中栏：当前生成结果 / 编辑器，选题、文章、标题、发布包以 Tab 切换。
- 右栏：参数、模型模式、历史记录、快捷发布动作。

整体视觉参考 Apple 官网式浅色设计：浅灰背景、白色卡片、玻璃顶栏、简洁层级和低噪音交互。

## 模型模式

系统支持三种模型模式：

- 经济模式：优先使用 DeepSeek，适合日常批量生成。
- 高质量模式：优先使用 OpenAI，适合终稿润色和复杂结构输出。
- 图片模式：优先强化封面图、海报图和配图提示词。

没有配置 API Key 时，系统会使用本地 mock 生成，保证工作台可运行。

## 技术栈

- Next.js App Router
- React
- TypeScript
- CSS Modules-style global CSS
- localStorage 本地数据持久化
- DeepSeek API / OpenAI Responses API 预留接入

## 本地运行

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

Windows 后台预览建议使用：

```bash
npm run dev:keepalive
```

默认访问：

```text
http://localhost:3012
```

生产构建：

```bash
npm run build
```

## 环境变量

复制 `.env.example` 为 `.env.local`，按需填写：

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-v4-flash
```

推荐：

- 日常中文内容生成：配置 `DEEPSEEK_API_KEY`
- 高质量终稿、复杂结构化输出：配置 `OPENAI_API_KEY`
- 图片提示词和后续图片生成扩展：配置 `OPENAI_API_KEY`

## API 路由

- `POST /api/generate-topic`
- `POST /api/generate-article`
- `POST /api/generate-title`
- `POST /api/generate-publish-package`
- `POST /api/generate-image`
- `POST /api/analyze-performance`

## 部署

可以直接部署到 Vercel：

1. 推送代码到 GitHub。
2. 在 Vercel 导入仓库。
3. 设置环境变量。
4. 执行默认构建命令：

```bash
npm run build
```

## 项目状态

当前版本已完成可运行的 MVP：

- 三栏工作台 UI
- 本地 mock 生成兜底
- DeepSeek / OpenAI provider 选择逻辑
- 本地日历与素材库持久化
- 生产构建通过
