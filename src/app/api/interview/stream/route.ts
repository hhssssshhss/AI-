// POST /api/interview/stream
// Feature 2: Gemini 스트리밍 SSE 중계 — 인터뷰 질문/피드백
import { NextRequest } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export const runtime = "nodejs";

const BASE_SYSTEM_PROMPT = `당신은 취업 준비생의 매력적인 포트폴리오 작성을 돕는 친절하고 전문적인 '포트폴리오 에디터'입니다.
사용자가 훌륭한 경험을 가지고 있음에도 어떻게 표현할지 막막해하고 있습니다.
면접관처럼 딱딱하게 묻지 말고, 친한 선배가 스토리를 들어주듯 부드럽게 대화하세요.
포트폴리오에 필요한 다음 5가지 요소를 하나씩 유도하는 질문을 던지세요:
1. 활동의 구체적인 내용 및 배경
2. 팀 내에서 본인이 맡은 핵심 역할
3. 과정에서 겪었던 가장 큰 어려움과 해결 방법
4. 이 활동을 통해 새롭게 깨닫거나 배운 점
5. 이 경험을 향후 직무에 어떻게 적용/발전시킬 것인지

단, 한 번에 하나씩만 묻고, 사용자가 답변을 어려워하면 '예를 들어, ~한 문제가 있었나요?'처럼 선택지나 예시를 제시해 주세요.`;

const DEEP_DIVE_PROMPT = `당신은 포트폴리오의 성과를 극대화하는 '스토리텔링 디렉터'입니다.
사용자의 이전 답변에서 가장 돋보이는 역량(문제 해결력, 기술력, 리더십 등)을 포착하여 칭찬해 주세요.
그리고 그 부분을 포트폴리오의 '핵심 하이라이트'로 쓸 수 있도록, 구체적인 수치(몇 % 개선, 몇 명과 협업 등)나 본인만의 특별한 고민 흔적을 묻는 꼬리 질문을 딱 1개만 던지세요.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { activity, conversationHistory, category } = body;

    // conversationHistory: Array<{ role: "user"|"model", parts: [{text: string}] }>
    const systemContext = `
활동 정보:
- 제목: ${activity.title}
- 요약: ${activity.summary}
- 역할: ${activity.role}
- 키워드: ${activity.keywords?.join(", ")}

현재 질문 카테고리: ${category} (PROBLEM=문제상황, RESULT=성과, LESSON=배운점, DEEP_DIVE=압박 꼬리질문)
`;

    const activeSystemPrompt = category === "DEEP_DIVE" ? DEEP_DIVE_PROMPT : BASE_SYSTEM_PROMPT;

    const model = getGeminiModel();
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: activeSystemPrompt + "\n\n" + systemContext }],
        },
        {
          role: "model",
          parts: [{ text: "네, 이해했습니다. 인터뷰를 시작하겠습니다." }],
        },
        ...(conversationHistory?.length > 0 ? [{ role: "user" as const, parts: [{ text: "인터뷰를 시작해 주세요." }] }] : []),
        ...(conversationHistory || []),
      ],
    });

    const lastUserMessage =
      body.userMessage || "인터뷰를 시작해주세요.";

    const stream = await chat.sendMessageStream(lastUserMessage);

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: String(err) })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[/api/interview/stream] Error:", error);
    // NextResponse는 json() 메서드를 사용하여 오류를 반환합니다.
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
