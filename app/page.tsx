"use client";

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Clipboard,
  Edit3,
  Eye,
  FileDown,
  FileText,
  Layers,
  Library,
  Loader2,
  MessageSquareText,
  Plus,
  Quote,
  Search,
  Save,
  Sparkles,
  Trash2,
  Wand2
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { clientDb } from "@/lib/client-db";
import { weeklyPlanMock } from "@/lib/mock-generators";
import {
  ArticleResult,
  ArticleStyle,
  CalendarItem,
  LibraryItem,
  ModelMode,
  PerformanceResult,
  PublishPackage,
  SectionKey,
  TitleResult,
  TopicResult
} from "@/lib/types";

type StudioTab = "topics" | "article" | "titles" | "package";
type EditorMode = "edit" | "preview";
type EditorAction = "rewrite-paragraph" | "rewrite-heading" | "extract-quotes" | "expand" | "compress" | "change-style";
type WorkflowStep = "topic" | "title" | "article" | "package" | "calendar" | "review" | "template";
type DraftVersion = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

const workflowSteps: { key: WorkflowStep; label: string }[] = [
  { key: "topic", label: "生成选题" },
  { key: "title", label: "选择选题" },
  { key: "article", label: "选择标题" },
  { key: "package", label: "生成文章" },
  { key: "calendar", label: "生成发布包" },
  { key: "review", label: "加入日历" },
  { key: "template", label: "复盘沉淀" }
];

const studioTabs: { key: StudioTab; label: string; icon: typeof Sparkles }[] = [
  { key: "topics", label: "选题", icon: Sparkles },
  { key: "article", label: "文章", icon: FileText },
  { key: "titles", label: "标题", icon: MessageSquareText },
  { key: "package", label: "发布包", icon: Layers }
];

const operationTabs: { key: SectionKey; label: string; icon: typeof CalendarDays }[] = [
  { key: "calendar", label: "运营日历", icon: CalendarDays },
  { key: "review", label: "数据复盘", icon: BarChart3 },
  { key: "library", label: "素材库", icon: Library }
];

const articleStyles: ArticleStyle[] = [
  "深度财经分析",
  "AI 科技趋势",
  "爆款公众号模式",
  "知识科普",
  "儿童友好解释",
  "企业品牌专业稿",
  "小红书轻量种草",
  "短视频口播稿"
];

const modelModes: { key: ModelMode; label: string; hint: string }[] = [
  { key: "economy", label: "经济模式", hint: "优先 DeepSeek v4 Flash，适合日常批量生成" },
  { key: "quality", label: "高质量模式", hint: "优先 OpenAI，适合终稿润色和复杂结构" },
  { key: "image", label: "图片模式", hint: "强化封面图、海报图和配图提示词" }
];

const defaultCalendar: CalendarItem[] = [
  {
    id: "plan-1",
    date: "2026-05-18",
    topic: "AI 时代公众号运营从手工写作到系统化增长",
    status: "写作中",
    platform: "公众号",
    owner: "主编"
  },
  {
    id: "plan-2",
    date: "2026-05-20",
    topic: "一个选题如何拆成 4 个平台内容包",
    status: "待审核",
    platform: "公众号 / 小红书",
    owner: "运营"
  }
];

const defaultLibrary: LibraryItem[] = [
  {
    id: "lib-1",
    category: "金句",
    title: "内容系统",
    content: "运营系统的价值，是把一次灵感沉淀成下一次增长。",
    tags: ["运营", "增长"],
    createdAt: "2026-05-18"
  }
];

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function stringifyContent(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function articleToMarkdown(article: ArticleResult) {
  return [
    `# ${article.title}`,
    "",
    `> ${article.subtitle}`,
    "",
    article.opening,
    "",
    ...article.sections.flatMap((section) => [
      `## ${section.heading}`,
      "",
      section.body,
      "",
      `**案例 / 数据点：** ${section.evidence}`,
      ""
    ]),
    "## 金句",
    "",
    ...article.quotes.map((quote) => `- ${quote}`),
    "",
    "## 结尾总结",
    "",
    article.conclusion,
    "",
    "## 引导话术",
    "",
    article.cta
  ].join("\n");
}

function extractDraftTitle(content: string) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1];
  return (heading || content.split("\n").find(Boolean) || "未命名文章").slice(0, 42);
}

function findCurrentParagraph(content: string, cursor: number) {
  const safeCursor = Math.max(0, Math.min(cursor, content.length));
  let start = content.lastIndexOf("\n\n", safeCursor - 1);
  start = start === -1 ? 0 : start + 2;
  let end = content.indexOf("\n\n", safeCursor);
  end = end === -1 ? content.length : end;
  return { start, end, text: content.slice(start, end) };
}

function normalizeTitles(data: TitleResult[] | { data: TitleResult[] }) {
  return Array.isArray(data) ? data : data.data;
}

