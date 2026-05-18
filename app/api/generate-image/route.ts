import { NextResponse } from "next/server";
import { readApiSettings } from "@/lib/api-settings";

type ImageKind = "cover" | "poster" | "inline";

type ImageGenerateBody = {
  kind?: ImageKind;
  prompt?: string;
  topic?: string;
  title?: string;
};

function sizeFor(kind: ImageKind) {
  if (kind === "poster") return "1024x1536";
  if (kind === "cover") return "1536x1024";
  return "1024x1024";
}

function buildPrompt(body: ImageGenerateBody) {
  const kind = body.kind || "cover";
  const base = body.prompt?.trim() || body.title || body.topic || "公众号配图";
  const scene =
    kind === "poster"
      ? "竖版社交媒体海报，适合朋友圈和小红书预览。"
      : kind === "inline"
        ? "公众号文中配图，信息图感，适合插入正文段落之间。"
        : "公众号头图封面，横版构图，适合微信文章首屏。";

  return [
    scene,
    base,
    "视觉风格：Apple 官网式克制留白，Bloomberg / Wall Street Journal 数据感，真实商业科技质感。",
    "中文文字必须少、短、大、清晰，避免密集小字，不要生成二维码、真实商标、水印或虚假 UI。"
  ].join("\n");
}

function fallback(prompt: string, error: string) {
  return {
    ok: false,
    prompt,
    error: error.replace(/sk-[A-Za-z0-9_*.-]+/g, "sk-***")
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as ImageGenerateBody;
  const kind = body.kind || "cover";
  const prompt = buildPrompt(body);
  const settings = await readApiSettings();

  if (!settings.openAIKey) {
    return NextResponse.json(fallback(prompt, "OPENAI_API_KEY 未配置，已保留提示词兜底。"));
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.openAIKey}`
      },
      body: JSON.stringify({
        model: settings.imageModel,
        prompt,
        size: sizeFor(kind),
        quality: settings.imageQuality,
        n: 1
      })
    });

    if (!response.ok) {
      return NextResponse.json(fallback(prompt, `图片生成服务返回 ${response.status}，已保留提示词兜底。`));
    }

    const data = await response.json();
    const first = data.data?.[0];
    const imageUrl = first?.b64_json ? `data:image/png;base64,${first.b64_json}` : first?.url;

    if (!imageUrl) {
      return NextResponse.json(fallback(prompt, "图片接口未返回可展示图片，已保留提示词兜底。"));
    }

    return NextResponse.json({
      ok: true,
      prompt,
      imageUrl
    });
  } catch (error) {
    return NextResponse.json(fallback(prompt, String(error)));
  }
}
