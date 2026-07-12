// POST /api/activities
// Feature 1: Drive 파일 업로드 결과(fileId) 수신 → 텍스트 추출 → Gemini 구조화 호출
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { extractContent, SupportedMimeType } from "@/lib/parsers";
import { getGeminiModel } from "@/lib/gemini";
import { SchemaType, type Schema } from "@google/generative-ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPPORTED_MIMES: SupportedMimeType[] = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/jpeg",
  "image/png",
];

const activitySchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    role: { type: SchemaType.STRING },
    keywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["title", "summary", "role", "keywords"],
};

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay * Math.pow(2, attempt)));
    }
  }
  throw new Error("Max retries exceeded");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fileId,
      fileName,
      mimeType,
      sizeBytes,
      accessToken,
      activityTitle,
      activityDescription,
      activityRole,
    } = body;

    if (!fileId || !accessToken) {
      return NextResponse.json(
        { error: "fileId and accessToken are required" },
        { status: 400 }
      );
    }

    if (!SUPPORTED_MIMES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType}` },
        { status: 415 }
      );
    }

    // Drive에서 파일 다운로드 (메모리에서만 처리)
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: "v3", auth });

    const fileResponse = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    const buffer = Buffer.from(fileResponse.data as ArrayBuffer);

    // 텍스트/이미지 추출
    const parsed = await extractContent(buffer, mimeType as SupportedMimeType);

    // Gemini 구조화 호출
    const model = getGeminiModel();
    let structuredActivity: {
      title: string;
      summary: string;
      role: string;
      keywords: string[];
    } | undefined;

    await withRetry(async () => {
      if (parsed.isImage && parsed.imageBase64) {
        // 멀티모달 입력 (이미지)
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: parsed.imageBase64,
                  },
                },
                {
                  text: `이 이미지는 취업 준비생의 활동 자료입니다. 
활동명: ${activityTitle}
사용자가 제공한 부가 정보: 
- 간단한 설명: ${activityDescription || "없음"}
- 맡은 역할: ${activityRole || "없음"}

파일 내용과 사용자가 제공한 부가 정보를 종합하여 (추측 금지) JSON으로 구조화해주세요.
반환 스키마: { title, summary, role, keywords[] }`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: activitySchema,
          },
        });
        structuredActivity = JSON.parse(result.response.text());
      } else {
        // 텍스트 입력
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `다음은 취업 준비생의 활동 자료입니다.
활동명: ${activityTitle}
사용자가 제공한 부가 정보: 
- 간단한 설명: ${activityDescription || "없음"}
- 맡은 역할: ${activityRole || "없음"}

내용:
${parsed.text}

파일 내용과 사용자가 제공한 부가 정보를 종합하여 (추측 금지) 활동을 JSON으로 구조화해주세요.
반환 스키마: { title, summary, role, keywords[] }`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: activitySchema,
          },
        });
        structuredActivity = JSON.parse(result.response.text());
      }
    });

    return NextResponse.json({
      activity: {
        ...structuredActivity,
        status: "READY",
        files: [{ fileId, fileName, mimeType, sizeBytes, parseStatus: "DONE" }],
      },
    });
  } catch (error) {
    console.error("[/api/activities] Error:", error);
    return NextResponse.json(
      { error: "Failed to process file", details: String(error) },
      { status: 500 }
    );
  }
}
