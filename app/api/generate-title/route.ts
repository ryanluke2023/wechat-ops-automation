import { NextResponse } from "next/server";
import { titlesMock } from "@/lib/mock-generators";
import { generateWithProvider, parseProviderJson } from "@/lib/provider";
import { TitleResult } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const fallback = titlesMock(body);
  const prompt = `基于同一个公众号选题生成 8 组标题，返回 JSON 数组。每项字段：type, title, score, risk, audience, reason。
标题类型依次覆盖：悬念型、反常识型、数字型、情绪型、趋势型、财经媒体型、知识升级型、朋友圈转发型。
输入：${JSON.stringify(body)}`;

  try {
    const raw = await generateWithProvider(prompt, body.modelMode);
    return NextResponse.json(parseProviderJson<TitleResult[]>(raw, fallback));
  } catch (error) {
    return NextResponse.json({ data: fallback, providerError: String(error) });
  }
}
