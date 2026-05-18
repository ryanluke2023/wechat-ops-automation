import { prisma } from "@/lib/prisma";
import { ApiSettings, ModelMode } from "@/lib/types";

const SETTINGS_KEY = "wechat-ops-db:apiSettings";

export const defaultApiSettings: ApiSettings = {
  openAIKey: "",
  deepSeekKey: "",
  openAIModel: process.env.OPENAI_MODEL || "gpt-5.4-mini",
  deepSeekModel: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
  imageModel: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
  imageQuality: process.env.OPENAI_IMAGE_QUALITY || "medium",
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

export function publicApiSettings(settings: ApiSettings) {
  return {
    ...settings,
    openAIKey: "",
    deepSeekKey: "",
    hasOpenAIKey: Boolean(settings.openAIKey),
    hasDeepSeekKey: Boolean(settings.deepSeekKey)
  };
}
