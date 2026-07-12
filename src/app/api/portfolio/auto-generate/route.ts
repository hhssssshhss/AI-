import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds (Hobby plan maximum for App Router APIs)

const PORTFOLIO_PROMPT = `당신은 취업 준비생의 포트폴리오를 대필해주는 전문 에디터입니다.
다음은 사용자가 활동을 처음 기록할 때 작성한 기본 정보와, 이후 진행한 AI 인터뷰 Q&A 기록입니다.
이 두 가지 기록을 종합하여 포트폴리오의 한 페이지(활동 내역)에 들어갈 텍스트를 작성해주세요.

작성 형식 (Markdown):
### 활동 요약
(기본 정보와 인터뷰 내용을 바탕으로 활동의 핵심을 2~3줄로 요약)

### 주요 역할 및 성과
(본인이 맡은 역할과 이룬 성과를 글머리 기호로 2~3개 작성)

### 문제 해결 과정
(마주했던 어려움과 이를 극복한 과정을 구체적으로 작성)

### 배운 점 및 향후 계획
(활동을 통해 배운 점과 이를 어떻게 발전시킬 것인지 작성)

단, 제공된 기록에 없는 내용을 지어내지 마세요. 기록이 부족하다면 있는 내용만으로 자연스럽게 작성하세요.`;

export async function POST(req: NextRequest) {
  try {
    // 런타임 환경변수 체크 (Vercel에 제대로 들어갔는지 확인용)
    if (!process.env.GEMINI_API_KEY) {
      console.error("[/api/portfolio/auto-generate] GEMINI_API_KEY is missing at runtime");
      return NextResponse.json(
        { error: "Vercel 환경 변수에 GEMINI_API_KEY가 없습니다. 셋팅 후 '재배포(Redeploy)'가 필요할 수 있습니다." },
        { status: 500 }
      );
    }

    const { activityTitle, activitySummary, activityRole, activityKeywords, qaItems } = await req.json();

    if (!qaItems || !Array.isArray(qaItems) || qaItems.length === 0) {
      return NextResponse.json(
        { error: "인터뷰 기록이 없습니다." },
        { status: 400 }
      );
    }

    const qaText = qaItems
      .map((qa, index) => `Q${index + 1}: ${qa.question}\nA${index + 1}: ${qa.answer || "답변 없음"}`)
      .join("\n\n");

    const baseInfo = `[초기 활동 기록]\n- 요약: ${activitySummary || "내용 없음"}\n- 역할: ${activityRole || "내용 없음"}\n- 키워드: ${activityKeywords ? activityKeywords.join(", ") : "없음"}`;

    const prompt = `${PORTFOLIO_PROMPT}\n\n활동명: ${activityTitle}\n\n${baseInfo}\n\n[인터뷰 기록]\n${qaText}`;

    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("[/api/portfolio/auto-generate] Error:", error);
    return NextResponse.json(
      { error: `API 호출 에러: ${error?.message || "알 수 없는 에러"}` },
      { status: 500 }
    );
  }
}
