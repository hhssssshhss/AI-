import { NextResponse } from "next/server";
import { getGoogleOAuthUrl } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const url = getGoogleOAuthUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[OAuth redirect] Error generating URL:", error);
    return NextResponse.json(
      { error: "Failed to generate Google OAuth URL" },
      { status: 500 }
    );
  }
}
