"use client";

import { useAuthStore } from "@/store";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  CheckCircle2, 
  Calendar, 
  PlayCircle,
  FileEdit,
  Award,
  Users
} from "lucide-react";

export default function DashboardPage() {
  const { userName } = useAuthStore();
  const name = userName || "Alex";

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
                <h3 className="font-bold text-slate-700">활동 완료율</h3>
              </div>
              <div className="flex items-end justify-between mb-4">
                <span className="text-4xl font-extrabold text-slate-900">78%</span>
                <span className="text-sm font-semibold text-blue-600">이번 주 +5%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "78%" }}></div>
              </div>
            </div>

            {/* Weekly Activities */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-orange-500" />
                </div>
                <h3 className="font-bold text-slate-700">이번 주 활동</h3>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-4xl font-extrabold text-slate-900">12</span>
              </div>
              <p className="text-sm text-slate-500">항목 기록됨</p>
            </div>
          </div>

          {/* Activity Summary Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-800">최근 활동 요약</h3>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-800">모두 보기</button>
            </div>
            
            {/* Mock Bar Chart */}
            <div className="h-48 flex items-end justify-between gap-3 border-b border-slate-200 pb-0 px-2">
              {[40, 60, 100, 30, 60, 80, 110].map((height, i) => (
                <div 
                  key={i} 
                  className={`w-12 rounded-t-sm ${i === 2 || i === 5 ? 'bg-blue-700' : 'bg-blue-400'}`} 
                  style={{ height: `${(height / 120) * 100}%` }}
                ></div>
              ))}
            </div>
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
