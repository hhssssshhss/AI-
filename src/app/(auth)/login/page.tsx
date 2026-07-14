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
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 px-4 overflow-hidden">
      <div className="w-full max-w-md z-10">
        {/* Logo/Title */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 mb-4 shadow-sm">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">
            CareerFolio
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            AI 기반 커리어 포트폴리오 통합 플랫폼 (v5 데모)
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              간편 로그인 (Mock)
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              데모 시연을 위해 실제 가입 없이 이름만으로 로그인합니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                이름
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4.5 w-4.5 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="홍길동"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                출생연도 (또래 비교 분석용)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Calendar className="h-4.5 w-4.5 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    setError("");
                  }}
                  maxLength={4}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="예: 2001"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 active:translate-y-0 hover:-translate-y-0.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "처리 중..." : "로그인 후 시작하기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
