import { NextResponse } from "next/server";
import { publicApiSettings, readApiSettings, saveApiSettings } from "@/lib/api-settings";
import { ApiSettings } from "@/lib/types";

export async function GET() {
  const settings = await readApiSettings();
  return NextResponse.json(publicApiSettings(settings));
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<ApiSettings>;
  const settings = await saveApiSettings(body);
  return NextResponse.json(publicApiSettings(settings));
}
