"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActivitiesStore, usePortfolioStore } from "@/store";
import DashboardLayout from "@/components/DashboardLayout";
import BlockEditor from "@/components/editor/BlockEditor";
import { 
  Sparkles, 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  History, 
  Save, 
  Undo,
  ExternalLink,
  CheckCircle2,
  FileCheck,
  Link2,
  FileText
} from "lucide-react";

export default function PortfolioBuilderPage() {
  const router = useRouter();
  const { activities } = useActivitiesStore();
  const { 
    portfolio, 
    setPortfolio, 
    updateBlocks, 
    saveSnapshot, 
    restoreSnapshot 
  } = usePortfolioStore();

  const [targetJob, setTargetJob] = useState("dev");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 채용공고 크롤링 및 맞춤형 텍스트 상태
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlError, setCrawlError] = useState("");
  const [crawlSuccess, setCrawlSuccess] = useState(false);

  // 로드 체크 및 인터뷰 완료 활동 필터링
  const completedActivities = activities.filter(
    (a) => a.status === "READY" && a.interview?.status === "COMPLETED"
  );
  const uncompletedActivities = activities.filter(
    (a) => a.status === "READY" && (!a.interview || a.interview.status !== "COMPLETED")
  );

  const handleCrawlJobPosting = async () => {
    if (!jobUrl) {
      setCrawlError("채용공고 URL을 입력해 주세요.");
      return;
    }

    setIsCrawling(true);
    setCrawlError("");
    setCrawlSuccess(false);

    try {
      const res = await fetch("/api/portfolio/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "채용공고 분석에 실패했습니다.");
      }

      setJobDescription(data.text);
      setCrawlSuccess(true);
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "채용공고를 가져오지 못했습니다. 본문을 직접 복사해서 아래 입력해 주세요.";
      setCrawlError(errMsg);
    } finally {
      setIsCrawling(false);
    }
  };

  const handleGeneratePortfolio = async () => {
    if (completedActivities.length === 0) {
      setErrorMsg("인터뷰를 완료한 활동이 최소 1개 이상 필요합니다.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/portfolio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activities: completedActivities,
          targetJob,
          jobPostingText: jobDescription
        })
      });

      if (!res.ok) throw new Error("포트폴리오 생성 실패");

      const data = await res.json();
      
      // Zustand 포트폴리오 세팅
      setPortfolio({
        id: `port_${Math.random().toString(36).substring(2, 9)}`,
        targetJob,
        blocks: data.blocks || [],
        version: 1,
        snapshots: []
      });

    } catch (err) {
      console.error(err);
      setErrorMsg("포트폴리오 초안 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveVersion = () => {
    if (!portfolio) return;
    saveSnapshot();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleRestoreVersion = (idx: number) => {
    restoreSnapshot(idx);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            포트폴리오 생성
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            내 활동 기록을 바탕으로 맞춤형 포트폴리오를 만들어보세요.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">오류 발생</p>
              <p className="text-xs text-red-400/80 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Uncompleted Interview Banner Warn */}
        {uncompletedActivities.length > 0 && (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start justify-between gap-3 text-amber-400">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-white">인터뷰 미완료 활동 카드가 존재합니다 ({uncompletedActivities.length}건)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  이 프로젝트들은 답변이 완성되지 않아 포트폴리오 초안 생성에서 제외됩니다.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/activities")}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline shrink-0 flex items-center gap-1.5"
            >
              인터뷰 하러가기
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Portfolio Draft Area */}
        {!portfolio ? (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-2">
              <button className="text-sm font-bold text-blue-600 border-b-2 border-blue-600 pb-2 -mb-[9px] px-1">전체 포트폴리오</button>
              <button className="text-sm font-semibold text-slate-500 hover:text-slate-800 pb-2 px-1 transition-colors">최근 1년</button>
              <button className="text-sm font-semibold text-slate-500 hover:text-slate-800 pb-2 px-1 transition-colors">직무 맞춤형</button>
              <button className="text-sm font-semibold text-blue-500 hover:text-blue-600 pb-2 px-1 transition-colors">+ 커스텀 조건</button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Side: Empty State */}
              <div className="flex-1">
                <div 
                  onClick={() => document.getElementById('job_input')?.focus()}
                  className="bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-3xl p-10 flex flex-col items-center justify-center min-h-[300px] cursor-pointer transition-all hover:bg-blue-50/50"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-extrabold text-xl text-slate-800 mb-2">아직 생성된 포트폴리오가 없습니다</h3>
                  <p className="text-sm text-slate-500 max-w-sm text-center leading-relaxed">
                    오른쪽 패널에서 희망 직무를 설정하고 '포트폴리오 생성' 버튼을 눌러 나만의 맞춤형 포트폴리오를 만들어보세요.
                  </p>
                </div>
              </div>

              {/* Right Side: Quick Config */}
              <div className="w-full lg:w-80 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">빠른 생성 설정</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">희망 직무</label>
                    <input 
                      id="job_input"
                      type="text" 
                      value={targetJob}
                      onChange={(e) => setTargetJob(e.target.value)}
                      placeholder="예: 프론트엔드 개발자" 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex justify-between items-center">
                      지원 기업 공고 URL
                      <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">선택</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="url" 
                          value={jobUrl}
                          onChange={(e) => setJobUrl(e.target.value)}
                          placeholder="채용공고 URL 입력" 
                          className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <button 
                        onClick={handleCrawlJobPosting}
                        disabled={isCrawling || !jobUrl}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 disabled:text-slate-400 font-semibold text-xs rounded-lg transition-colors shrink-0 flex items-center justify-center"
                      >
                        {isCrawling ? <Loader2 className="w-4 h-4 animate-spin" /> : "공고 분석"}
                      </button>
                    </div>
                    {crawlError && <p className="text-[10px] text-red-500 mt-1">{crawlError}</p>}
                    {crawlSuccess && <p className="text-[10px] text-emerald-500 mt-1">공고 파싱 완료!</p>}
                    
                    {/* Hidden job description textarea, keep state active but hide it in this view to save space, or show a small preview */}
                    {jobDescription && (
                      <textarea
                        rows={2}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] text-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex justify-between items-center">
                      포함할 핵심 역량
                      <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">선택</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="React, Next.js, UI/UX" 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">포트폴리오 테마</label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                      <option>모던 (Modern)</option>
                      <option>클래식 (Classic)</option>
                      <option>크리에이티브 (Creative)</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleGeneratePortfolio}
                  disabled={isGenerating || completedActivities.length === 0}
                  className="w-full mt-6 py-3 bg-[#0055d4] hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> 생성 중...</>
                  ) : (
                    <><span className="text-lg leading-none mb-0.5">+</span> 새 포트폴리오 만들기</>
                  )}
                </button>
                {completedActivities.length === 0 && (
                  <p className="text-[10px] text-red-500 text-center mt-2">
                    완료된 AI 인터뷰가 최소 1개 이상 필요합니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Editor Workstation View */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Editor Sidebar: History / Actions */}
            <div className="space-y-6 lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <History className="w-4.5 h-4.5 text-blue-600" />
                  버전 스냅샷
                </h3>

                <div className="space-y-3">
                  <button
                    onClick={handleSaveVersion}
                    className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                        스냅샷 저장 완료
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        현재 버전 저장
                      </>
                    )}
                  </button>

                  <div className="border-t border-slate-100 my-3 pt-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      저장된 이력 ({portfolio.snapshots.length}개)
                    </p>
                    
                    {portfolio.snapshots.length === 0 ? (
                      <p className="text-[10px] text-slate-400">저장된 버전 스냅샷이 없습니다.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {portfolio.snapshots.map((snap, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleRestoreVersion(sIdx)}
                            className="w-full text-left p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 flex items-center justify-between text-xs text-slate-700 transition-all group"
                          >
                            <span>버전 스냅샷 #{sIdx + 1}</span>
                            <Undo className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <FileCheck className="w-4.5 h-4.5 text-blue-600" />
                  비교 및 내보내기
                </h3>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  초안 작성을 완료하셨다면 다음 또래 비교 탭에서 완성도 갭 리포트를 분석해 보세요.
                </p>
                <button
                  onClick={() => router.push("/portfolio/analysis")}
                  className="w-full py-2.5 px-3 bg-[#0055d4] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  또래와 비교 분석하기
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  if (confirm("새로운 포트폴리오 초안을 다시 생성하시겠습니까? 현재 에디터 내용은 스냅샷에 저장하지 않았다면 유실됩니다.")) {
                    setPortfolio(null);
                  }
                }}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition-colors"
              >
                초안 다시 만들기
              </button>
            </div>

            {/* Block Editor workstation */}
            <div className="lg:col-span-3">
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    포트폴리오 워크스테이션
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-100 rounded-full font-medium">
                      {targetJob} 직무
                    </span>
                  </h2>
                </div>

                <BlockEditor 
                  blocks={portfolio.blocks}
                  targetJob={portfolio.targetJob}
                  onUpdateBlocks={updateBlocks}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
