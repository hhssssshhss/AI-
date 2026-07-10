// POST /api/portfolio/generate
// Feature 3: 직무 기반 Gemini 초안 생성
import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { SchemaType, type Schema } from "@google/generative-ai";

const portfolioBlockSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    blocks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING },
          content: { type: SchemaType.STRING },
          activityId: { type: SchemaType.STRING },
        },
        required: ["id", "type", "content"],
      },
    },
  },
  required: ["blocks"],
};

const JOB_STYLE_GUIDES: Record<string, string> = {
  marketing:
    "마케팅 직무 스타일: 성과 수치 중심, 창의적 표현, 고객/시장 관점 강조",
  dev: "개발 직무 스타일: 기술 스택 명시, 문제 해결 과정 중심, 수치적 성능 개선 강조",
  data: "데이터 분석 직무 스타일: 데이터 기반 의사결정, 분석 방법론 언급, 인사이트 도출 강조",
  planning:
    "서비스 기획 직무 스타일: 사용자 중심, 문제 정의→해결 흐름, 협업 역할 명시",
  design: "디자인 직무 스타일: 사용자 경험 중심, 디자인 프로세스 언급, 시각적 성과 강조",
};

export async function POST(req: NextRequest) {
  try {
    const { activities, targetJob } = await req.json();

    if (!activities?.length || !targetJob) {
      return NextResponse.json(
        { error: "activities and targetJob are required" },
        { status: 400 }
      );
    }

    const styleGuide =
      JOB_STYLE_GUIDES[targetJob] ||
      "전문적이고 간결한 스타일로 역량을 강조합니다.";

    const activitiesContext = activities
      .map(
        (a: {
          id: string;
          title: string;
          summary: string;
          role: string;
          keywords: string[];
          interview?: { qaItems: { question: string; answer?: string; keyInsight?: string }[] };
        }) => `
활동: ${a.title}
역할: ${a.role}
요약: ${a.summary}
키워드: ${a.keywords?.join(", ")}
인터뷰 인사이트:
${
  a.interview?.qaItems
    ?.filter((q) => q.answer)
    .map((q) => `  Q: ${q.question}\n  A: ${q.answer}\n  핵심: ${q.keyInsight || ""}`)
    .join("\n") || "없음"
}`
      )
      .join("\n\n---\n");

    const prompt = `당신은 커리어 포트폴리오 작성을 돕는 AI입니다.
지원 직무: ${targetJob}
${styleGuide}

아래 활동 자료와 인터뷰 답변만을 근거로 (추측이나 지어내기 금지) 포트폴리오 초안을 JSON 블록 배열로 작성하세요.
블록 타입: title(포트폴리오 제목), intro(자기소개), activity(활동 섹션), summary(핵심 성과 요약)

활동 자료:
${activitiesContext}

JSON 형식: { blocks: [{id, type, content, activityId?}] }`;

    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: portfolioBlockSchema,
      },
    });

    const portfolio = JSON.parse(result.response.text());
    return NextResponse.json(portfolio);
  } catch (error) {
    console.error("[/api/portfolio/generate] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate portfolio", details: String(error) },
      { status: 500 }
    );
  }
}
