import { modelForMode, readApiSettings } from "@/lib/api-settings";
import { ModelMode } from "@/lib/types";

const SYSTEM_PROMPT = "你是中文公众号内容运营专家。只返回可解析 JSON，不要添加 Markdown 代码块。";

async function generateWithDeepSeek(prompt: string, apiKey: string, model: string) {
  if (!apiKey) return null;

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.75
    })
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.choices?.[0]?.message?.content as string;
}

async function generateWithOpenAI(prompt: string, apiKey: string, model: string) {
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.output_text as string;
}

export async function generateWithProvider(prompt: string, mode: ModelMode = "economy") {
  const settings = await readApiSettings();
  const preferredModel = modelForMode(settings, mode);

  if (mode === "quality" || mode === "image") {
    const primary = await generateWithOpenAI(prompt, settings.openAIKey, preferredModel || settings.openAIModel);
    if (primary || !settings.fallbackEnabled) return primary;
    return generateWithDeepSeek(prompt, settings.deepSeekKey, settings.deepSeekModel);
  }

  const primary = await generateWithDeepSeek(prompt, settings.deepSeekKey, preferredModel || settings.deepSeekModel);
  if (primary || !settings.fallbackEnabled) return primary;
  return generateWithOpenAI(prompt, settings.openAIKey, settings.openAIModel);
}

export function parseProviderJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return fallback;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return fallback;
    }
  }
}