export default function Home() {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [active, setActive] = useState<SectionKey>("topics");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [modelMode, setModelMode] = useState<ModelMode>("economy");
  const [history, setHistory] = useState<string[]>([]);
  const [editorContent, setEditorContent] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode>("edit");
  const [selectedText, setSelectedText] = useState("");
  const [draftVersions, setDraftVersions] = useState<DraftVersion[]>([]);
  const [draftSavedAt, setDraftSavedAt] = useState("");
  const [selectedWorkflowTopic, setSelectedWorkflowTopic] = useState("");
  const [selectedWorkflowTitle, setSelectedWorkflowTitle] = useState("");
  const [workflowLog, setWorkflowLog] = useState<string[]>([]);

  const [topicForm, setTopicForm] = useState({
    domain: "AI、财经、科技",
    audience: "关注趋势、想提升内容效率的公众号运营者",
    positioning: "AI 时代的财经科技趋势分析号"
  });
  const [articleForm, setArticleForm] = useState({
    topic: "AI 时代公众号运营为什么必须自动化",
    positioning: "AI 财经科技趋势号",
    audience: "个人 IP、企业新媒体负责人、内容创业者",
    style: "爆款公众号模式" as ArticleStyle,
    length: "1800-2500 字",
    intensity: 78
  });
  const [reviewForm, setReviewForm] = useState({
    reads: 3200,
    likes: 186,
    wows: 42,
    shares: 78,
    saves: 96,
    followers: 64,
    openRate: 18,
    completion: 46
  });

  const [topicResult, setTopicResult] = useState<TopicResult | null>(null);
  const [articleResult, setArticleResult] = useState<ArticleResult | null>(null);
  const [titleResult, setTitleResult] = useState<TitleResult[]>([]);
  const [publishPackage, setPublishPackage] = useState<PublishPackage | null>(null);
  const [performance, setPerformance] = useState<PerformanceResult | null>(null);
  const [calendar, setCalendar] = useState<CalendarItem[]>(defaultCalendar);
  const [library, setLibrary] = useState<LibraryItem[]>(defaultLibrary);
  const [query, setQuery] = useState("");
  const [newItem, setNewItem] = useState({ category: "选题", title: "", content: "", tags: "" });

  const activeMode = modelModes.find((mode) => mode.key === modelMode) ?? modelModes[0];
  const workflowState = useMemo<Record<WorkflowStep, boolean>>(
    () => ({
      topic: Boolean(topicResult),
      title: Boolean(selectedWorkflowTopic),
      article: Boolean(selectedWorkflowTitle),
      package: Boolean(articleResult || editorContent),
      calendar: Boolean(publishPackage),
      review: calendar.some((item) => item.topic === (selectedWorkflowTopic || articleForm.topic)),
      template: library.some((item) => item.category === "复盘模板" || item.tags.includes("复盘模板"))
    }),
    [articleForm.topic, articleResult, calendar, editorContent, library, publishPackage, selectedWorkflowTitle, selectedWorkflowTopic, topicResult]
  );
  const filteredLibrary = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return library;
    return library.filter((item) =>
      [item.category, item.title, item.content, ...item.tags].join(" ").toLowerCase().includes(text)
    );
  }, [library, query]);

  useEffect(() => {
    async function loadDatabase() {
      setCalendar(await clientDb.read("calendar", defaultCalendar));
      setLibrary(await clientDb.read("library", defaultLibrary));
      setHistory(await clientDb.read("history", []));
      setDraftVersions(await clientDb.read("versions", []));
      const drafts = await clientDb.read<{ content: string; savedAt: string }[]>("drafts", []);
      if (drafts[0]) {
        setEditorContent(drafts[0].content);
        setDraftSavedAt(drafts[0].savedAt);
      }
    }
    loadDatabase();
  }, []);

  useEffect(() => {
    clientDb.write("calendar", calendar);
  }, [calendar]);

  useEffect(() => {
    clientDb.write("library", library);
  }, [library]);

  useEffect(() => {
    clientDb.write("history", history);
  }, [history]);

  useEffect(() => {
    clientDb.write("versions", draftVersions);
  }, [draftVersions]);

  useEffect(() => {
    if (!editorContent) return;
    const savedAt = new Date().toLocaleString("zh-CN");
    setDraftSavedAt(savedAt);
    clientDb.write("drafts", [{ content: editorContent, savedAt }]);
  }, [editorContent]);

  function remember(text: string) {
    setHistory((items) => [text, ...items].slice(0, 8));
  }

  function appendWorkflowLog(text: string) {
    setWorkflowLog((items) => [text, ...items].slice(0, 6));
  }

  function selectWorkflowTopic(topic: string) {
    const nextArticleForm = { ...articleForm, topic };
    setSelectedWorkflowTopic(topic);
    setSelectedWorkflowTitle("");
    setArticleForm(nextArticleForm);
    setActive("titles");
    appendWorkflowLog(`已选择选题：${topic}`);
    setToast("选题已进入标题实验");
  }

  function selectWorkflowTitle(title: string) {
    setSelectedWorkflowTitle(title);
    setActive("article");
    appendWorkflowLog(`已选择标题：${title}`);
    setToast("标题已锁定，下一步生成文章");
  }

  function saveDraftVersion(label = "手动保存", nextContent = editorContent) {
    if (!nextContent.trim()) {
      setToast("暂无可保存内容");
      return;
    }
    const createdAt = new Date().toLocaleString("zh-CN");
    setDraftVersions((items) =>
      [
        {
          id: crypto.randomUUID(),
          title: `${label} / ${extractDraftTitle(nextContent)}`,
          content: nextContent,
          createdAt
        },
        ...items
      ].slice(0, 12)
    );
    setToast("版本已保存");
  }

  function updateSelection() {
    const textarea = editorRef.current;
    if (!textarea) return;
    setSelectedText(editorContent.slice(textarea.selectionStart, textarea.selectionEnd).trim());
  }

  function applyEditorResult(result: string, action: EditorAction) {
    const nextText = result.trim();
    if (!nextText) return editorContent;

    if (action === "extract-quotes") {
      const nextContent = `${editorContent.trim()}\n\n## 金句提取\n\n${nextText}\n`;
      setEditorContent(nextContent);
      return nextContent;
    }

    const textarea = editorRef.current;
    if (!textarea) {
      setEditorContent(nextText);
      return nextText;
    }
    const { selectionStart, selectionEnd } = textarea;
    const target =
      selectionStart !== selectionEnd
        ? { start: selectionStart, end: selectionEnd }
        : findCurrentParagraph(editorContent, selectionStart);
    const nextContent = `${editorContent.slice(0, target.start)}${nextText}${editorContent.slice(target.end)}`;
    setEditorContent(nextContent);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(target.start, target.start + nextText.length);
    });
    return nextContent;
  }

  async function runEditorAction(action: EditorAction) {
    if (!editorContent.trim()) {
      setToast("请先生成或输入文章");
      return;
    }
    const textarea = editorRef.current;
    const selected =
      textarea && textarea.selectionStart !== textarea.selectionEnd
        ? editorContent.slice(textarea.selectionStart, textarea.selectionEnd)
        : "";
    const paragraph = textarea ? findCurrentParagraph(editorContent, textarea.selectionStart).text : editorContent;
    const targetText = selected || paragraph || editorContent;
    setLoading(`editor-${action}`);
    try {
      const data = await postJson<{ result: string }>("/api/editor-action", {
        action,
        text: targetText,
        fullText: editorContent,
        style: articleForm.style,
        modelMode
      });
      const nextContent = applyEditorResult(data.result, action);
      saveDraftVersion(`AI ${editorActionLabel(action)}`, nextContent);
    } finally {
      setLoading(null);
    }
  }

  async function copyText(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setToast("已复制");
    } catch {
      setToast("复制失败");
    }
  }

  function downloadMarkdown(name: string, content: string) {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function addToLibrary(category: string, title: string, content: string, tags: string[] = []) {
    setLibrary((items) => [
      {
        id: crypto.randomUUID(),
        category,
        title,
        content,
        tags,
        createdAt: new Date().toISOString().slice(0, 10)
      },
      ...items
    ]);
    setToast("已保存到素材库");
  }

  async function generateTopic() {
    setLoading("topics");
    try {
      const data = await postJson<TopicResult>("/api/generate-topic", { ...topicForm, modelMode });
      setTopicResult(data);
      setActive("topics");
      remember(`选题：${topicForm.domain}`);
      appendWorkflowLog("已生成选题池，请选择一个选题");
    } finally {
      setLoading(null);
    }
  }

  async function generateArticle(title = selectedWorkflowTitle) {
    setLoading("article");
    try {
      const data = await postJson<ArticleResult>("/api/generate-article", { ...articleForm, modelMode });
      const article = title ? { ...data, title } : data;
      setArticleResult(article);
      setEditorContent(articleToMarkdown(article));
      setActive("article");
      remember(`文章：${article.title}`);
      appendWorkflowLog("已生成文章初稿，可继续生成发布包");
    } finally {
      setLoading(null);
    }
  }

  async function generateTitles(topic = articleForm.topic) {
    setLoading("titles");
    try {
      const data = await postJson<TitleResult[] | { data: TitleResult[] }>("/api/generate-title", {
        topic,
        audience: articleForm.audience,
        modelMode
      });
      const titles = normalizeTitles(data);
      setTitleResult(titles);
      setActive("titles");
      remember(`标题实验：${topic}`);
      appendWorkflowLog("已生成标题组，请选择一个标题");
    } finally {
      setLoading(null);
    }
  }

  async function generatePackage() {
    setLoading("package");
    try {
      const data = await postJson<PublishPackage>("/api/generate-publish-package", {
        article: articleResult,
        topic: articleForm.topic,
        modelMode
      });
      setPublishPackage(data);
      setActive("package");
      remember(`发布包：${articleForm.topic}`);
      appendWorkflowLog("已生成发布包，可加入运营日历");
    } finally {
      setLoading(null);
    }
  }

  async function runPipeline() {
    setLoading("pipeline");
    try {
      const topic = await postJson<TopicResult>("/api/generate-topic", { ...topicForm, modelMode });
      setTopicResult(topic);
      const selectedTopic = topic.recommendations[0] || articleForm.topic;
      const nextArticleForm = { ...articleForm, topic: selectedTopic };
      setArticleForm(nextArticleForm);

      const titles = await postJson<TitleResult[] | { data: TitleResult[] }>("/api/generate-title", {
        topic: selectedTopic,
        audience: nextArticleForm.audience,
        modelMode
      });
      const titleList = normalizeTitles(titles);
      setTitleResult(titleList);
      const selectedTitle = titleList[0]?.title || selectedTopic;
      setSelectedWorkflowTopic(selectedTopic);
      setSelectedWorkflowTitle(selectedTitle);

      const article = await postJson<ArticleResult>("/api/generate-article", { ...nextArticleForm, modelMode });
      const titledArticle = { ...article, title: selectedTitle };
      setArticleResult(titledArticle);
      setEditorContent(articleToMarkdown(titledArticle));

      const pack = await postJson<PublishPackage>("/api/generate-publish-package", {
        article: titledArticle,
        topic: selectedTopic,
        modelMode
      });
      setPublishPackage(pack);
      addWorkflowCalendarItem(selectedTopic, selectedTitle, true);
      setActive("package");
      remember(`流水线：${selectedTopic}`);
      appendWorkflowLog("自动流水线已完成：选题、标题、文章、发布包、日历");
      setToast("一键流水线已完成并加入日历");
    } finally {
      setLoading(null);
    }
  }

  async function analyzePerformance() {
    setLoading("review");
    try {
      const data = await postJson<PerformanceResult>("/api/analyze-performance", { ...reviewForm, modelMode });
      setPerformance(data);
      setActive("review");
      remember(`复盘评分：${data.score}`);
      appendWorkflowLog("已生成复盘报告，可沉淀为模板");
    } finally {
      setLoading(null);
    }
  }

  function addWorkflowCalendarItem(
    topic = selectedWorkflowTopic || articleForm.topic,
    title = selectedWorkflowTitle || articleResult?.title || articleForm.topic,
    hasPackage = Boolean(publishPackage)
  ) {
    setCalendar((items) => [
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        topic,
        status: hasPackage ? "待发布" : "写作中",
        platform: "公众号 / 小红书 / 短视频",
        owner: title.slice(0, 24)
      },
      ...items
    ]);
    appendWorkflowLog("已加入运营日历");
    setToast("已加入运营日历");
  }

  function saveReviewAsTemplate() {
    if (!performance) {
      setToast("请先生成复盘报告");
      return;
    }
    addToLibrary(
      "复盘模板",
      `复盘模板 / ${selectedWorkflowTopic || articleForm.topic}`.slice(0, 42),
      [
        `评分：${performance.score}`,
        `标题分析：${performance.titleAnalysis}`,
        `选题分析：${performance.topicAnalysis}`,
        `可复用模式：${performance.reusablePatterns.join(" / ")}`,
        `下次优化：${performance.improvements.join(" / ")}`
      ].join("\n"),
      ["复盘模板", "流水线"]
    );
    appendWorkflowLog("复盘结论已沉淀为模板");
  }

  function addCalendarItem() {
    setCalendar((items) => [
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        topic: articleForm.topic,
        status: "待选题",
        platform: "公众号",
        owner: "运营"
      },
      ...items
    ]);
  }

  function actionButtons(target: unknown, filename: string) {
    const text = stringifyContent(target);
    return (
      <div className="actions">
        <button className="btn" onClick={() => copyText(text)}>
          <Clipboard size={16} /> 复制
        </button>
        <button className="btn" onClick={() => downloadMarkdown(filename, text)}>
          <FileDown size={16} /> 导出
        </button>
      </div>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <BookOpen size={18} />
          </div>
          <div>
            <strong>公众号 OS</strong>
            <span>Content Studio</span>
          </div>
        </div>

        <div className="side-section">
          <span className="eyebrow">生产模块</span>
          <nav className="nav">
            {studioTabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  className={active === item.key ? "active" : ""}
                  onClick={() => setActive(item.key)}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="side-section">
          <span className="eyebrow">运营资产</span>
          <nav className="nav">
            {operationTabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  className={active === item.key ? "active" : ""}
                  onClick={() => setActive(item.key)}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="side-section material-shelf">
          <div className="panel-title compact-title">
            <h2>素材快取</h2>
            <span className="badge">{library.length}</span>
          </div>
          <input placeholder="搜索素材" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="mini-list">
            {filteredLibrary.slice(0, 4).map((item) => (
              <button key={item.id} onClick={() => copyText(item.content)}>
                <strong>{item.title}</strong>
                <span>{item.category}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div className="topbar-copy">
            <span className="eyebrow">AI CONTENT OPERATIONS</span>
            <h1>三栏内容生产工作台</h1>
            <span>左侧沉淀资产，中间编辑结果，右侧控制参数与快捷动作</span>
          </div>
          <div className="ticker">
            <span>
              <i className="status-dot" /> API {process.env.NODE_ENV === "development" ? "DEV" : "READY"}
            </span>
            <span>素材 {library.length}</span>
            <span>计划 {calendar.length}</span>
            {toast ? <span>{toast}</span> : null}
          </div>
        </header>

        <div className="workspace studio-workspace">
          <div className="content-tabs" aria-label="内容生产标签">
            {studioTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  className={active === tab.key ? "active" : ""}
                  onClick={() => setActive(tab.key)}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {active === "topics" && (
            <ResultPanel
              title="选题结果 / Topic Desk"
              actions={topicResult ? actionButtons(topicResult, "topic-desk") : null}
              empty="在右侧输入领域、人群与账号定位，生成可进入写作的选题资产。"
            >
              {topicResult && (
                <div className="result">
                  <ResultList title="今日选题推荐" items={topicResult.recommendations} onSave={addToLibrary} />
                  <WorkflowChoiceList
                    title="流水线选题池"
                    items={topicResult.recommendations}
                    selected={selectedWorkflowTopic}
                    actionLabel="选用并生成标题"
                    onSelect={(item) => {
                      selectWorkflowTopic(item);
                      generateTitles(item);
                    }}
                  />
                  <ResultList title="爆款角度" items={topicResult.angles} onSave={addToLibrary} />
                  <ResultList title="争议点" items={topicResult.controversy} onSave={addToLibrary} />
                  <ResultList title="情绪钩子" items={topicResult.hooks} onSave={addToLibrary} />
                  <ResultList title="信息增量" items={topicResult.informationGain} onSave={addToLibrary} />
                  <ResultList title="推荐标题" items={topicResult.titles} onSave={addToLibrary} />
                  <ResultList title="文章结构" items={topicResult.structures} onSave={addToLibrary} />
                </div>
              )}
            </ResultPanel>
          )}

          {active === "article" && (
            <ResultPanel
              title="当前文章 / Editor"
              actions={editorContent ? actionButtons(editorContent, "article-draft") : null}
              empty="在右侧设置文章参数，生成结构化初稿。"
            >
              {(articleResult || editorContent) && (
                <div className="editor-grid">
                  <div className="editor-stack">
                    <div className="row-between editor-meta">
                      <span>Markdown 编辑器 {selectedText ? ` / 已选 ${selectedText.length} 字` : ""}</span>
                      <span>{draftSavedAt ? `自动保存 ${draftSavedAt}` : "等待保存"}</span>
                    </div>
                    <div className="editor-toolbar">
                      <div className="mode-switch">
                        <button className={editorMode === "edit" ? "active" : ""} onClick={() => setEditorMode("edit")}>
                          <Edit3 size={14} /> 编辑
                        </button>
                        <button className={editorMode === "preview" ? "active" : ""} onClick={() => setEditorMode("preview")}>
                          <Eye size={14} /> 预览
                        </button>
                      </div>
                      <button className="btn" onClick={() => saveDraftVersion()}>
                        <Save size={15} /> 保存版本
                      </button>
                    </div>
                    <div className="editor-toolbar">
                      <button className="btn" disabled={loading === "editor-rewrite-paragraph"} onClick={() => runEditorAction("rewrite-paragraph")}>
                        <Wand2 size={15} /> 段落级重写
                      </button>
                      <button className="btn" disabled={loading === "editor-rewrite-heading"} onClick={() => runEditorAction("rewrite-heading")}>
                        <Edit3 size={15} /> 小标题改写
                      </button>
                      <button className="btn" disabled={loading === "editor-extract-quotes"} onClick={() => runEditorAction("extract-quotes")}>
                        <Quote size={15} /> 金句提取
                      </button>
                      <button className="btn" disabled={loading === "editor-expand"} onClick={() => runEditorAction("expand")}>
                        <Plus size={15} /> 扩写
                      </button>
                      <button className="btn" disabled={loading === "editor-compress"} onClick={() => runEditorAction("compress")}>
                        压缩
                      </button>
                      <button className="btn" disabled={loading === "editor-change-style"} onClick={() => runEditorAction("change-style")}>
                        换风格
                      </button>
                    </div>
                    {editorMode === "edit" ? (
                    <textarea
                      ref={editorRef}
                      className="editor-area"
                      value={editorContent}
                      onChange={(event) => setEditorContent(event.target.value)}
                      onSelect={updateSelection}
                      onKeyUp={updateSelection}
                      onClick={updateSelection}
                    />
                    ) : (
                      <MarkdownPreview content={editorContent} />
                    )}
                  </div>
                  <div className="editor-side">
                    <MarkdownPreview content={editorContent} compact />
                    <div className="result-section">
                      <div className="row-between">
                        <h3 className="section-heading">版本历史</h3>
                        <span className="muted">{draftVersions.length}/12</span>
                      </div>
                      <div className="version-list">
                        {(draftVersions.length
                          ? draftVersions
                          : [{ id: "empty", title: "暂无版本", content: "", createdAt: "保存后会显示在这里" }]
                        ).map((version) => (
                          <button
                            key={version.id}
                            className="version-item"
                            disabled={!version.content}
                            onClick={() => {
                              if (!version.content) return;
                              setEditorContent(version.content);
                              setToast("已恢复版本");
                            }}
                          >
                            <strong>{version.title}</strong>
                            <span>{version.createdAt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ResultPanel>
          )}

          {active === "titles" && (
            <ResultPanel
              title="标题实验 / A/B Lab"
              actions={titleResult.length ? actionButtons(titleResult, "title-lab") : null}
              empty="基于当前文章选题生成多组标题。"
            >
              {titleResult.length > 0 && (
                <div className="result">
                  <WorkflowChoiceList
                    title="流水线标题组"
                    items={titleResult.map((item) => item.title)}
                    selected={selectedWorkflowTitle}
                    actionLabel="选用并生成文章"
                    onSelect={(item) => {
                      selectWorkflowTitle(item);
                      generateArticle(item);
                    }}
                  />
                  <table className="title-table">
                    <thead>
                      <tr>
                        <th>类型</th>
                        <th>标题</th>
                        <th>评分</th>
                        <th>风险</th>
                        <th>人群</th>
                        <th>理由</th>
                      </tr>
                    </thead>
                    <tbody>
                      {titleResult.map((item) => (
                        <tr key={item.type}>
                          <td>{item.type}</td>
                          <td>{item.title}</td>
                          <td className="score">{item.score}</td>
                          <td>{item.risk}</td>
                          <td>{item.audience}</td>
                          <td>{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ResultPanel>
          )}

          {active === "package" && (
            <ResultPanel
              title="快捷发布包 / Distribution"
              actions={publishPackage ? actionButtons(publishPackage.markdown, "publish-package") : null}
              empty="生成公众号 Markdown、摘要、配图提示词与多平台分发文案。"
            >
              {publishPackage && (
                <div className="editor-grid">
                  <div className="result">
                    <ResultBlock title="摘要" content={publishPackage.summary} />
                    <ResultBlock title="封面图提示词" content={publishPackage.coverPrompt} />
                    <ResultList title="文中配图提示词" items={publishPackage.imagePrompts} onSave={addToLibrary} />
                    <ResultBlock title="朋友圈文案" content={publishPackage.momentsCopy} />
                    <ResultList title="小红书标题" items={publishPackage.xiaohongshuTitles} onSave={addToLibrary} />
                    <ResultList title="短视频口播大纲" items={publishPackage.shortVideoOutline} onSave={addToLibrary} />
                  </div>
                  <div className="editor-stack">
                    <div className="actions">
                      <button className="btn primary" onClick={() => addWorkflowCalendarItem()}>
                        <CalendarDays size={16} /> 加入运营日历
                      </button>
                      <button className="btn" onClick={() => setActive("review")}>
                        <BarChart3 size={16} /> 去复盘
                      </button>
                    </div>
                    <textarea readOnly value={publishPackage.markdown} className="editor-area" />
                  </div>
                </div>
              )}
            </ResultPanel>
          )}

          {active === "calendar" && (
            <section className="panel">
              <div className="panel-title">
                <h2>运营日历</h2>
                <div className="actions">
                  <button className="btn" onClick={addCalendarItem}>
                    <Plus size={16} /> 新增
                  </button>
                  <button className="btn primary" onClick={() => setCalendar(weeklyPlanMock(articleForm.positioning))}>
                    <Sparkles size={16} /> 生成一周计划
                  </button>
                </div>
              </div>
              <CalendarTable calendar={calendar} setCalendar={setCalendar} />
            </section>
          )}

          {active === "review" && (
            <ResultPanel
              title="数据复盘"
              actions={performance ? actionButtons(performance, "performance-review") : null}
              empty="在右侧输入数据后生成复盘报告。"
            >
              {performance && (
                <div className="result">
                  <div className="card hero-score">
                    <span>内容表现评分</span>
                    <b>{performance.score}</b>
                  </div>
                  <ResultBlock title="标题表现分析" content={performance.titleAnalysis} />
                  <ResultBlock title="选题表现分析" content={performance.topicAnalysis} />
                  <ResultList title="下次优化建议" items={performance.improvements} onSave={addToLibrary} />
                  <ResultList title="可复用模式" items={performance.reusablePatterns} onSave={addToLibrary} />
                  <ResultList title="应避免的问题" items={performance.avoid} onSave={addToLibrary} />
                  <button className="btn primary" onClick={saveReviewAsTemplate}>
                    <Save size={16} /> 沉淀为模板
                  </button>
                </div>
              )}
            </ResultPanel>
          )}

          {active === "library" && (
            <div className="grid two">
              <section className="panel">
                <div className="panel-title">
                  <h2>素材库</h2>
                  <span className="badge">LocalStorage</span>
                </div>
                <div className="library-toolbar">
                  <input placeholder="搜索分类、标题、标签、内容" value={query} onChange={(e) => setQuery(e.target.value)} />
                  <button className="btn">
                    <Search size={16} />
                  </button>
                </div>
                <div className="result">
                  {filteredLibrary.map((item) => (
                    <article className="card" key={item.id}>
                      <div className="panel-title compact-title">
                        <div>
                          <h3>{item.title}</h3>
                          <span className="muted">
                            {item.category} / {item.tags.join("、") || "未标记"} / {item.createdAt}
                          </span>
                        </div>
                        <button className="btn ghost" onClick={() => setLibrary((items) => items.filter((row) => row.id !== item.id))}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="muted">{item.content}</p>
                    </article>
                  ))}
                </div>
              </section>
              <section className="panel">
                <div className="panel-title">
                  <h2>新增素材</h2>
                </div>
                <LibraryForm newItem={newItem} setNewItem={setNewItem} addToLibrary={addToLibrary} />
              </section>
            </div>
          )}
        </div>
      </section>

      <aside className="insights">
        <div className="panel-title">
          <h2>参数与动作</h2>
          <span className="badge">{activeMode.label}</span>
        </div>

        <div className="mode-switch full-width" aria-label="模型模式">
          {modelModes.map((mode) => (
            <button key={mode.key} className={modelMode === mode.key ? "active" : ""} onClick={() => setModelMode(mode.key)}>
              {mode.label}
            </button>
          ))}
        </div>
        <p className="muted rail-hint">{activeMode.hint}</p>

        <div className="rail-form">
          <button className="btn primary" disabled={loading === "pipeline"} onClick={runPipeline}>
            {loading === "pipeline" ? <Loader2 size={16} /> : <Sparkles size={16} />}
            一键生成流水线
          </button>
          <span className="muted">自动完成：选题 → 标题 → 文章 → 发布包 → 日历</span>
        </div>

        <WorkflowPanel
          state={workflowState}
          logs={workflowLog}
          selectedTopic={selectedWorkflowTopic}
          selectedTitle={selectedWorkflowTitle}
          onStart={generateTopic}
          onTitles={() => generateTitles(selectedWorkflowTopic || articleForm.topic)}
          onArticle={() => generateArticle()}
          onPackage={generatePackage}
          onCalendar={() => addWorkflowCalendarItem()}
          onReview={analyzePerformance}
          onTemplate={saveReviewAsTemplate}
          loading={loading}
        />

        {active === "topics" && (
          <div className="rail-form">
            <label>
              输入领域
              <input value={topicForm.domain} onChange={(e) => setTopicForm({ ...topicForm, domain: e.target.value })} />
            </label>
            <label>
              目标人群
              <textarea value={topicForm.audience} onChange={(e) => setTopicForm({ ...topicForm, audience: e.target.value })} />
            </label>
            <label>
              账号定位
              <textarea value={topicForm.positioning} onChange={(e) => setTopicForm({ ...topicForm, positioning: e.target.value })} />
            </label>
            <button className="btn primary" disabled={loading === "topics"} onClick={generateTopic}>
              {loading === "topics" ? <Loader2 size={16} /> : <Sparkles size={16} />} 生成选题
            </button>
          </div>
        )}

        {(active === "article" || active === "titles" || active === "package") && (
          <div className="rail-form">
            <label>
              选题
              <input value={articleForm.topic} onChange={(e) => setArticleForm({ ...articleForm, topic: e.target.value })} />
            </label>
            <label>
              账号定位
              <input value={articleForm.positioning} onChange={(e) => setArticleForm({ ...articleForm, positioning: e.target.value })} />
            </label>
            <label>
              目标读者
              <textarea value={articleForm.audience} onChange={(e) => setArticleForm({ ...articleForm, audience: e.target.value })} />
            </label>
            <label>
              风格
              <select value={articleForm.style} onChange={(e) => setArticleForm({ ...articleForm, style: e.target.value as ArticleStyle })}>
                {articleStyles.map((style) => (
                  <option key={style}>{style}</option>
                ))}
              </select>
            </label>
            <label>
              内容强度：{articleForm.intensity}
              <input
                type="range"
                min="30"
                max="100"
                value={articleForm.intensity}
                onChange={(e) => setArticleForm({ ...articleForm, intensity: Number(e.target.value) })}
              />
            </label>
            <div className="actions vertical-actions">
              <button className="btn primary" disabled={loading === "article"} onClick={() => generateArticle()}>
                {loading === "article" ? <Loader2 size={16} /> : <FileText size={16} />} 生成文章
              </button>
              <button className="btn" disabled={loading === "titles"} onClick={() => generateTitles()}>
                <MessageSquareText size={16} /> 标题实验
              </button>
              <button className="btn" disabled={loading === "package"} onClick={generatePackage}>
                <Layers size={16} /> 快捷发布包
              </button>
            </div>
          </div>
        )}

        {active === "review" && (
          <div className="rail-form">
            {Object.entries(reviewForm).map(([key, value]) => (
              <label key={key}>
                {metricLabel(key)}
                <input type="number" value={value} onChange={(e) => setReviewForm({ ...reviewForm, [key]: Number(e.target.value) })} />
              </label>
            ))}
            <button className="btn primary" disabled={loading === "review"} onClick={analyzePerformance}>
              <BarChart3 size={16} /> 生成复盘
            </button>
          </div>
        )}

        <div className="result-section history-box">
          <h3 className="section-heading">历史记录</h3>
          <ul className="list">
            {(history.length ? history : ["暂无历史记录"]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}

function WorkflowPanel({
  state,
  logs,
  selectedTopic,
  selectedTitle,
  onStart,
  onTitles,
  onArticle,
  onPackage,
  onCalendar,
  onReview,
  onTemplate,
  loading
}: {
  state: Record<WorkflowStep, boolean>;
  logs: string[];
  selectedTopic: string;
  selectedTitle: string;
  onStart: () => void;
  onTitles: () => void;
  onArticle: () => void;
  onPackage: () => void;
  onCalendar: () => void;
  onReview: () => void;
  onTemplate: () => void;
  loading: string | null;
}) {
  return (
    <div className="result-section workflow-box">
      <div className="row-between">
        <h3 className="section-heading">生成工作流</h3>
        <span className="muted">{workflowSteps.filter((step) => state[step.key]).length}/7</span>
      </div>
      <div className="workflow-steps">
        {workflowSteps.map((step, index) => (
          <div key={step.key} className={state[step.key] ? "workflow-step done" : "workflow-step"}>
            <span>{index + 1}</span>
            <strong>{step.label}</strong>
          </div>
        ))}
      </div>
      <div className="workflow-summary">
        <p>{selectedTopic || "尚未选择选题"}</p>
        <p>{selectedTitle || "尚未选择标题"}</p>
      </div>
      <div className="actions vertical-actions">
        <button className="btn" disabled={loading === "topics"} onClick={onStart}>
          1. 生成选题池
        </button>
        <button className="btn" disabled={!selectedTopic || loading === "titles"} onClick={onTitles}>
          2. 生成标题组
        </button>
        <button className="btn" disabled={!selectedTitle || loading === "article"} onClick={onArticle}>
          3. 生成文章
        </button>
        <button className="btn" disabled={!state.package || loading === "package"} onClick={onPackage}>
          4. 生成发布包
        </button>
        <button className="btn" disabled={!state.calendar} onClick={onCalendar}>
          5. 加入运营日历
        </button>
        <button className="btn" disabled={loading === "review"} onClick={onReview}>
          6. 复盘
        </button>
        <button className="btn primary" disabled={!state.review} onClick={onTemplate}>
          7. 沉淀为模板
        </button>
      </div>
      <ul className="workflow-log">
        {(logs.length ? logs : ["等待启动工作流"]).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function WorkflowChoiceList({
  title,
  items,
  selected,
  actionLabel,
  onSelect
}: {
  title: string;
  items: string[];
  selected: string;
  actionLabel: string;
  onSelect: (item: string) => void;
}) {
  return (
    <div className="result-section workflow-choice">
      <h3 className="section-heading">{title}</h3>
      <div className="choice-list">
        {items.map((item) => (
          <button key={item} className={selected === item ? "choice-item active" : "choice-item"} onClick={() => onSelect(item)}>
            <span>{item}</span>
            <strong>{selected === item ? "已选" : actionLabel}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({
  title,
  actions,
  empty,
  children
}: {
  title: string;
  actions?: React.ReactNode;
  empty: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="panel editor-panel">
      <div className="panel-title">
        <h2>{title}</h2>
        {actions}
      </div>
      {children || <div className="empty">{empty}</div>}
    </section>
  );
}

function editorActionLabel(action: EditorAction) {
  const labels: Record<EditorAction, string> = {
    "rewrite-paragraph": "段落重写",
    "rewrite-heading": "小标题改写",
    "extract-quotes": "金句提取",
    expand: "扩写",
    compress: "压缩",
    "change-style": "换风格"
  };
  return labels[action];
}

function MarkdownPreview({ content, compact = false }: { content: string; compact?: boolean }) {
  const blocks = content.split(/\n{2,}/).filter((block) => block.trim());
  return (
    <article className={compact ? "markdown-preview compact" : "markdown-preview"}>
      {blocks.map((block, index) => {
        const text = block.trim();
        if (text.startsWith("# ")) return <h1 key={index}>{text.replace(/^#\s+/, "")}</h1>;
        if (text.startsWith("## ")) return <h2 key={index}>{text.replace(/^##\s+/, "")}</h2>;
        if (text.startsWith("> ")) return <blockquote key={index}>{text.replace(/^>\s+/, "")}</blockquote>;
        if (/^-\s+/m.test(text)) {
          return (
            <ul key={index}>
              {text.split("\n").map((line) => (
                <li key={line}>{line.replace(/^-\s+/, "")}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index}>
            {text.split("\n").map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </p>
        );
      })}
    </article>
  );
}

function ResultBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="result-section">
      <h3 className="section-heading">{title}</h3>
      <p style={{ lineHeight: 1.72, color: "var(--soft)", whiteSpace: "pre-wrap" }}>{content}</p>
    </div>
  );
}

function ResultList({
  title,
  items,
  onSave
}: {
  title: string;
  items: string[];
  onSave: (category: string, title: string, content: string, tags?: string[]) => void;
}) {
  return (
    <div className="result-section">
      <h3 className="section-heading">{title}</h3>
      <ul className="list">
        {items.map((item) => (
          <li key={item}>
            <div className="row-between">
              <span>{item}</span>
              <button className="btn ghost" onClick={() => onSave(title, item.slice(0, 24), item, [title])}>
                <Plus size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArticlePreview({
  article,
  addToLibrary
}: {
  article: ArticleResult;
  addToLibrary: (category: string, title: string, content: string, tags?: string[]) => void;
}) {
  return (
    <div className="result">
      <ResultBlock title="标题" content={article.title} />
      <ResultBlock title="副标题" content={article.subtitle} />
      <ResultBlock title="开头钩子" content={article.opening} />
      {article.sections.map((section) => (
        <div className="result-section" key={section.heading}>
          <h3 className="section-heading">{section.heading}</h3>
          <p style={{ lineHeight: 1.72, color: "var(--soft)" }}>{section.body}</p>
          <p className="muted" style={{ marginTop: 8 }}>{section.evidence}</p>
        </div>
      ))}
      <ResultList title="金句" items={article.quotes} onSave={addToLibrary} />
      <ResultBlock title="结尾总结" content={article.conclusion} />
      <ResultBlock title="引导话术" content={article.cta} />
    </div>
  );
}

function CalendarTable({
  calendar,
  setCalendar
}: {
  calendar: CalendarItem[];
  setCalendar: React.Dispatch<React.SetStateAction<CalendarItem[]>>;
}) {
  return (
    <table className="calendar-table">
      <thead>
        <tr>
          <th>发布时间</th>
          <th>主题</th>
          <th>状态</th>
          <th>平台</th>
          <th>负责人</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {calendar.map((item) => (
          <tr key={item.id}>
            <td><input value={item.date} onChange={(e) => setCalendar((rows) => rows.map((row) => row.id === item.id ? { ...row, date: e.target.value } : row))} /></td>
            <td><input value={item.topic} onChange={(e) => setCalendar((rows) => rows.map((row) => row.id === item.id ? { ...row, topic: e.target.value } : row))} /></td>
            <td>
              <select value={item.status} onChange={(e) => setCalendar((rows) => rows.map((row) => row.id === item.id ? { ...row, status: e.target.value } : row))}>
                {["待选题", "写作中", "待审核", "待发布", "已发布", "复盘中"].map((status) => <option key={status}>{status}</option>)}
              </select>
            </td>
            <td><input value={item.platform} onChange={(e) => setCalendar((rows) => rows.map((row) => row.id === item.id ? { ...row, platform: e.target.value } : row))} /></td>
            <td><input value={item.owner} onChange={(e) => setCalendar((rows) => rows.map((row) => row.id === item.id ? { ...row, owner: e.target.value } : row))} /></td>
            <td>
              <button className="btn ghost" onClick={() => setCalendar((rows) => rows.filter((row) => row.id !== item.id))}>
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LibraryForm({
  newItem,
  setNewItem,
  addToLibrary
}: {
  newItem: { category: string; title: string; content: string; tags: string };
  setNewItem: React.Dispatch<React.SetStateAction<{ category: string; title: string; content: string; tags: string }>>;
  addToLibrary: (category: string, title: string, content: string, tags?: string[]) => void;
}) {
  return (
    <div className="grid">
      <label>
        分类
        <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
          {["选题", "爆款标题", "金句", "案例", "图片提示词"].map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label>
        标题
        <input value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} />
      </label>
      <label>
        内容
        <textarea value={newItem.content} onChange={(e) => setNewItem({ ...newItem, content: e.target.value })} />
      </label>
      <label>
        标签
        <input value={newItem.tags} onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })} placeholder="用逗号分隔" />
      </label>
      <button
        className="btn primary"
        onClick={() => {
          addToLibrary(newItem.category, newItem.title || newItem.category, newItem.content, newItem.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean));
          setNewItem({ category: "选题", title: "", content: "", tags: "" });
        }}
      >
        <Plus size={16} /> 保存素材
      </button>
    </div>
  );
}

function metricLabel(key: string) {
  const labels: Record<string, string> = {
    reads: "阅读量",
    likes: "点赞",
    wows: "在看",
    shares: "转发",
    saves: "收藏",
    followers: "涨粉",
    openRate: "打开率",
    completion: "完读率"
  };
  return labels[key] || key;
}
