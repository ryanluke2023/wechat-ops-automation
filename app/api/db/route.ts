import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let storeReady = false;

function keyFor(collection: string) {
  return `wechat-ops-db:${collection}`;
}

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const collection = searchParams.get("collection");
  if (!collection) {
    return NextResponse.json({ error: "collection is required" }, { status: 400 });
  }

  await ensureStore();

  const record = await prisma.store.findUnique({
    where: { key: keyFor(collection) }
  });

  if (!record) return NextResponse.json({ found: false, value: null });

  try {
    return NextResponse.json({ found: true, value: JSON.parse(record.value) });
  } catch {
    return NextResponse.json({ found: true, value: null });
  }
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    collection?: string;
    value?: unknown;
  };

  if (!body.collection) {
    return NextResponse.json({ error: "collection is required" }, { status: 400 });
  }

  await ensureStore();

  await prisma.store.upsert({
    where: { key: keyFor(body.collection) },
    create: {
      key: keyFor(body.collection),
      value: JSON.stringify(body.value ?? null)
    },
    update: {
      value: JSON.stringify(body.value ?? null)
    }
  });

  return NextResponse.json({ ok: true });
}
