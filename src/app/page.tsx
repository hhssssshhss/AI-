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
      router.push("/activities");
    } else {
      router.push("/login");
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-slate-900 flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-300/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <main className="z-10 max-w-4xl w-full text-center space-y-12 py-16">
        {/* Logo and Icon */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-100 border border-indigo-200 shadow-sm animate-bounce">
            <Sparkles className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800">
            CareerFolio
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            흩어진 프로젝트 이력을 모으고 AI 인터뷰를 통해 핵심 인사이트를 구조화하여, 한 차원 높은 프리미엄 직무 맞춤형 포트폴리오를 완성해 보세요.
          </p>
        </div>

        {/* Feature Grid Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto text-left">
          {/* Card 1 */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 p-5 rounded-2xl space-y-3 hover:border-indigo-300 hover:shadow-lg transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm">
              01
            </div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <FolderGit className="w-4 h-4 text-indigo-500" />
              활동 파일 업로드
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              PDF, Word, Excel, 이미지 등 다양한 포맷의 활동 기록을 구글 드라이브에 안전하게 보관 및 분석합니다.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 p-5 rounded-2xl space-y-3 hover:border-indigo-300 hover:shadow-lg transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm">
              02
            </div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              AI 코칭 인터뷰
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Gemini AI가 STAR 기반 핵심 성과와 배운 점을 발굴하기 위해 실시간 스트리밍 인터뷰를 이끌어 냅니다.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 p-5 rounded-2xl space-y-3 hover:border-indigo-300 hover:shadow-lg transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm">
              03
            </div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              초안 자동 생성
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              인터뷰 데이터를 활용하여 개발, 마케팅, 기획 등 지원 직무에 어울리는 문체와 테마로 초안을 구성합니다.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 p-5 rounded-2xl space-y-3 hover:border-indigo-300 hover:shadow-lg transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm">
              04
            </div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              또래 비교 분석
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              동일 직무 또래 그룹과의 갭 분석 레이더 차트 및 구체적인 보완 체크리스트를 제안받아 완성도를 높입니다.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleStart}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:via-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl text-base shadow-[0_4px_30px_rgba(99,102,241,0.4)] transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            포트폴리오 생성하기
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-[10px] text-slate-400 mt-3">
            * 이 프로젝트는 Google Gemini 및 Google Drive 실제 연동이 포함된 부분 실구현 데모 버전입니다.
          </p>
        </div>
      </main>
    </div>
  );
}
