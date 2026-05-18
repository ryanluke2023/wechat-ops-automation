import { ModelMode } from "@/lib/types";

const SYSTEM_PROMPT = "你是中文公众号内容运营专家。只返回可解析 JSON，不要添加 Markdown 代码块。";

async function generateWithDeepSeek(prompt: string) {
  if (!process.env.DEEPSEEK_API_KEY) return null;

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
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

async function generateWithOpenAI(prompt: string) {
  if (!process.env.OPENAI_API_KEY) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
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
  if (mode === "quality" || mode === "image") {
    return (await generateWithOpenAI(prompt)) ?? (await generateWithDeepSeek(prompt));
  }

  return (await generateWithDeepSeek(prompt)) ?? (await generateWithOpenAI(prompt));
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
