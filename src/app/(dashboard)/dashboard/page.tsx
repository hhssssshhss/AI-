"use client";

import { useState, useEffect } from "react";

import { useAuthStore, useActivitiesStore } from "@/store";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  CheckCircle2, 
  Calendar, 
  PlayCircle,
  FileEdit,
  Award,
  Users,
  Activity as ActivityIcon,
  Star
} from "lucide-react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { userName } = useAuthStore();
  const name = userName || "Alex";
  const { activities } = useActivitiesStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentYear = new Date().getFullYear();

  // 올해의 활동 
  const thisYearActivities = activities.filter(a => {
    const year = a.periodStart ? new Date(a.periodStart).getFullYear() : currentYear;
    return year === currentYear;
  });
  const thisYearCount = thisYearActivities.length;

  // 올해 활동 추이 (월별)
  const thisYearData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const count = thisYearActivities.filter(a => {
      const m = a.periodStart ? new Date(a.periodStart).getMonth() + 1 : new Date().getMonth() + 1;
      return m === month;
    }).length;
    return { name: `${month}월`, count };
  });

  // 전체 활동 추이 (연도별 누적)
  let startYear = currentYear - 5;
  if (activities.length > 0) {
    const years = activities.map(a => a.periodStart ? new Date(a.periodStart).getFullYear() : currentYear).filter(y => !isNaN(y));
    if (years.length > 0) {
      startYear = Math.min(...years, startYear);
    }
  }

  const totalTrendData = [];
  let cumulativeCount = 0;
  for (let year = startYear; year <= currentYear; year++) {
    const countThisYear = activities.filter(a => {
      const y = a.periodStart ? new Date(a.periodStart).getFullYear() : currentYear;
      return y === year;
    }).length;
    cumulativeCount += countThisYear;
    totalTrendData.push({ name: `${year}`, count: cumulativeCount });
  }

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column (Main Content) */}
        <div className="flex-1 space-y-6">
          {/* 올해의 활동 Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative flex flex-col items-center justify-center">
            <div className="absolute top-6 right-6">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-500 mb-2">올해의 활동</h3>
            <span className="text-6xl font-extrabold text-blue-600">{thisYearCount}</span>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 올해 활동 추이 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-700 mb-6 text-sm">올해 활동 추이</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={thisYearData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} allowDecimals={false} />
                    <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="count" stroke="#0055d4" strokeWidth={2} dot={{ r: 3, fill: '#fff', stroke: '#0055d4', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#0055d4', stroke: '#fff', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 전체 활동 추이 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-700 mb-6 text-sm">[전체 활동 추이]</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={totalTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} orientation="right" dx={10} allowDecimals={false} />
                    <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="count" stroke="#0055d4" strokeWidth={2} dot={{ r: 3, fill: '#fff', stroke: '#0055d4', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#0055d4', stroke: '#fff', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
