import { NextResponse } from "next/server";
import { packageMock } from "@/lib/mock-generators";
import { formatAccountProfile } from "@/lib/profile-context";
import { generateWithProvider, parseProviderJson } from "@/lib/provider";
import { PublishPackage } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const fallback = packageMock(body.article);
  const prompt = `把文章整理成公众号发布包，返回 JSON，字段为 markdown, wechatLayout, summary, coverPrompt, imagePrompts, posterCopy, momentsCopy, xiaohongshuTitles, shortVideoOutline。
如果 modelMode 是 image，请重点强化 coverPrompt 和 imagePrompts，让它们适合直接交给图像生成模型。
分发文案、封面提示词和短视频口播必须贴合账号画像，不得使用禁用表达。
账号画像：
${formatAccountProfile(body.accountProfile)}
输入：${JSON.stringify(body)}`;

  try {
    const raw = await generateWithProvider(prompt, body.modelMode);
    return NextResponse.json(parseProviderJson<PublishPackage>(raw, fallback));
  } catch (error) {
    return NextResponse.json({ ...fallback, providerError: String(error) });
  }
}
