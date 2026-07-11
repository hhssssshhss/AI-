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

    let loggedInUserId = userId;

    if (userId === "login") {
      // 구글 프로필 정보 가져오기
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const profile = await profileRes.json();
      
      const email = profile.email;
      const name = profile.name || "구글 사용자";
      const avatar = profile.picture;

      // DB에서 이메일로 사용자 조회
      let user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        // 첫 구글 로그인이면 회원가입 처리
        user = await prisma.user.create({
          data: {
            email,
            name,
            avatar,
            googleDriveLinked: true,
            ...(refreshToken && { googleRefreshToken: refreshToken }),
          }
        });
      } else {
        // 기존 사용자인 경우 드라이브 연동 정보 갱신
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleDriveLinked: true,
            ...(refreshToken && { googleRefreshToken: refreshToken }),
          }
        });
      }
      loggedInUserId = user.id;
    } else if (userId) {
      // 로그인된 상태에서 단순히 드라이브만 연동한 경우
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleDriveLinked: true,
          ...(refreshToken && { googleRefreshToken: refreshToken }),
        },
      });
    }

    // access_token과 함께 userId를 URL 파라미터로 전달 — 클라이언트에서 Zustand 스토어에 저장
    const redirectUrl = new URL(userId === "login" ? "/dashboard" : "/activities", req.url);
    redirectUrl.searchParams.set("driveToken", accessToken);
    redirectUrl.searchParams.set("driveTokenExpiry", String(expiresIn));
    if (userId === "login" && loggedInUserId) {
      redirectUrl.searchParams.set("loggedInUserId", loggedInUserId);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[OAuth callback] Error:", err);
    return NextResponse.redirect(
      new URL(`/activities?oauthError=true`, req.url)
    );
  }
}
