// POST /api/portfolio/ats
// 포트폴리오 초안과 채용공고 텍스트를 비교하여 ATS 매칭 점수 및 피드백을 제공합니다.
import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { SchemaType, type Schema } from "@google/generative-ai";

export const runtime = "nodejs";

const atsSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    score: { type: SchemaType.NUMBER, description: "0~100 사이의 매칭 점수" },
    missingKeywords: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "채용공고에는 있으나 포트폴리오에 누락된 핵심 키워드 목록",
    },
    feedback: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "포트폴리오 개선을 위한 구체적인 제안사항 목록",
    },
  },
  required: ["score", "missingKeywords", "feedback"],
};

export async function POST(req: NextRequest) {
  try {
    const { portfolioBlocks, jobPostingText } = await req.json();

    if (!portfolioBlocks || !jobPostingText) {
      return NextResponse.json(
        { error: "portfolioBlocks and jobPostingText are required" },
        { status: 400 }
      );
    }

    const portfolioContext = portfolioBlocks
      .map((b: { type: string; content: string }) => `[${b.type}] ${b.content}`)
      .join("\n\n");

    const prompt = `당신은 엄격한 ATS(Applicant Tracking System) 및 시니어 채용 담당자입니다.
아래의 [채용 공고]와 사용자의 [포트폴리오 초안]을 꼼꼼하게 비교 분석하여 다음 JSON 양식에 맞게 답변해 주세요.

[채용 공고]
${jobPostingText}

[포트폴리오 초안]
${portfolioContext}

평가 기준:
1. 직무 관련 핵심 역량(하드스킬) 및 키워드 매칭 여부
2. 우대사항 충족 여부
3. 성과 및 경험의 관련성

요청 사항:
- score: 0점부터 100점 사이로 ATS 통과 확률 점수를 매겨주세요.
- missingKeywords: 채용 공고에는 명시되었으나, 포트폴리오에서는 찾아볼 수 없거나 부족한 핵심 기술/역량 키워드 최대 5개를 추출해 주세요.
- feedback: 포트폴리오를 채용 공고에 더 맞게 수정하기 위한 구체적이고 실질적인 개선 피드백을 3가지 작성해 주세요.`;

    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: atsSchema,
      },
    });

    const atsResult = JSON.parse(result.response.text());
    return NextResponse.json(atsResult);
  } catch (error) {
    console.error("[/api/portfolio/ats] Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze ATS fit", details: String(error) },
      { status: 500 }
    );
  }
}
