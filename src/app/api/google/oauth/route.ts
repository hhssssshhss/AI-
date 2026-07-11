import { NextResponse, NextRequest } from "next/server";
import { getGoogleOAuthUrl } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const url = getGoogleOAuthUrl(userId);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[OAuth redirect] Error generating URL:", error);
    return NextResponse.json(
      { error: "Failed to generate Google OAuth URL" },
      { status: 500 }
    );
  }
}
