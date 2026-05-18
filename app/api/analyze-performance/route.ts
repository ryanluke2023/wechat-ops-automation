import { NextResponse } from "next/server";
import { performanceMock } from "@/lib/mock-generators";
import { generateWithProvider, parseProviderJson } from "@/lib/provider";
import { PerformanceResult } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const fallback = performanceMock(body);
  const prompt = `分析公众号内容表现，返回 JSON，字段为 score, titleAnalysis, topicAnalysis, improvements, reusablePatterns, avoid。
输入数据：${JSON.stringify(body)}`;

  try {
    const raw = await generateWithProvider(prompt, body.modelMode);
    return NextResponse.json(parseProviderJson<PerformanceResult>(raw, fallback));
  } catch (error) {
    return NextResponse.json({ ...fallback, providerError: String(error) });
  }
}
