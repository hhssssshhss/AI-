"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { KeyRound, User, Calendar, Sparkles } from "lucide-react";
import { loginOrRegister } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (!year.trim() || isNaN(Number(year))) {
      setError("올바른 출생연도(4자리 숫자)를 입력해주세요.");
      return;
    }
    
    const yearNum = Number(year);
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
      setError("유효한 출생연도를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const user = await loginOrRegister(name, yearNum);
      login(user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-radial from-[#1e1b4b] via-[#090514] to-[#020005] px-4 overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-300">
            CareerFolio
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            AI 기반 커리어 포트폴리오 통합 플랫폼 (v5 데모)
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              간편 로그인 (Mock)
            </h2>
            <p className="text-xs text-indigo-200/60 mt-1">
              데모 시연을 위해 실제 가입 없이 이름만으로 로그인합니다.
            </p>
          </div>

          <div className="space-y-5 mt-4">
            <button
              onClick={() => router.push("/api/google/oauth?userId=login")}
              className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-sm flex items-center justify-center gap-3 border border-gray-200"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google로 시작하기
            </button>
            <p className="text-xs text-center text-gray-500 mt-4">
              로그인하면 드라이브 연동 권한도 함께 요청됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
