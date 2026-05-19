import { modelForMode, providerForMode, readApiSettings } from "@/lib/api-settings";
import { ApiSettings, ModelMode, ModelProvider } from "@/lib/types";

const SYSTEM_PROMPT = "你是中文公众号内容运营专家。只返回可解析 JSON，不要添加 Markdown 代码块。";

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

async function generateWithChatCompletions({
  apiKey,
  baseUrl,
  model,
  prompt,
  headers = {}
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
  headers?: Record<string, string>;
}) {
  if (!apiKey || !baseUrl || !model) return null;

  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...headers
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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
  if (!apiKey || !model) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.output_text as string;
}

function modelForProvider(settings: ApiSettings, provider: ModelProvider, preferredModel?: string) {
  if (preferredModel) return preferredModel;
  if (provider === "openai") return settings.openAIModel;
  if (provider === "deepseek") return settings.deepSeekModel;
  if (provider === "openrouter") return settings.openRouterModel;
  if (provider === "siliconflow") return settings.siliconFlowModel;
  return settings.customModel;
}

async function generateWithNamedProvider(settings: ApiSettings, provider: ModelProvider, prompt: string, preferredModel?: string) {
  const model = modelForProvider(settings, provider, preferredModel);
  if (provider === "openai") return generateWithOpenAI(prompt, settings.openAIKey, model);
  if (provider === "deepseek") {
    return generateWithChatCompletions({
      apiKey: settings.deepSeekKey,
      baseUrl: "https://api.deepseek.com",
      model,
      prompt
    });
  }
  if (provider === "openrouter") {
    return generateWithChatCompletions({
      apiKey: settings.openRouterKey,
      baseUrl: settings.openRouterBaseUrl,
      model,
      prompt,
      headers: {
        "HTTP-Referer": "http://localhost:3012",
        "X-Title": "Wechat Ops Automation"
      }
    });
  }
  if (provider === "siliconflow") {
    return generateWithChatCompletions({
      apiKey: settings.siliconFlowKey,
      baseUrl: settings.siliconFlowBaseUrl,
      model,
      prompt
    });
  }
  return generateWithChatCompletions({
    apiKey: settings.customApiKey,
    baseUrl: settings.customBaseUrl,
    model,
    prompt
  });
}

function fallbackProviders(primary: ModelProvider): ModelProvider[] {
  const providers: ModelProvider[] = [primary, "deepseek", "openai", "openrouter", "siliconflow", "custom"];
  return providers.filter(
    (provider, index, all) => all.indexOf(provider) === index
  );
}

export async function generateWithProvider(prompt: string, mode: ModelMode = "economy") {
  const settings = await readApiSettings();
  const primaryProvider = providerForMode(settings, mode);
  const preferredModel = modelForMode(settings, mode);

  for (const provider of fallbackProviders(primaryProvider)) {
    try {
      const result = await generateWithNamedProvider(settings, provider, prompt, provider === primaryProvider ? preferredModel : undefined);
      if (result || !settings.fallbackEnabled) return result;
    } catch (error) {
      if (!settings.fallbackEnabled) throw error;
    }
  }

  return null;
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
