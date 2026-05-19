import { prisma } from "@/lib/prisma";
import { ApiSettings, ModelMode, ModelProvider } from "@/lib/types";

const SETTINGS_KEY = "wechat-ops-db:apiSettings";

export const defaultApiSettings: ApiSettings = {
  openAIKey: "",
  deepSeekKey: "",
  openRouterKey: "",
  siliconFlowKey: "",
  customApiKey: "",
  openAIModel: process.env.OPENAI_MODEL || "gpt-5.4-mini",
  deepSeekModel: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
  openRouterModel: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
  siliconFlowModel: process.env.SILICONFLOW_MODEL || "deepseek-ai/DeepSeek-V3",
  customModel: process.env.CUSTOM_MODEL || "",
  openRouterBaseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  siliconFlowBaseUrl: process.env.SILICONFLOW_BASE_URL || "https://api.siliconflow.cn/v1",
  customBaseUrl: process.env.CUSTOM_BASE_URL || "",
  imageModel: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
  imageQuality: process.env.OPENAI_IMAGE_QUALITY || "medium",
  defaultProviders: {
    economy: "deepseek",
    quality: "openai",
    image: "openai"
  },
  defaults: {
    economy: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    quality: process.env.OPENAI_MODEL || "gpt-5.4-mini",
    image: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1"
  },
  fallbackEnabled: true
};

let storeReady = false;

async function ensureStore() {
  if (storeReady) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Store" (
      "key" TEXT NOT NULL PRIMARY KEY,
      "value" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  storeReady = true;
}

function mergeSettings(value: Partial<ApiSettings> | null): ApiSettings {
  return {
    ...defaultApiSettings,
    ...(value || {}),
    openAIKey: value?.openAIKey || process.env.OPENAI_API_KEY || "",
    deepSeekKey: value?.deepSeekKey || process.env.DEEPSEEK_API_KEY || "",
    openRouterKey: value?.openRouterKey || process.env.OPENROUTER_API_KEY || "",
    siliconFlowKey: value?.siliconFlowKey || process.env.SILICONFLOW_API_KEY || "",
    customApiKey: value?.customApiKey || process.env.CUSTOM_API_KEY || "",
    defaultProviders: {
      ...defaultApiSettings.defaultProviders,
      ...(value?.defaultProviders || {})
    },
    defaults: {
      ...defaultApiSettings.defaults,
      ...(value?.defaults || {})
    }
  };
}

export async function readApiSettings() {
  await ensureStore();
  const record = await prisma.store.findUnique({ where: { key: SETTINGS_KEY } });
  if (!record) return mergeSettings(null);

  try {
    return mergeSettings(JSON.parse(record.value) as Partial<ApiSettings>);
  } catch {
    return mergeSettings(null);
  }
}

export async function saveApiSettings(next: Partial<ApiSettings>) {
  await ensureStore();
  const current = await readApiSettings();
  const settings: ApiSettings = {
    ...current,
    ...next,
    openAIKey: next.openAIKey === "" ? current.openAIKey : next.openAIKey ?? current.openAIKey,
    deepSeekKey: next.deepSeekKey === "" ? current.deepSeekKey : next.deepSeekKey ?? current.deepSeekKey,
    openRouterKey: next.openRouterKey === "" ? current.openRouterKey : next.openRouterKey ?? current.openRouterKey,
    siliconFlowKey: next.siliconFlowKey === "" ? current.siliconFlowKey : next.siliconFlowKey ?? current.siliconFlowKey,
    customApiKey: next.customApiKey === "" ? current.customApiKey : next.customApiKey ?? current.customApiKey,
    defaultProviders: {
      ...current.defaultProviders,
      ...(next.defaultProviders || {})
    },
    defaults: {
      ...current.defaults,
      ...(next.defaults || {})
    }
  };

  await prisma.store.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) }
  });

  return settings;
}

export function modelForMode(settings: ApiSettings, mode: ModelMode) {
  return settings.defaults[mode] || (mode === "economy" ? settings.deepSeekModel : mode === "image" ? settings.imageModel : settings.openAIModel);
}

export function providerForMode(settings: ApiSettings, mode: ModelMode): ModelProvider {
  return settings.defaultProviders[mode] || (mode === "economy" ? "deepseek" : "openai");
}

export function publicApiSettings(settings: ApiSettings) {
  return {
    ...settings,
    openAIKey: "",
    deepSeekKey: "",
    openRouterKey: "",
    siliconFlowKey: "",
    customApiKey: "",
    hasOpenAIKey: Boolean(settings.openAIKey),
    hasDeepSeekKey: Boolean(settings.deepSeekKey),
    hasOpenRouterKey: Boolean(settings.openRouterKey),
    hasSiliconFlowKey: Boolean(settings.siliconFlowKey),
    hasCustomApiKey: Boolean(settings.customApiKey)
  };
}
