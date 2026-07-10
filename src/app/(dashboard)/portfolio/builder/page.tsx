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
  FileCheck
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

  // 로드 체크 및 인터뷰 완료 활동 필터링
  const completedActivities = activities.filter(
    (a) => a.status === "READY" && a.interview?.status === "COMPLETED"
  );
  const uncompletedActivities = activities.filter(
    (a) => a.status === "READY" && (!a.interview || a.interview.status !== "COMPLETED")
  );

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
          targetJob
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
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            포트폴리오 빌더
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            활동 이력과 인터뷰 성과를 엮어 원하는 직무 스타일에 맞는 최적의 포트폴리오를 만들어보세요.
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
          /* Initial Configuration View */
          <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 max-w-2xl mx-auto space-y-6">
            <h3 className="text-lg font-bold text-white">포트폴리오 생성 설정</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                  지원 직무 선택
                </label>
                <select
                  value={targetJob}
                  onChange={(e) => setTargetJob(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="dev">개발자 (Software Engineer)</option>
                  <option value="marketing">마케터 (Marketer)</option>
                  <option value="data">데이터 분석가 (Data Analyst)</option>
                  <option value="planning">서비스 기획자 (Product Manager)</option>
                  <option value="design">디자이너 (UX/UI Designer)</option>
                </select>
              </div>

              <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">인터뷰 완료 활동:</span>
                  <span className="font-bold text-white">{completedActivities.length}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">사용 가능 파일 수:</span>
                  <span className="font-bold text-white">
                    {completedActivities.reduce((sum, a) => sum + (a.files?.length || 0), 0)}개
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleGeneratePortfolio}
              disabled={isGenerating || completedActivities.length === 0}
              className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white disabled:text-slate-500 font-semibold rounded-xl text-sm transition-all shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gemini AI가 초안을 빌드하고 있습니다... (10~20초 소요)
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI 포트폴리오 초안 자동 생성
                </>
              )}
            </button>
            {completedActivities.length === 0 && (
              <p className="text-[10px] text-red-400 text-center">
                최소 1개 이상의 AI 코칭 인터뷰 완료 활동이 필요하여 생성이 불가능합니다.
              </p>
            )}
          </div>
        ) : (
          /* Editor Workstation View */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Editor Sidebar: History / Actions */}
            <div className="space-y-6 lg:col-span-1">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5 space-y-5">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <History className="w-4.5 h-4.5 text-indigo-400" />
                  버전 스냅샷
                </h3>

                <div className="space-y-3">
                  <button
                    onClick={handleSaveVersion}
                    className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white border border-white/5 hover:border-white/10 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                        스냅샷 저장 완료
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        현재 버전 저장
                      </>
                    )}
                  </button>

                  <div className="border-t border-white/5 my-3 pt-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      저장된 이력 ({portfolio.snapshots.length}개)
                    </p>
                    
                    {portfolio.snapshots.length === 0 ? (
                      <p className="text-[10px] text-slate-600">저장된 버전 스냅샷이 없습니다.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {portfolio.snapshots.map((snap, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleRestoreVersion(sIdx)}
                            className="w-full text-left p-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 flex items-center justify-between text-xs text-slate-300 transition-all group"
                          >
                            <span>버전 스냅샷 #{sIdx + 1}</span>
                            <Undo className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <FileCheck className="w-4.5 h-4.5 text-indigo-400" />
                  비교 및 내보내기
                </h3>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  초안 작성을 완료하셨다면 다음 또래 비교 탭에서 완성도 갭 리포트를 분석해 보세요.
                </p>
                <button
                  onClick={() => router.push("/portfolio/analysis")}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
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
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold rounded-xl border border-red-500/20 hover:border-red-500/30 transition-all"
              >
                초안 다시 만들기
              </button>
            </div>

            {/* Block Editor workstation */}
            <div className="lg:col-span-3">
              <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    포트폴리오 워크스테이션
                    <span className="text-xs bg-indigo-500/10 text-indigo-300 px-2 py-0.5 border border-indigo-500/20 rounded-full font-medium">
                      {targetJob === "dev" && "개발 직무"}
                      {targetJob === "marketing" && "마케팅 직무"}
                      {targetJob === "data" && "데이터분석 직무"}
                      {targetJob === "planning" && "서비스기획 직무"}
                      {targetJob === "design" && "디자인 직무"}
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
