import { AccountProfile } from "@/lib/types";

export function formatAccountProfile(profile?: AccountProfile | null) {
  if (!profile) return "未指定账号画像。";

  return [
    `账号名称：${profile.name}`,
    `账号定位：${profile.positioning}`,
    `目标读者：${profile.targetReaders}`,
    `常用语气：${profile.tone}`,
    `禁用表达：${profile.bannedExpressions}`,
    `标题风格：${profile.titleStyle}`,
    `内容结构模板：${profile.structureTemplate}`,
    `竞品账号：${profile.competitors}`
  ].join("\n");
}
