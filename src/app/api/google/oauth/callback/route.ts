// GET /api/google/oauth/callback
// Google OAuth 콜백 처리 — access_token을 쿼리로 전달하여 클라이언트에서 Zustand에 저장
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const clientId = process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google/oauth/callback`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/activities?oauthError=true`, req.url)
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    const accessToken = tokens.access_token || "";
    const expiresIn = tokens.expiry_date || Date.now() + 3600 * 1000;

    // access_token을 URL 파라미터로 전달 — 클라이언트에서 Zustand 스토어에 저장
    // (서버 DB 없으므로 세션에 직접 저장하지 않음)
    const redirectUrl = new URL("/activities", req.url);
    redirectUrl.searchParams.set("driveToken", accessToken);
    redirectUrl.searchParams.set("driveTokenExpiry", String(expiresIn));

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[OAuth callback] Error:", err);
    return NextResponse.redirect(
      new URL(`/activities?oauthError=true`, req.url)
    );
  }
}
