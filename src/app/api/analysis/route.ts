// POST /api/analysis
// Feature 4: 목업 또래 샘플셋 + 사용자 포트폴리오로 Gemini 비교 분석 실행
import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { filterPeers } from "@/mock/peer-dataset";
import { SchemaType, type Schema } from "@google/generative-ai";

const analysisSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    patterns: { type: SchemaType.STRING },
    gaps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          area: { type: SchemaType.STRING },
          score: { type: SchemaType.NUMBER },
        },
        required: ["area", "score"],
      },
    },
    suggestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["patterns", "gaps", "suggestions"],
};

export async function POST(req: NextRequest) {
  try {
    const { ageGroup, jobFamily, portfolioBlocks } = await req.json();

    if (!ageGroup || !jobFamily || !portfolioBlocks) {
      return NextResponse.json(
        { error: "ageGroup, jobFamily, portfolioBlocks are required" },
        { status: 400 }
      );
    }

    // 또래 샘플 필터링 (±2세 → 부족 시 ±4세)
    let peers = filterPeers(ageGroup, jobFamily, 2);
    const MIN_SAMPLE = 3;

    if (peers.length < MIN_SAMPLE) {
      peers = filterPeers(ageGroup, jobFamily, 4);
    }

    if (peers.length < MIN_SAMPLE) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_SAMPLES",
          message: `샘플 데이터가 부족합니다 (${peers.length}건, 최소 ${MIN_SAMPLE}건 필요)`,
          sampleCount: peers.length,
        },
        { status: 422 }
      );
    }

    const peerContext = peers
      .map(
        (p) =>
          `[또래 사례 ${p.id}] 직무: ${p.jobFamily}, 나이: ${p.ageGroup}세\n` +
          `활동: ${p.activities.map((a) => `${a.title}(${a.role})`).join(", ")}\n` +
          `주요 성과: ${p.activities.flatMap((a) => a.highlights).join(" / ")}`
      )
      .join("\n\n");

    const userContext = portfolioBlocks
      .map((b: { type: string; content: string }) => `[${b.type}] ${b.content}`)
      .join("\n");

    const prompt = `당신은 커리어 컨설턴트입니다.
아래는 ${ageGroup}세 ${jobFamily} 직무 지원자와 같은 연령대 또래들의 익명화된 포트폴리오 사례입니다.

[또래 사례 - 패턴 파악용, 원문 노출 금지]
${peerContext}

[사용자 포트폴리오]
${userContext}

위 정보를 바탕으로 다음을 분석하여 JSON으로 반환하세요:
1. patterns: 또래 그룹의 공통 강점 패턴 요약 (문자열)
2. gaps: 사용자 포트폴리오의 부족한 영역과 점수(0-100) 배열 (최소 3개 영역)
3. suggestions: 구체적인 개선 제안 목록 (최소 3개)

또래 원본 내용은 절대 그대로 노출하지 말고 패턴과 경향성만 언급하세요.`;

    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const analysis = JSON.parse(result.response.text());
    return NextResponse.json({ ...analysis, sampleCount: peers.length });
  } catch (error) {
    console.error("[/api/analysis] Error:", error);
    return NextResponse.json(
      { error: "Failed to run analysis", details: String(error) },
      { status: 500 }
    );
  }
}
