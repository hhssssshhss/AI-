import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds (Hobby plan maximum for App Router APIs)

const PORTFOLIO_PROMPT = `사용자의 활동 기록과 인터뷰 내용을 분석하여, 실무 포트폴리오에 즉시 삽입할 수 있는 객관적이고 전문적인 성과 중심 텍스트로 변환하세요.

[절대 금지 사항]
* "제공해주신 내용을 바탕으로~", "다음은 정리한 내용입니다" 같은 AI의 인사말이나 부연 설명을 절대 출력하지 마세요. 오직 결과물만 출력하세요.
* 1인칭 대명사("저는", "제가") 및 감정적 서술을 철저히 배제하세요.
* 자기소개서 형식의 감상, 배운 점, 향후 다짐("깨달았습니다", "성장하겠습니다")을 절대 포함하지 마세요.

[작성 규칙]
* 모든 문장은 철저히 객관적인 사실 기반으로 작성하세요.
* 문장의 끝은 명사형 종결어미('-함', '-됨', '-구축', '-도출' 등)를 사용하여 개조식으로 간결하게 떨어지도록 작성하세요.
* '문제 해결 과정'은 감정적 어려움(예: 어려움을 겪었습니다)을 빼고, '문제 상황 -> 도입한 전략/기술 -> 결과' 구조로 건조하게 작성하세요.
* 성과 데이터(%, 횟수, 수치 등)를 최대한 강조하여 작성하세요.

[출력 포맷 (예시)]
### 활동 요약
* (1~2줄 이내의 객관적인 프로젝트 요약)

### 주요 역할 및 성과
* (핵심 키워드): (상세 수행 내용 및 정량적 성과)
* (핵심 키워드): (상세 수행 내용 및 정량적 성과)

### 문제 해결 및 기술적 성과
* (적용한 방식이나 기술을 명사형으로 간결하게 서술)`;

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
