# 公众号自动化运营系统

面向公众号内容团队、个人 IP 和企业新媒体运营的 AI 内容生产工作台。系统把选题、文章、标题、发布包、运营日历、账号画像、素材库和数据复盘放在同一个三栏工作区里，适合持续生产、沉淀和复用内容资产。

## 功能

- 选题中枢：根据领域、目标人群、账号定位生成选题、角度、争议点、情绪钩子、信息增量和文章结构。
- 文章编辑器：支持 Markdown 编辑 / 预览、段落级重写、小标题改写、金句提取、扩写、压缩、换风格和版本历史。
- 一键流水线：从生成选题、选择标题、生成文章、生成发布包到加入运营日历串成完整流程。
- 标题实验室：生成悬念型、反常识型、数字型、情绪型、趋势型等多组标题，并给出评分和风险提示。
- 发布包：生成 Markdown、公众号排版版本、摘要、封面图提示词、文中配图提示词、朋友圈文案、小红书标题和短视频大纲。
- 图片生成：提供封面图、海报图、文中配图生成入口；生成失败时保留提示词兜底。
- 账号画像：保存账号定位、目标读者、常用语气、禁用表达、标题风格、结构模板和竞品账号。
- 数据复盘：支持 CSV 导入、粘贴后台数据、趋势图、高表现选题识别和下周策略建议。
- 素材库：保存选题、标题、金句、案例和图片提示词，支持搜索与标签。

## UI 结构

当前版本采用三栏内容生产工作台：

- 左栏：生产模块、运营资产、素材快取。
- 中栏：当前生成结果 / 编辑器，选题、文章、标题、发布包用 Tab 切换。
- 右栏：参数、模型模式、历史记录、快捷发布动作。

整体视觉参考 Apple 官网式浅色设计：浅灰背景、白色工作面板、玻璃顶栏、简洁层级和低噪音交互。

## 数据层

系统已经从纯 `localStorage` 升级为 Prisma + SQLite 数据层：

- 数据库：`prisma/dev.db`
- Schema：`prisma/schema.prisma`
- Server API：`/api/db`
- Client 封装：`lib/client-db.ts`
- 离线兜底：数据库请求失败时自动回退到 `localStorage`

当前持久化集合包括：

- `calendar`：运营日历
- `library`：素材库
- `history`：生成历史
- `drafts`：文章草稿
- `versions`：版本历史
- `profiles`：账号画像
- `selectedProfile`：当前账号画像

后续如果要切换到 Supabase 或 Neon Postgres，只需要把 Prisma datasource 改成 `postgresql`，并替换 `DATABASE_URL`。

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
- Prisma
- SQLite
- DeepSeek API / OpenAI Responses API 预留接入

## 本地运行

安装依赖：

```bash
npm install
```

生成 Prisma Client：

```bash
npm run db:generate
```

初始化 / 同步数据库：

```bash
npm run db:push
```

如果本地 `db:push` 受 Windows 路径或 Prisma 引擎影响失败，应用启动后访问 `/api/db` 会自动创建基础 `Store` 表。
如果 Windows 提示 `EPERM rename query_engine`，通常是开发服务占用了 Prisma 引擎文件，先停止 dev 服务后再执行 `npm run db:generate` 即可。

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
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_QUALITY=medium
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-v4-flash
```

推荐：

- 日常中文内容生成：配置 `DEEPSEEK_API_KEY`
- 高质量终稿和复杂结构化输出：配置 `OPENAI_API_KEY`
- 图片生成扩展：配置 `OPENAI_API_KEY`

## API 路由

- `POST /api/generate-topic`
- `POST /api/generate-article`
- `POST /api/generate-title`
- `POST /api/generate-publish-package`
- `POST /api/generate-image`
- `POST /api/analyze-performance`
- `GET /api/db?collection=history`
- `PUT /api/db`

## 部署

可以直接部署到 Vercel：

1. 推送代码到 GitHub。
2. 在 Vercel 导入仓库。
3. 设置环境变量，至少包含 `DATABASE_URL`。
4. 执行默认构建命令：

```bash
npm run build
```

如果部署到多设备使用场景，建议将 SQLite 替换为 Supabase 或 Neon Postgres。

## 项目状态

当前版本已经完成可运行 MVP：

- 三栏工作台 UI
- 模型模式切换
- DeepSeek / OpenAI provider 选择逻辑
- 文章编辑器和版本历史
- 一键生成流水线
- 真实图片生成入口和提示词兜底
- 账号画像 / 内容策略库
- 数据复盘自动化
- Prisma + SQLite 真实数据层
