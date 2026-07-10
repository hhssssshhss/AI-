// POST /api/interview/stream
// Feature 2: Gemini 스트리밍 SSE 중계 — 인터뷰 질문/피드백
import { NextRequest } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `당신은 취업 준비생의 커리어 인터뷰를 돕는 AI 코치입니다.
STAR 프레임워크(Situation-Task-Action-Result)를 기반으로 질문합니다.
질문은 반드시 한국어로 하고, 한 번에 하나의 질문만 합니다.
답변이 구체적이지 않으면 최대 2회까지 재질문합니다.
사용자가 "모르겠다" 또는 회피할 경우 유사 사례 예시를 들어 구체화를 유도합니다.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { activity, conversationHistory, category } = body;

  // conversationHistory: Array<{ role: "user"|"model", parts: [{text: string}] }>
  const systemContext = `
활동 정보:
- 제목: ${activity.title}
- 요약: ${activity.summary}
- 역할: ${activity.role}
- 키워드: ${activity.keywords?.join(", ")}

현재 질문 카테고리: ${category} (PROBLEM=문제상황, RESULT=성과, LESSON=배운점)
`;

  const model = getGeminiModel();
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT + "\n\n" + systemContext }],
      },
      {
        role: "model",
        parts: [{ text: "네, 이해했습니다. 인터뷰를 시작하겠습니다." }],
      },
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
}
