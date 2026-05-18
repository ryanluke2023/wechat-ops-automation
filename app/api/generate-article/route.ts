import { NextResponse } from "next/server";
import { articleMock } from "@/lib/mock-generators";
import { generateWithProvider, parseProviderJson } from "@/lib/provider";
import { ArticleResult } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const fallback = articleMock(body);
  const prompt = `生成一篇结构化微信公众号文章，返回 JSON，字段为 title, subtitle, opening, sections, quotes, conclusion, cta。
sections 是数组，每项包含 heading, body, evidence。quotes 是中文金句数组。
输入：${JSON.stringify(body)}`;

  try {
    const raw = await generateWithProvider(prompt, body.modelMode);
    return NextResponse.json(parseProviderJson<ArticleResult>(raw, fallback));
  } catch (error) {
    return NextResponse.json({ ...fallback, providerError: String(error) });
  }
}
