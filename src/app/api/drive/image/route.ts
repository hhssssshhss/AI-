import { NextRequest, NextResponse } from "next/server";
import { getFileStream } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");
  const queryToken = searchParams.get("token");
  
  // 클라이언트가 헤더에 Authorization: Bearer <token> 으로 주거나, <img> 태그용으로 쿼리로 넘겨줌
  const authHeader = req.headers.get("authorization");
  const accessToken = queryToken || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

  if (!fileId || !accessToken) {
    return NextResponse.json(
      { error: "Missing fileId or authorization token" },
      { status: 400 }
    );
  }

  try {
    const stream = await getFileStream(fileId, accessToken);
    
    // 스트림을 응답으로 바로 파이핑 (Content-Type은 구글이 주는 미디어 타입 또는 일반 이미지 포맷으로 추정)
    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "image/jpeg", // 필요 시 원본 파일 mimeType을 조회하여 설정 가능
        "Cache-Control": "public, max-age=86400", // 하루 동안 캐시
      },
    });
  } catch (error: any) {
    console.error("[Drive Image] Error fetching file:", error);
    return NextResponse.json(
      { error: "Failed to fetch image from Google Drive" },
      { status: 500 }
    );
  }
}
