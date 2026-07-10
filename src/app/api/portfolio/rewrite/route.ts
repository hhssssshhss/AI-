// POST /api/portfolio/rewrite
// Feature 3: 블록 선택 후 AI 부분 재작성 (Rewrite)
import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export const runtime = "nodejs";

const REWRITE_PROMPTS: Record<string, string> = {
  concise: "불필요한 수식어를 줄이고 핵심 위주로 문맥을 '더 간결하게' 정리하세요.",
  highlight: "구체적인 수치, 성과 및 행동의 결과를 부각시켜 '성과 중심'으로 문장을 강조하세요.",
  keyword: "선택한 지원 직무에 맞는 실무 전문 용어와 직무 키워드를 적극 반영하여 전문적인 문체로 수정하세요.",
};

export async function POST(req: NextRequest) {
  try {
    const { blockContent, rewriteOption, targetJob } = await req.json();

    if (!blockContent || !rewriteOption || !targetJob) {
      return NextResponse.json(
        { error: "blockContent, rewriteOption, and targetJob are required" },
        { status: 400 }
      );
    }

    const optionPrompt = REWRITE_PROMPTS[rewriteOption] || "전문적이고 명확하게 글을 다듬어주세요.";

    const systemPrompt = `당신은 구직자를 위한 전문 이력서/포트폴리오 라이터입니다.
지원 직무: ${targetJob}
요구사항: ${optionPrompt}

제시된 원본 내용을 기반으로만 다듬으세요. 절대 새로운 사실을 거짓으로 지어내거나 완전히 다른 활동을 묘사해서는 안 됩니다.
답변은 오직 재작성된 본문 텍스트만 출력해야 합니다. 다른 사족이나 마크다운 코드 블록 등은 일체 포함하지 마세요.`;

    const prompt = `원본 텍스트:\n"${blockContent}"\n\n위 원본을 요구사항에 맞춰 재작성해 주세요.`;

    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\n" + prompt }] },
      ],
    });

    const rewrittenText = result.response.text().trim();

    return NextResponse.json({ content: rewrittenText });
  } catch (error) {
    console.error("[/api/portfolio/rewrite] Error:", error);
    return NextResponse.json(
      { error: "Failed to rewrite content", details: String(error) },
      { status: 500 }
    );
  }
}
