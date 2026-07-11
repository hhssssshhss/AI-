import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[OAuth redirect] Error generating URL:", error);
    return NextResponse.json(
      { error: "Failed to generate Google OAuth URL" },
      { status: 500 }
    );
  }
}
