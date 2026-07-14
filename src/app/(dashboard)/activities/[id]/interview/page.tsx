"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useActivitiesStore, usePortfolioStore, useAuthStore, QaItem } from "@/store";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Send, 
  HelpCircle, 
  BookOpen,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Mic,
  MicOff
} from "lucide-react";
import { saveInterviewToDB } from "@/app/actions/activities";

export default function InterviewPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getActivity, updateActivity } = useActivitiesStore();
  const { portfoliosByUser, addPage } = usePortfolioStore();
  const { userId, birthYear } = useAuthStore();
  
  const userKey = `${userId}_${birthYear || 'unknown'}`;
  const portfolio = portfoliosByUser[userKey] || null;

  const activity = getActivity(id);
  const hasPortfolioPage = portfolio?.pages?.some(p => p.activityId === id) || false;

  // 대화 메시지 상태
  // { sender: "ai" | "user", text: string, category?: string }
  const [messages, setMessages] = useState<{ sender: "ai" | "user"; text: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [streamedText, setStreamedText] = useState("");

  // 인터뷰 진행 상태
  const [currentCategory, setCurrentCategory] = useState<"PROBLEM" | "RESULT" | "DEEP_DIVE" | "LESSON">("PROBLEM");
  const [questionCount, setQuestionCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 동적 타이머 상태 및 로직
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (isFinished || !isMounted) return;
    
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isFinished, isMounted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // 음성 인식 관련
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // 음성 인식 초기화
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "ko-KR";
        
        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setInputValue((prev) => prev + (prev ? " " : "") + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (!inputValue) setInputValue("");
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };


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
    category: "PROBLEM" | "RESULT" | "DEEP_DIVE" | "LESSON"
  ) => {
    setIsAiTyping(true);
    setStreamedText("");

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
        // 백엔드에서 반환한 JSON 에러 메시지를 시도해서 파싱
        const errData = await response.json().catch(() => null);
        if (errData && errData.error) {
          throw new Error(errData.error);
        }
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
      // speakText(accumulatedText); // 사용자 요청으로 AI 음성 출력 비활성화
      setStreamedText("");
      setQuestionCount(prev => prev + 1);

    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || "";
      if (errMsg.includes("429") || errMsg.includes("Quota") || errMsg.includes("Too Many Requests")) {
        alert("구글 API 호출 한도를 초과했습니다. 잠시 후(약 1분 뒤) 다시 시도해 주세요.");
      } else if (errMsg.includes("Safety") || errMsg.includes("safety") || errMsg.includes("blocked")) {
        alert("안전 필터에 의해 답변이 차단되었습니다. 표현을 순화하여 다시 시도해 주세요.");
      } else {
        alert(`AI 연결 오류가 발생했습니다: ${errMsg}`);
      }
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

    // 카테고리 전환 설계 (2문항마다 카테고리 변경 + DEEP_DIVE)
    // 0~1 문항: PROBLEM -> 2문항 완료 시 RESULT 전환
    // 2~3 문항: RESULT -> 4문항 완료 시 DEEP_DIVE 전환 (압박 꼬리질문)
    // 4문항: DEEP_DIVE -> 5문항 완료 시 LESSON 전환
    // 5문항: LESSON -> 6문항 완료 시 인터뷰 완수
    let nextCategory = currentCategory;
    const nextQuestionCount = questionCount;

    if (nextQuestionCount === 2 && currentCategory === "PROBLEM") {
      nextCategory = "RESULT";
      setCurrentCategory("RESULT");
    } else if (nextQuestionCount === 4 && currentCategory === "RESULT") {
      nextCategory = "DEEP_DIVE";
      setCurrentCategory("DEEP_DIVE");
    } else if (nextQuestionCount === 5 && currentCategory === "DEEP_DIVE") {
      nextCategory = "LESSON";
      setCurrentCategory("LESSON");
    } else if (nextQuestionCount >= 6) {
      // 인터뷰 완료 처리
      finishInterview(userText);
      return;
    }

    await fetchAiQuestion(userText, history, nextCategory);
  };


  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const generatePortfolio = async (qaItems: QaItem[]) => {
    if (!activity) return;
    setIsGenerating(true);
    setGenerationError(false);
    setErrorMsg("");
    try {
      const res = await fetch("/api/portfolio/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityTitle: activity.title,
          activitySummary: activity.summary,
          activityRole: activity.role,
          activityKeywords: activity.keywords,
          qaItems
        })
      });

      if (res.ok) {
        const { content } = await res.json();
        addPage(userKey, {
          id: `page_${Date.now()}`,
          activityId: id,
          activityTitle: activity.title,
          period: activity.periodStart ? `${new Date(activity.periodStart).toLocaleDateString()} ~ ${activity.periodEnd ? new Date(activity.periodEnd).toLocaleDateString() : '진행중'}` : '진행 기간 없음',
          content
        });
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "알 수 없는 에러가 발생했습니다.");
      }
    } catch (err: any) {
      console.error("포트폴리오 자동 생성 실패:", err);
      setGenerationError(true);
      setErrorMsg(err.message || "서버 통신 중 에러가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const finishInterview = async (lastAnswer: string) => {
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
          category: order <= 2 ? "PROBLEM" : order <= 4 ? "RESULT" : order === 5 ? "DEEP_DIVE" : "LESSON"
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

    // 서버 DB에 동기화 (로컬 모드인 경우 내부에서 무시됨)
    try {
      await saveInterviewToDB(id, qaItems);
    } catch (err) {
      console.error("DB 저장 실패:", err);
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

    // 🚀 인터뷰 완료 즉시 포트폴리오 텍스트 자동 생성 트리거 (아직 포트폴리오가 없을 때만)
    if (!hasPortfolioPage) {
      generatePortfolio(qaItems);
    }
  };

  const restartInterview = () => {
    // 인터뷰 초기화 후 재시작
    setMessages([]);
    setCurrentCategory("PROBLEM");
    setQuestionCount(0);
    setIsFinished(false);
    setElapsedSeconds(0); // 타이머 초기화
    updateActivity(id, { interview: null });
    // 잠시 후 첫 질문 로드
    setTimeout(() => {
      startInterview();
    }, 100);
  };

  const userAnswersCount = messages.filter((m) => m.sender === "user").length;
  const progressPercent = Math.min(100, Math.round((userAnswersCount / 6) * 100));

  if (!isMounted) return null;

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
                <h3 className="font-bold text-slate-800 text-base">{formatTime(elapsedSeconds)} / 30:00</h3>
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
              <form onSubmit={handleSendMessage} className="relative flex gap-2">
                <button 
                  type="button" 
                  onClick={toggleRecording}
                  className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm border ${
                    isRecording 
                      ? "bg-red-50 text-red-500 border-red-200 animate-pulse" 
                      : "bg-slate-50 text-slate-500 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 border-slate-200"
                  }`}
                  title="음성 인식 토글"
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isAiTyping || isFinished}
                    placeholder="답변을 입력하거나 마이크를 사용하여 말씀하세요..."
                    className="w-full h-12 bg-white border border-slate-300 rounded-xl px-4 pr-14 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={isAiTyping || isFinished || (!inputValue.trim() && !isRecording)}
                    className="absolute right-1 top-1 w-10 h-10 bg-[#0055d4] hover:bg-blue-700 disabled:bg-slate-300 rounded-lg flex items-center justify-center text-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            
            {/* Finished Overlay */}
            {isFinished && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                {isGenerating ? (
                  <>
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">포트폴리오 생성 중...</h3>
                    <p className="text-slate-500 mb-6 max-w-xs">
                      AI가 인터뷰 내용을 바탕으로 포트폴리오를 멋지게 작성하고 있습니다. 잠시만 기다려주세요!
                    </p>
                  </>
                ) : generationError ? (
                  <>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-red-500"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">생성에 실패했습니다</h3>
                    <p className="text-slate-500 mb-6 max-w-sm text-sm">
                      {errorMsg || "서버 지연 등의 문제로 포트폴리오 초안 생성이 완료되지 못했습니다. 다시 시도해주세요."}
                    </p>
                    <div className="flex gap-3">
                      <button onClick={restartInterview} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50">인터뷰 다시하기</button>
                      <button onClick={() => activity?.interview && generatePortfolio(activity.interview.qaItems)} className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 shadow-md">다시 생성 시도</button>
                    </div>
                  </>
                ) : !hasPortfolioPage ? (
                  <>
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">포트폴리오가 아직 없습니다</h3>
                    <p className="text-slate-500 mb-6 max-w-xs">
                      인터뷰는 완료되었지만 포트폴리오 초안이 생성되지 않았습니다. 버튼을 눌러 초안을 생성해주세요.
                    </p>
                    <div className="flex gap-3">
                      <button onClick={restartInterview} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50">다시하기</button>
                      <button onClick={() => activity?.interview && generatePortfolio(activity.interview.qaItems)} className="px-5 py-2.5 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 shadow-md">✨ 포트폴리오 초안 생성하기</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">포트폴리오 자동 생성 완료!</h3>
                    <p className="text-slate-500 mb-6 max-w-xs">
                      작성해주신 상세 답변들을 기반으로 AI 포트폴리오 초안이 성공적으로 생성되었습니다.
                    </p>
                    <div className="flex gap-3">
                      <button onClick={restartInterview} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50">다시하기</button>
                      <button onClick={() => router.push("/portfolio")} className="px-5 py-2.5 bg-[#0055d4] text-white font-bold rounded-lg hover:bg-blue-700 shadow-md">✨ 자동 완성된 포트폴리오 보러가기</button>
                    </div>
                  </>
                )}
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
                <span className="text-blue-600">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#0055d4] rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
            
            {userAnswersCount === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-lg">아직 추출된 인사이트가 없습니다.<br/>답변을 시작해 주세요.</p>
            ) : (
              <ul className="space-y-3 mt-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {messages.filter(m => m.sender === "user").map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <div className="w-1 h-1 rounded-full bg-slate-800 mt-1.5 shrink-0"></div>
                    {m.text.length > 30 ? m.text.slice(0, 30) + "..." : m.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* AI Insights Panel */}
          {userAnswersCount > 0 ? (
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
                    수치화된 성과나 구체적인 지표가 있다면 이를 언급하여 답변의 신뢰도를 높여 보세요.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    본인이 사용한 특정 방법론이나 문제 해결 과정을 구체적으로 언급하면 더욱 좋은 포트폴리오 소스가 됩니다.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-1 flex flex-col items-center justify-center text-center opacity-80">
              <HelpCircle className="w-8 h-8 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-600 mb-1">AI 인사이트 대기 중</h3>
              <p className="text-xs text-slate-400">첫 번째 질문에 답변을 남기시면 맞춤형 팁이 생성됩니다.</p>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
