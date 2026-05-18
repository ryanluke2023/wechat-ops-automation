import { NextResponse } from "next/server";
import { topicMock } from "@/lib/mock-generators";
import { generateWithProvider, parseProviderJson } from "@/lib/provider";
import { TopicResult } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const fallback = topicMock(body);
  const prompt = `根据以下信息生成公众号选题中枢结果，返回 JSON，字段为 recommendations, angles, controversy, hooks, informationGain, titles, structures，每个字段都是中文字符串数组。
输入：${JSON.stringify(body)}`;

  try {
    const raw = await generateWithProvider(prompt, body.modelMode);
    return NextResponse.json(parseProviderJson<TopicResult>(raw, fallback));
  } catch (error) {
    return NextResponse.json({ ...fallback, providerError: String(error) });
  }
}
