import { NextResponse } from "next/server";
import { performanceMock } from "@/lib/mock-generators";
import { formatAccountProfile } from "@/lib/profile-context";
import { generateWithProvider, parseProviderJson } from "@/lib/provider";
import { PerformanceResult } from "@/lib/types";

function normalizeList(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(/\n|;|；/).map((item) => item.trim()).filter(Boolean);
  return fallback;
}

function normalizePerformance(value: Partial<PerformanceResult>, fallback: PerformanceResult): PerformanceResult {
  return {
    score: Number(value.score ?? fallback.score) || fallback.score,
    titleAnalysis: String(value.titleAnalysis || fallback.titleAnalysis),
    topicAnalysis: String(value.topicAnalysis || fallback.topicAnalysis),
    improvements: normalizeList(value.improvements, fallback.improvements),
    reusablePatterns: normalizeList(value.reusablePatterns, fallback.reusablePatterns),
    avoid: normalizeList(value.avoid, fallback.avoid)
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const fallback = performanceMock(body);
  const prompt = `分析公众号内容表现，返回 JSON，字段为 score, titleAnalysis, topicAnalysis, improvements, reusablePatterns, avoid。
请结合导入的后台数据、高表现选题和下周策略，给出可执行复盘，不要泛泛而谈。
账号画像：
${formatAccountProfile(body.accountProfile)}
输入数据：${JSON.stringify(body)}`;

  try {
    const raw = await generateWithProvider(prompt, body.modelMode);
    return NextResponse.json(normalizePerformance(parseProviderJson<PerformanceResult>(raw, fallback), fallback));
  } catch (error) {
    return NextResponse.json({ ...fallback, providerError: String(error) });
  }
}
