"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, usePortfolioStore } from "@/store";
import DashboardLayout from "@/components/DashboardLayout";
import RadarChart from "@/components/charts/RadarChart";
import { 
  TrendingUp, 
  Sparkles, 
  AlertCircle, 
  CheckSquare, 
  Square, 
  Loader2, 
  Users, 
  ArrowRight,
  TrendingDown
} from "lucide-react";

export default function AnalysisPage() {
  const router = useRouter();
  const { birthYear, setBirthYear } = useAuthStore();
  const { portfolio, analysisReport, setAnalysisReport } = usePortfolioStore();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [insufficientFallback, setInsufficientFallback] = useState(false);
  
  // 체크박스 상태 추적을 위한 로컬 상태
  const [checkedSuggestions, setCheckedSuggestions] = useState<Record<number, boolean>>({});
  
  // 임시 출생연도 입력 상태 (birthYear가 null일 때 사용)
  const [inputYear, setInputYear] = useState("");

  const userAge = birthYear ? 2026 - birthYear : null;

  const handleRunAnalysis = async (ageToUse: number) => {
    if (!portfolio) return;
    
    setIsAnalyzing(true);
    setErrorMsg("");
    setInsufficientFallback(false);

    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageGroup: ageToUse,
          jobFamily: portfolio.targetJob,
          portfolioBlocks: portfolio.blocks
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error === "INSUFFICIENT_SAMPLES") {
          setInsufficientFallback(true);
          return;
        }
        throw new Error("분석 실패");
      }

      const data = await res.json();
      setAnalysisReport({
        patterns: data.patterns,
        gaps: data.gaps,
        suggestions: data.suggestions
      });
      setCheckedSuggestions({});

    } catch (err) {
      console.error(err);
      setErrorMsg("또래 분석 중 알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSetYearAndAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const yearNum = Number(inputYear);
    if (!inputYear.trim() || isNaN(yearNum) || yearNum < 1900 || yearNum > 2026) {
      setErrorMsg("올바른 연도를 입력해 주세요.");
      return;
    }
    setBirthYear(yearNum);
    handleRunAnalysis(2026 - yearNum);
  };

  const handleForceAnalyzeFallback = () => {
    // 표본 부족 시 일반 평균 24세 나이를 기준으로 강제 분석 수행
    handleRunAnalysis(24);
  };

  const toggleSuggestion = (index: number) => {
    setCheckedSuggestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // 1. 포트폴리오가 없는 경우 가드
  if (!portfolio) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-dashed border-white/10 rounded-3xl text-center max-w-xl mx-auto">
          <AlertCircle className="w-12 h-12 text-slate-500 mb-4 animate-bounce" />
          <h3 className="font-bold text-lg text-slate-200">생성된 포트폴리오가 없습니다</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1 leading-relaxed">
            또래 비교 분석을 이용하려면 포트폴리오 빌더에서 AI 초안을 먼저 생성하고 수정 작업을 진행해 주세요.
          </p>
          <button
            onClick={() => router.push("/portfolio/builder")}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all"
          >
            포트폴리오 초안 만들러 가기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // 2. 출생연도가 없는 경우 가드
  if (!birthYear) {
    return (
      <DashboardLayout>
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 max-w-md mx-auto space-y-6">
          <div className="text-center">
            <Users className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">또래 연령대 비교 설정</h3>
            <p className="text-xs text-slate-400 mt-1">
              동일 연령대의 또래 평균 표본을 정확하게 매칭하기 위해 출생연도가 필요합니다.
            </p>
          </div>

          <form onSubmit={handleSetYearAndAnalyze} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                출생연도 (4자리 숫자)
              </label>
              <input
                type="text"
                value={inputYear}
                onChange={e => setInputYear(e.target.value)}
                maxLength={4}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                placeholder="예: 2001"
              />
            </div>
            {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-lg"
            >
              저장 후 또래 비교 시작하기
            </button>
          </form>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              또래 비교 분석
              <TrendingUp className="w-6 h-6 text-indigo-400" />
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              나와 같은 직무를 희망하는 또래({userAge}세) 그룹의 포트폴리오 패턴과 나의 완성도를 갭 분석해 봅니다.
            </p>
          </div>

          {!analysisReport && !isAnalyzing && (
            <button
              onClick={() => handleRunAnalysis(2026 - birthYear)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl text-sm shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <TrendingUp className="w-4 h-4" />
              갭 분석 실행하기
            </button>
          )}
        </div>

        {/* Loading */}
        {isAnalyzing && (
          <div className="p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex flex-col items-center justify-center space-y-4 text-center max-w-lg mx-auto py-16 animate-pulse">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <div>
              <p className="font-bold text-white text-base">또래 데이터 갭 분석 중...</p>
              <p className="text-xs text-indigo-200/70 mt-1 leading-relaxed">
                Gemini AI가 목업 DB에서 나와 연령이 인접한 동일 직무 또래들의 강점 패턴을 검색하고, 현재 포트폴리오와의 차이 및 점수를 매기고 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* Fallback Screen: Insufficient Samples */}
        {insufficientFallback && (
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 max-w-lg mx-auto space-y-6 text-center animate-in fade-in duration-200">
            <TrendingDown className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
            <div>
              <h3 className="text-lg font-bold text-white">또래 데이터 표본 부족</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                현재 사용자 정보(만 {userAge}세, 직무군: {portfolio.targetJob})와 완벽히 인치하는 목업 또래 데이터가 DB에 부족합니다 (최소 3건 필요).
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                나이 범위를 청년층 보편 기준인 **24세 평균 표본**으로 넓혀 AI 갭 분석을 가상 매칭해 진행하시겠습니까?
              </p>
            </div>

            <div className="flex gap-3 justify-center text-xs">
              <button
                onClick={() => setInsufficientFallback(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
              >
                설정 변경
              </button>
              <button
                onClick={handleForceAnalyzeFallback}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
              >
                24세 또래군 매칭 강제 진행
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {errorMsg && !isAnalyzing && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5" />
            {errorMsg}
          </div>
        )}

        {/* Report Output View */}
        {analysisReport && !isAnalyzing && !insufficientFallback && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Visual Gap Radar Chart */}
            <div className="lg:col-span-1 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
              <h3 className="font-bold text-sm text-white mb-4 self-start flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                역량 영역별 매칭 갭
              </h3>
              <RadarChart gaps={analysisReport.gaps} />
            </div>

            {/* Pattern summary and Action checklists */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pattern summary card */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 space-y-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
                  또래 그룹 강점 패턴 요약
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {analysisReport.patterns}
                </p>
                <p className="text-[10px] text-slate-500 leading-normal">
                  * 위 정보는 동일/유사 연령대 직무 지원자의 익명 데이터 경향을 Gemini AI가 종합 파악한 결과입니다. (개별 PII 유출 방지 조치 적용됨)
                </p>
              </div>

              {/* Suggestions checklist card */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <CheckSquare className="w-4.5 h-4.5 text-indigo-400" />
                  포트폴리오 보완 개선 제안
                </h3>
                <p className="text-xs text-slate-400">
                  또래들의 우수 포트폴리오 대비 누락되었거나 개선이 시급한 포인트들입니다. 완료 후 체크해 보세요.
                </p>

                <div className="space-y-3">
                  {analysisReport.suggestions.map((item, idx) => {
                    const isChecked = !!checkedSuggestions[idx];
                    return (
                      <div 
                        key={idx}
                        onClick={() => toggleSuggestion(idx)}
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isChecked 
                            ? "bg-slate-950/20 border-white/5 opacity-50"
                            : "bg-black/30 border-white/5 hover:border-indigo-500/20"
                        }`}
                      >
                        <button type="button" className="shrink-0 mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4.5 h-4.5 text-indigo-500" />
                          ) : (
                            <Square className="w-4.5 h-4.5 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                        <span className={`text-xs text-slate-200 leading-relaxed ${isChecked ? 'line-through text-slate-500' : ''}`}>
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Retry action */}
              <div className="text-right">
                <button
                  onClick={() => handleRunAnalysis(2026 - birthYear)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                >
                  갭 분석 재요청
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
