import { NextResponse } from "next/server";
import { syncOfflinePayload } from "@/lib/data/actions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await syncOfflinePayload({
      actions: body.actions || [],
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 401 },
    );
  }
}
