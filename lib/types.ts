export type SectionKey =
  | "topics"
  | "article"
  | "titles"
  | "package"
  | "calendar"
  | "review"
  | "library";

export type ModelMode = "economy" | "quality" | "image";

export type ArticleStyle =
  | "深度财经分析"
  | "AI 科技趋势"
  | "爆款公众号模式"
  | "知识科普"
  | "儿童友好解释"
  | "企业品牌专业稿"
  | "小红书轻量种草"
  | "短视频口播稿";

export type TopicResult = {
  recommendations: string[];
  angles: string[];
  controversy: string[];
  hooks: string[];
  informationGain: string[];
  titles: string[];
  structures: string[];
};

export type ArticleResult = {
  title: string;
  subtitle: string;
  opening: string;
  sections: { heading: string; body: string; evidence: string }[];
  quotes: string[];
  conclusion: string;
  cta: string;
};

export type TitleResult = {
  type: string;
  title: string;
  score: number;
  risk: string;
  audience: string;
  reason: string;
};

export type PublishPackage = {
  markdown: string;
  wechatLayout: string;
  summary: string;
  coverPrompt: string;
  imagePrompts: string[];
  posterCopy: string;
  momentsCopy: string;
  xiaohongshuTitles: string[];
  shortVideoOutline: string[];
};

export type PerformanceResult = {
  score: number;
  titleAnalysis: string;
  topicAnalysis: string;
  improvements: string[];
  reusablePatterns: string[];
  avoid: string[];
};

export type CalendarItem = {
  id: string;
  date: string;
  topic: string;
  status: string;
  platform: string;
  owner: string;
};

export type LibraryItem = {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
};
