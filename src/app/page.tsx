"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { Sparkles, FolderGit, MessageSquare, BookOpen, TrendingUp, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStart = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center px-6 overflow-hidden">
      <main className="z-10 max-w-4xl w-full text-center space-y-12 py-16">
        {/* Logo and Icon */}
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-blue-600" />
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-4xl text-slate-800 leading-none">
                CareerFolio
              </span>
              <span className="text-sm text-slate-500 mt-1 leading-none font-medium">
                AI 커리어 파트너
              </span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            AI로 완성하는 당신의<br />맞춤형 커리어 포트폴리오
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            흩어진 프로젝트 이력을 모으고 AI 인터뷰를 통해 핵심 인사이트를 구조화하여, 한 차원 높은 프리미엄 직무 맞춤형 포트폴리오를 완성해 보세요.
          </p>
        </div>

        {/* Feature Grid Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4 hover:border-blue-300 hover:shadow-md transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FolderGit className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">
              활동 파일 업로드
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              PDF, Word, Excel, 이미지 등 다양한 포맷의 활동 기록을 구글 드라이브에 안전하게 보관 및 분석합니다.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4 hover:border-blue-300 hover:shadow-md transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">
              AI 코칭 인터뷰
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Gemini AI가 STAR 기반 핵심 성과와 배운 점을 발굴하기 위해 실시간 스트리밍 인터뷰를 이끌어 냅니다.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4 hover:border-blue-300 hover:shadow-md transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">
              초안 자동 생성
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              인터뷰 데이터를 활용하여 개발, 마케팅, 기획 등 지원 직무에 어울리는 문체와 테마로 초안을 구성합니다.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4 hover:border-blue-300 hover:shadow-md transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">
              또래 비교 분석
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              동일 직무 또래 그룹과의 갭 분석 레이더 차트 및 구체적인 보완 체크리스트를 제안받아 완성도를 높입니다.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleStart}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-base shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            포트폴리오 시작하기
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-[11px] text-slate-400 mt-4">
            * 이 프로젝트는 Google Gemini 및 Google Drive 실제 연동이 포함된 부분 실구현 데모 버전입니다.
          </p>
        </div>
      </main>
    </div>
  );
}
