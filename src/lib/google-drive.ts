import { google } from "googleapis";

const clientId = process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const redirectUri = process.env.GOOGLE_REDIRECT_URI || "";

if (!clientId || !clientSecret || !redirectUri) {
  console.warn("WARNING: Google OAuth environment variables are not fully set.");
}

/**
 * 사용자에게 구글 드라이브 파일 접근 동의를 구하기 위한 OAuth 인증 URL을 생성합니다.
 */
export const getGoogleOAuthUrl = (userId: string) => {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
    prompt: "consent",
    state: userId,
  });
};

/**
 * 전달받은 토큰 정보를 바탕으로 Google Drive v3 클라이언트 인스턴스를 반환합니다.
 * @param accessToken OAuth 액세스 토큰
 * @param refreshToken OAuth 리프레시 토큰 (선택)
 */
export const getDriveClient = (accessToken: string, refreshToken?: string) => {
  const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.drive({ version: "v3", auth });
};
