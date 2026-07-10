import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL이 제공되지 않았습니다." }, { status: 400 });
    }

    // 간단한 URL 유효성 검사
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "유효한 URL 형식이 아닙니다." }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      // 캐시 방지
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`페이지를 불러오지 못했습니다. 응답 코드: ${response.status}`);
    }

    const html = await response.text();

    // 1. Script 및 Style 태그 콘텐츠 제거
    let text = html
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
      // 2. HTML 주석 제거
      .replace(/<!--[\s\S]*?-->/g, "")
      // 3. HTML 태그 제거
      .replace(/<[^>]+>/g, " ")
      // 4. HTML 엔티티 치환
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // 5. 연속된 공백 및 줄바꿈 정리
      .replace(/\s+/g, " ")
      .trim();

    // 입력 크기 조절 (토큰 방지 - 최대 5000글자)
    if (text.length > 5000) {
      text = text.substring(0, 5000) + "...";
    }

    if (!text) {
      return NextResponse.json(
        { error: "페이지에서 텍스트를 추출하지 못했습니다. 본문을 직접 입력해 주세요." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("[Crawl API Error]", error);
    return NextResponse.json(
      { 
        error: "채용공고 페이지를 불러오는 데 실패했습니다.", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
