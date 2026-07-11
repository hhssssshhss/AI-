"use client";

import { useAuthStore, useActivitiesStore } from "@/store";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  CheckCircle2, 
  Calendar, 
  PlayCircle,
  FileEdit,
  Award,
  Users,
  Activity as ActivityIcon
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { userName } = useAuthStore();
  const name = userName || "Alex";
  const { activities } = useActivitiesStore();

  // Dynamic calculations
  const totalActivities = activities.length;
  const completedActivities = activities.filter(a => a.interview?.status === "COMPLETED").length;
  const completionRate = totalActivities === 0 ? 0 : Math.round((completedActivities / totalActivities) * 100);

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column (Main Content) */}
        <div className="flex-1 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              환영합니다, {name}님!
            </h1>
            <p className="text-slate-500 mt-1 font-medium">최근 전문성 개발 요약입니다.</p>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completion Rate */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-700">인터뷰 완료율</h3>
              </div>
              <div className="flex items-end justify-between mb-4">
                <span className="text-4xl font-extrabold text-slate-900">{completionRate}%</span>
                {totalActivities > 0 && <span className="text-sm font-semibold text-slate-500">{completedActivities} / {totalActivities} 완료</span>}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
              </div>
            </div>

            {/* Total Activities */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-orange-500" />
                </div>
                <h3 className="font-bold text-slate-700">전체 활동 개수</h3>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-4xl font-extrabold text-slate-900">{totalActivities}</span>
              </div>
              <p className="text-sm text-slate-500">항목 기록됨</p>
            </div>
          </div>

          {/* Activity Summary Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-800">최근 활동 요약</h3>
              {totalActivities > 0 && (
                <Link href="/activities" className="text-xs font-semibold text-blue-600 hover:text-blue-800">모두 보기</Link>
              )}
            </div>
            
            {totalActivities === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <ActivityIcon className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-600 mb-1">아직 등록된 활동이 없습니다</p>
                <p className="text-xs text-slate-400 mb-4">첫 번째 활동을 추가하고 포트폴리오를 작성해보세요.</p>
                <Link href="/activities" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
                  활동 추가하러 가기
                </Link>
              </div>
            ) : (
              <div className="h-48 flex items-end justify-between gap-3 border-b border-slate-200 pb-0 px-2">
                {/* Dynamically generate simple bars for existing activities up to 7 */}
                {Array.from({ length: 7 }).map((_, i) => {
                  const hasActivity = i < totalActivities;
                  const height = hasActivity ? Math.max(30, Math.random() * 80 + 30) : 10;
                  return (
                    <div 
                      key={i} 
                      className={`w-12 rounded-t-sm transition-all duration-1000 ${hasActivity ? 'bg-blue-500' : 'bg-slate-100'}`} 
                      style={{ height: `${height}%` }}
                    ></div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Side Panel) */}
        <div className="w-full lg:w-80 shrink-0 space-y-6 pt-4 lg:pt-0">
          
          {/* Quick Start Guide */}
          <div className="bg-[#0055d4] rounded-2xl p-6 text-white shadow-md">
            <h3 className="font-bold text-lg mb-2">빠른 시작 가이드</h3>
            <p className="text-sm text-blue-100 mb-6 leading-relaxed">
              5분 만에 포트폴리오 효과를 극대화하는 방법을 알아보세요.
            </p>
            <button className="flex items-center justify-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors w-max">
              <PlayCircle className="w-4 h-4" />
              튜토리얼 시청
            </button>
          </div>

          <h3 className="font-bold text-slate-800 pt-2">추천하는 다음 단계</h3>
          
          <div className="space-y-3">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <FileEdit className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 mb-1">핵심 스킬 업데이트</h4>
                <p className="text-[11px] text-slate-500 leading-tight">기술 스킬 섹션이 3개월 동안 업데이트되지 않았습니다.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 mb-1">새 자격증 추가</h4>
                <p className="text-[11px] text-slate-500 leading-tight">최근 수료한 강의를 기록하여 역량 점수를 높이세요.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 mb-1">동료 리뷰 요청</h4>
                <p className="text-[11px] text-slate-500 leading-tight">최신 프로젝트 포트폴리오에 대한 피드백을 요청하세요.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
