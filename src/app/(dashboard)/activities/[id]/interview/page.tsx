"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useActivitiesStore, QaItem } from "@/store";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Send, 
  HelpCircle, 
  ChevronRight, 
  ArrowLeft, 
  MessageSquare,
  Award,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

export default function InterviewPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getActivity, updateActivity } = useActivitiesStore();

  const activity = getActivity(id);

  // 대화 메시지 상태
  // { sender: "ai" | "user", text: string, category?: string }
  const [messages, setMessages] = useState<{ sender: "ai" | "user"; text: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [streamedText, setStreamedText] = useState("");

  // 인터뷰 진행 상태
  const [currentCategory, setCurrentCategory] = useState<"PROBLEM" | "RESULT" | "LESSON">("PROBLEM");
  const [questionCount, setQuestionCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // 인터뷰 시작 시 초기 세팅
  useEffect(() => {
    if (!activity) {
      router.push("/activities");
      return;
    }

    // 인터뷰 초기화 또는 기존 데이터 로드
    const existingInterview = activity.interview;
    if (existingInterview && existingInterview.status === "COMPLETED") {
      setIsFinished(true);
      // 기존 메시지들 표시
      const msgs: { sender: "ai" | "user"; text: string }[] = [];
      existingInterview.qaItems.forEach(item => {
        msgs.push({ sender: "ai", text: item.question });
        if (item.answer) {
          msgs.push({ sender: "user", text: item.answer });
        }
      });
      setMessages(msgs);
    } else {
      // 신규 인터뷰 시작
      startInterview();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, router]);

  // 대화가 늘어날 때 자동 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedText, isAiTyping]);

  if (!activity) return null;

  // AI 스트리밍 질문 요청 공통 함수
  const fetchAiQuestion = async (
    userAns: string,
    history: { role: "user" | "model"; parts: { text: string }[] }[],
    category: "PROBLEM" | "RESULT" | "LESSON"
  ) => {
    setIsAiTyping(true);
    setStreamedText("");
    setErrorMsg("");

    try {
      const response = await fetch("/api/interview/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity: {
            title: activity.title,
            summary: activity.summary,
            role: activity.role,
            keywords: activity.keywords
          },
          conversationHistory: history,
          category,
          userMessage: userAns
        })
      });

      if (!response.ok) {
        throw new Error("질문을 받아오는 데 실패했습니다.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              if (dataStr === "[DONE]") break;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setStreamedText(accumulatedText);
                }
              } catch {
                // 파싱 무시
              }
            }
          }
        }
      }

      // 최종 받아온 질문 추가
      setMessages(prev => [...prev, { sender: "ai", text: accumulatedText }]);
      setStreamedText("");
      setQuestionCount(prev => prev + 1);

    } catch (err) {
      console.error(err);
      setErrorMsg("AI 연결 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsAiTyping(false);
    }
  };

  const startInterview = async () => {
    // 첫 메시지 요청
    const initialHistory: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    await fetchAiQuestion("인터뷰를 시작해 주세요.", initialHistory, "PROBLEM");
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isAiTyping) return;

    const userText = inputValue;
    setInputValue("");
    setMessages(prev => [...prev, { sender: "user", text: userText }]);

    // 이전 대화 내역 포맷팅
    // Gemini history format: [{ role: "user"|"model", parts: [{text: string}] }]
    const history: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    messages.forEach((msg) => {
      history.push({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      });
    });

    // 카테고리 전환 설계 (2문항마다 카테고리 변경)
    // 0~1 문항: PROBLEM -> 2문항 완료 시 RESULT 전환
    // 2~3 문항: RESULT -> 4문항 완료 시 LESSON 전환
    // 4~5 문항: LESSON -> 6문항 완료 시 인터뷰 완수
    let nextCategory = currentCategory;
    const nextQuestionCount = questionCount;

    if (nextQuestionCount === 2 && currentCategory === "PROBLEM") {
      nextCategory = "RESULT";
      setCurrentCategory("RESULT");
    } else if (nextQuestionCount === 4 && currentCategory === "RESULT") {
      nextCategory = "LESSON";
      setCurrentCategory("LESSON");
    } else if (nextQuestionCount >= 6) {
      // 인터뷰 완료 처리
      finishInterview(userText);
      return;
    }

    await fetchAiQuestion(userText, history, nextCategory);
  };

  const handleHelpSuggestion = async () => {
    if (isAiTyping) return;
    setInputValue("어떻게 답변해야 할지 모르겠어요. 힌트나 예시를 주실 수 있나요?");
  };

  const finishInterview = (lastAnswer: string) => {
    setIsFinished(true);

    // Q&A 데이터 구조 구성
    const qaItems: QaItem[] = [];
    let currentQa: Partial<QaItem> = {};

    // 대화 메시지 목록을 짝지어 QaItem으로 저장
    const allMsgs = [...messages, { sender: "user" as const, text: lastAnswer }];
    let order = 1;

    for (let i = 0; i < allMsgs.length; i++) {
      const msg = allMsgs[i];
      if (msg.sender === "ai") {
        currentQa = {
          id: `qa_${id}_${order}`,
          question: msg.text,
          order: order,
          category: order <= 2 ? "PROBLEM" : order <= 4 ? "RESULT" : "LESSON"
        };
      } else if (msg.sender === "user" && currentQa.question) {
        currentQa.answer = msg.text;
        // 핵심 한 줄 요약은 데모 목적상 AI가 첫 20자 정도로 요약하거나 간단히 치환
        currentQa.keyInsight = msg.text.length > 30 ? msg.text.slice(0, 30) + "..." : msg.text;
        qaItems.push(currentQa as QaItem);
        order++;
        currentQa = {};
      }
    }

    // Zustand 스토어 업데이트
    updateActivity(id, {
      interview: {
        id: `int_${id}`,
        activityId: id,
        status: "COMPLETED",
        qaItems
      }
    });
  };

  const restartInterview = () => {
    // 인터뷰 초기화 후 재시작
    setMessages([]);
    setCurrentCategory("PROBLEM");
    setQuestionCount(0);
    setIsFinished(false);
    updateActivity(id, { interview: null });
    // 잠시 후 첫 질문 로드
    setTimeout(() => {
      startInterview();
    }, 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)]">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/activities")}
              className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {activity.title}
                <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                  AI 코칭 인터뷰
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">역할: {activity.role || "무작위"}</p>
            </div>
          </div>

          {!isFinished && (
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
              <span className={`flex items-center gap-1.5 ${currentCategory === 'PROBLEM' ? 'text-indigo-400' : ''}`}>
                <MessageSquare className="w-3.5 h-3.5" />
                문제극복
              </span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className={`flex items-center gap-1.5 ${currentCategory === 'RESULT' ? 'text-indigo-400' : ''}`}>
                <Award className="w-3.5 h-3.5" />
                성과도출
              </span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className={`flex items-center gap-1.5 ${currentCategory === 'LESSON' ? 'text-indigo-400' : ''}`}>
                <BookOpen className="w-3.5 h-3.5" />
                배운점
              </span>
            </div>
          )}
        </div>

        {/* Chat window */}
        <div className="flex-1 bg-slate-900/40 border border-white/5 rounded-2xl p-6 overflow-y-auto space-y-4 min-h-0 custom-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
                    : "bg-white/5 border border-white/10 text-slate-100 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* SSE Streamed Message */}
          {streamedText && (
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-2xl px-4 py-3 text-sm bg-white/5 border border-white/10 text-slate-100 rounded-tl-none leading-relaxed">
                {streamedText}
                <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-400 animate-pulse"></span>
              </div>
            </div>
          )}

          {/* AI Typing Indicator */}
          {isAiTyping && !streamedText && (
            <div className="flex justify-start items-center gap-2 text-slate-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              AI 코치가 질문을 작성하고 있습니다...
            </div>
          )}

          {/* Error Indicator */}
          {errorMsg && (
            <div className="flex justify-center p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Finish UI Screen */}
          {isFinished && (
            <div className="py-10 text-center max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="inline-flex p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">활동 인터뷰가 완료되었습니다!</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  작성해주신 상세 답변들을 기반으로 AI 포트폴리오 빌더에서 직무 맞춤형 초안을 생성할 수 있습니다.
                </p>
              </div>

              <div className="flex gap-3 justify-center text-xs">
                <button
                  onClick={restartInterview}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all"
                >
                  인터뷰 다시하기
                </button>
                <button
                  onClick={() => router.push("/portfolio/builder")}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
                >
                  포트폴리오 제작하러 가기
                </button>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        {!isFinished && (
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isAiTyping}
                onClick={handleHelpSuggestion}
                className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shrink-0 disabled:opacity-50"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                답변 가이드
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isAiTyping}
                  placeholder={
                    isAiTyping ? "AI 코치의 질문을 기다리는 중..." : "답변을 구체적으로 적어보세요..."
                  }
                  className="w-full bg-slate-900 border border-white/5 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isAiTyping || !inputValue.trim()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              대화 내용은 브라우저 상태에 임시 저장되며, 새로고침 시 소실될 수 있으니 완료 버튼을 눌러 저장하세요.
            </p>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
