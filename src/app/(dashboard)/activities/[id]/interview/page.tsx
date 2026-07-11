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
  RefreshCw,
  TrendingUp
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
      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto h-[calc(100vh-100px)]">
        
        {/* Main Chat Column */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Info Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">면접 유형</p>
                <h3 className="font-bold text-slate-800 text-base">활동 인사이트 추출</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">진행 시간</p>
                <h3 className="font-bold text-slate-800 text-base">15:00 / 30:00</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden relative">
            
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0055d4] flex items-center justify-center text-white font-bold shrink-0">
                  AI
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Career AI</h3>
                  <p className="text-xs text-slate-500">활동 인사이트 추출</p>
                </div>
              </div>
              <button 
                onClick={() => finishInterview("인터뷰 강제 종료")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                대화 완료 및 저장
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white ${msg.sender === "user" ? "bg-blue-400" : "bg-[#0055d4]"}`}>
                    {msg.sender === "user" ? "U" : "AI"}
                  </div>
                  <div className={`max-w-[75%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-[#0055d4] text-white rounded-tr-none shadow-sm" 
                      : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {streamedText && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0055d4] shrink-0 flex items-center justify-center text-xs font-bold text-white">AI</div>
                  <div className="max-w-[75%] px-5 py-3.5 rounded-2xl text-sm bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none leading-relaxed">
                    {streamedText}
                    <span className="inline-block w-1.5 h-4 ml-1 bg-blue-500 animate-pulse"></span>
                  </div>
                </div>
              )}

              {isAiTyping && !streamedText && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0055d4] shrink-0 flex items-center justify-center text-xs font-bold text-white">AI</div>
                  <div className="px-5 py-3.5 rounded-2xl text-sm bg-slate-100 border border-slate-200 text-slate-500 rounded-tl-none flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    입력 중...
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="relative">
                <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isAiTyping || isFinished}
                  placeholder="답변을 입력하거나 마이크를 사용하세요..."
                  className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-14 py-3.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                />
                <button
                  type="submit"
                  disabled={isAiTyping || isFinished || !inputValue.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#0055d4] hover:bg-blue-700 disabled:bg-slate-300 rounded-lg flex items-center justify-center text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
            
            {/* Finished Overlay */}
            {isFinished && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">활동 인터뷰 완료!</h3>
                <p className="text-slate-500 mb-6 max-w-xs">
                  작성해주신 상세 답변들을 기반으로 AI 포트폴리오 초안이 성공적으로 생성되었습니다.
                </p>
                <div className="flex gap-3">
                  <button onClick={restartInterview} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50">다시하기</button>
                  <button onClick={() => router.push("/portfolio/builder")} className="px-5 py-2.5 bg-[#0055d4] text-white font-bold rounded-lg hover:bg-blue-700 shadow-md">포트폴리오 제작하기</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel Column */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
          
          {/* Summary Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              추출된 인사이트 요약
            </h3>
            <div className="mb-4">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>인사이트 추출 진행도</span>
                <span className="text-blue-600">45%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#0055d4] rounded-full" style={{ width: "45%" }}></div>
              </div>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-xs text-slate-700">
                <div className="w-1 h-1 rounded-full bg-slate-800 mt-1.5 shrink-0"></div>
                작업 완료 시간 30% 단축 성과 도출
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-700">
                <div className="w-1 h-1 rounded-full bg-slate-800 mt-1.5 shrink-0"></div>
                B2B 대시보드 리뉴얼 경험
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-700">
                <div className="w-1 h-1 rounded-full bg-slate-800 mt-1.5 shrink-0"></div>
                사용자 리서치 기반 문제 해결
              </li>
            </ul>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-1">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              AI 인사이트
            </h3>
            
            <div className="space-y-3">
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <h4 className="font-bold text-xs text-indigo-900 mb-1">STAR 기법 가이드</h4>
                <p className="text-[11px] text-indigo-800/80 leading-relaxed">
                  어떤 상황(Situation)에서 리서치를 기획했고, 주어진 과제(Task)는 무엇이었는지 덧붙여 설명해 보세요.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <h4 className="font-bold text-xs text-slate-800 mb-1">성과 표현 팁</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  수치화된 성과(30% 단축)를 언급한 점이 아주 좋습니다. 구체적인 데이터를 계속 활용하세요.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  리서치에서 사용한 특정 방법론(예: 심층 인터뷰, 사용성 테스트)을 언급하면 신뢰도를 높일 수 있습니다.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
