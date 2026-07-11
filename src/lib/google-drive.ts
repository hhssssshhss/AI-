import { google } from 'googleapis';
import { Readable } from 'stream';

// 클라이언트는 서버 런타임에서만 안전하게 사용됩니다.
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/oauth/callback'
);

/**
 * 구글 OAuth 동의 화면 URL 생성
 */
export function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // 항상 동의 화면을 띄워 refresh token을 받아오도록 설정
  });
}

/**
 * 인증 코드로 토큰 교환
 */
export async function getTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * OAuth2 클라이언트에 자격증명(토큰) 설정
 */
export function setCredentials(tokens: any) {
  oauth2Client.setCredentials(tokens);
}

/**
 * CareerFolio 전용 폴더 찾기 또는 생성
 */
export async function getOrCreateCareerFolioFolder(): Promise<string> {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const folderName = 'CareerFolio';

  const res = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  const folderRes = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });

  return folderRes.data.id!;
}

/**
 * 지정된 버퍼를 구글 드라이브(CareerFolio 폴더)에 업로드
 * @returns 업로드된 파일의 구글 드라이브 fileId
 */
export async function uploadFileToDrive(
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer
): Promise<string> {
  const folderId = await getOrCreateCareerFolioFolder();
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: mimeType,
    body: Readable.from(fileBuffer),
  };

  const fileRes = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id',
  });

  return fileRes.data.id!;
}
