import { NextResponse } from "next/server";
import { generateWithProvider, parseProviderJson } from "@/lib/provider";
import { ModelMode } from "@/lib/types";

type EditorAction = "rewrite-paragraph" | "rewrite-heading" | "extract-quotes" | "expand" | "compress" | "change-style";

type EditorActionResponse = {
  result: string;
};

const actionPrompts: Record<EditorAction, string> = {
  "rewrite-paragraph": "对选中的段落做公众号级重写，保留核心事实，增强节奏、清晰度和可读性。",
  "rewrite-heading": "只改写小标题，要求更有信息密度、更适合公众号阅读，不改正文。",
  "extract-quotes": "从全文提取 6 条可传播金句，每条独立成句，用 Markdown 列表返回。",
  expand: "扩写选中内容，补充逻辑、案例感和解释层次，保持原观点不跑题。",
  compress: "压缩选中内容，删除重复表达，保留关键观点和可读性。",
  "change-style": "把选中内容改成目标风格，语气更统一，更像成稿。"
};

function fallbackResult(action: EditorAction, text: string, style: string) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (action === "extract-quotes") {
    return trimmed
      .split(/[。！？\n]/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 12)
      .slice(0, 6)
      .map((item) => `- ${item}`)
      .join("\n");
  }
  if (action === "rewrite-heading") return trimmed.replace(/^#{1,3}\s*/gm, "## ");
  if (action === "expand") return `${trimmed}\n\n这背后的关键，不只是效率提升，而是把一次性的写作动作沉淀成可复用的内容资产。`;
  if (action === "compress") return trimmed.split(/[。！？]/).filter(Boolean).slice(0, 3).join("。") + "。";
  if (action === "change-style") return `（${style}）${trimmed}`;
  return trimmed;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: EditorAction;
    text?: string;
    fullText?: string;
    style?: string;
    modelMode?: ModelMode;
  };
  const action = body.action || "rewrite-paragraph";
  const text = body.text || "";
  const fullText = body.fullText || text;
  const style = body.style || "爆款公众号模式";
  const fallback: EditorActionResponse = { result: fallbackResult(action, text || fullText, style) };

  const prompt = `
你是公众号文章责任编辑。请执行编辑动作，并严格返回 JSON：{"result":"..."}。

编辑动作：${actionPrompts[action]}
目标风格：${style}

选中内容：
${text}

全文上下文：
${fullText.slice(0, 7000)}

要求：
1. result 必须是可直接替换或追加到 Markdown 编辑器里的文本。
2. 不要解释过程，不要返回多余字段。
3. 如果是金句提取，result 用 Markdown 列表。
`;

  try {
    const raw = await generateWithProvider(prompt, body.modelMode);
    return NextResponse.json(parseProviderJson(raw, fallback));
  } catch {
    return NextResponse.json(fallback);
  }
}
