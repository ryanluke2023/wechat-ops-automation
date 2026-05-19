import { NextResponse } from "next/server";
import { readApiSettings } from "@/lib/api-settings";

type TestStatus = "ok" | "missing" | "failed";

async function testEndpoint(name: string, url: string, apiKey: string) {
  if (!apiKey) {
    return { name, status: "missing" as TestStatus, message: "未配置 API Key" };
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return { name, status: "failed" as TestStatus, message: `HTTP ${response.status}` };
    }

    return { name, status: "ok" as TestStatus, message: "连接正常" };
  } catch (error) {
    return { name, status: "failed" as TestStatus, message: String(error).replace(/sk-[A-Za-z0-9_*.-]+/g, "sk-***") };
  }
}

function modelsUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/$/, "")}/models`;
}

export async function POST() {
  const settings = await readApiSettings();
  const [openai, deepseek, openrouter, siliconflow, custom] = await Promise.all([
    testEndpoint("OpenAI", "https://api.openai.com/v1/models", settings.openAIKey),
    testEndpoint("DeepSeek", "https://api.deepseek.com/models", settings.deepSeekKey),
    testEndpoint("OpenRouter", modelsUrl(settings.openRouterBaseUrl), settings.openRouterKey),
    testEndpoint("SiliconFlow", modelsUrl(settings.siliconFlowBaseUrl), settings.siliconFlowKey),
    settings.customBaseUrl
      ? testEndpoint("自定义兼容 API", modelsUrl(settings.customBaseUrl), settings.customApiKey)
      : Promise.resolve({ name: "自定义兼容 API", status: "missing" as TestStatus, message: "未配置 Base URL" })
  ]);

  return NextResponse.json({
    results: [
      openai,
      deepseek,
      openrouter,
      siliconflow,
      custom,
      {
        name: "图片模型",
        status: openai.status,
        message: openai.status === "ok" ? `使用 ${settings.imageModel}` : openai.message
      }
    ],
    fallbackEnabled: settings.fallbackEnabled
  });
}
