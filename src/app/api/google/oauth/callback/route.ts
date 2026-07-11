import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { getTokens } from '@/lib/google-drive';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const userId = searchParams.get("state");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/activities?oauthError=true`, req.url)
    );
  }

  try {
    // 코드를 사용해 토큰(액세스 토큰, 리프레시 토큰 등) 발급
    const tokens = await getTokens(code);
    
    const accessToken = tokens.access_token || "";
    const refreshToken = tokens.refresh_token || null;
    const expiresIn = tokens.expiry_date || Date.now() + 3600 * 1000;

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleDriveLinked: true,
          ...(refreshToken && { googleRefreshToken: refreshToken }),
        },
      });
    }

    // access_token을 URL 파라미터로 전달 — 클라이언트에서 Zustand 스토어에 저장
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
