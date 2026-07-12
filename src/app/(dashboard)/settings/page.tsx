"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useActivitiesStore, usePortfolioStore } from "@/store";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Settings, 
  HardDrive, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  CloudLightning,
  Sparkles
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  
  // Zustand Stores
  const { driveLinked } = useAuthStore();
  const { activities } = useActivitiesStore();
  const { portfolio } = usePortfolioStore();

  const [resetSuccess, setResetSuccess] = useState(false);

  const handleDisconnectDrive = () => {
    if (confirm("Google Drive 연동을 해제하시겠습니까? 더 이상 드라이브에 파일을 업로드하거나 읽어올 수 없습니다.")) {
      // Zustand 스토어에서 드라이브 연동 관련 토큰 초기화
      // setDriveLinked를 사용해 빈 값 세팅 혹은 useAuthStore 내 리셋 로직
      // useAuthStore 상태 중 driveLinked와 driveAccessToken 초기화
      useAuthStore.setState({
        driveLinked: false,
        driveAccessToken: null
      });
    }
  };

  const handleOAuthConnect = () => {
    router.push("/api/google/oauth");
  };

  const handleClearAllData = () => {
    if (confirm("⚠️ 경고: 전체 데이터를 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 등록된 모든 활동 카드, 인터뷰 내역, 포트폴리오 에디터 내용이 즉시 영구 삭제됩니다.")) {
      
      // Delete all store data locally
      useActivitiesStore.persist.clearStorage();
      usePortfolioStore.persist.clearStorage();
      // Reinitialize state to empty/default if needed
      useActivitiesStore.setState({ activities: [] });
      usePortfolioStore.setState({ portfolio: null });
      
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
      }, 3000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            설정
            <Settings className="w-6 h-6 text-indigo-400" />
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            계정 연동을 관리하고 전체 데이터 초기화 등 서비스 환경을 설정합니다.
          </p>
        </div>

        {/* 1. Google Drive Integration Section */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Google Drive 연동 관리</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  사용자 본인의 구글 드라이브 내 &quot;CareerFolio&quot; 전용 폴더에 업로드한 원본 파일을 실제로 읽고 쓰기 위한 권한을 관리합니다.
                </p>
              </div>
            </div>
            
            <div className="shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                driveLinked 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-gray-500/10 text-gray-400 border-gray-500/20"
              }`}>
                {driveLinked ? "연동 완료" : "미연동"}
              </span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-semibold">동의 권한 범위: drive.file scope</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                본 서비스가 생성한 구글 드라이브 내 파일에 한해서만 접근 권한이 제한적으로 제공됩니다.
              </p>
            </div>

            {driveLinked ? (
              <button
                onClick={handleDisconnectDrive}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold rounded-xl border border-red-500/20 hover:border-red-500/30 transition-all shrink-0"
              >
                드라이브 연동 해제
              </button>
            ) : (
              <button
                onClick={handleOAuthConnect}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
              >
                <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
                구글 드라이브 연동
              </button>
            )}
          </div>
        </div>

        {/* 2. Platform Reset Section */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex gap-3">
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">플랫폼 데이터 초기화</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                현재 브라우저 세션에 저장된 모든 활동 카드 목록, 인터뷰 내역, 포트폴리오 에디터 데이터가 모두 완전 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <p className="text-slate-400 font-semibold">데이터 통계:</p>
              <div className="flex gap-4 text-[10px] text-slate-500">
                <span>등록된 활동 카드: <b>{activities.length}개</b></span>
                <span>생성된 포트폴리오: <b>{portfolio ? "있음" : "없음"}</b></span>
              </div>
            </div>

            {resetSuccess ? (
              <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 font-semibold rounded-xl border border-emerald-500/20 flex items-center gap-1.5 shrink-0 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                모든 데이터가 성공적으로 초기화되었습니다.
              </div>
            ) : (
              <button
                onClick={handleClearAllData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                전체 데이터 삭제 및 공장초기화
              </button>
            )}
          </div>
        </div>

        {/* 3. Guide/Out of Scope Info Section */}
        <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-6 space-y-3 text-xs text-slate-400">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            데모 버전 안내 (CareerFolio v5)
          </h4>
          <p className="leading-relaxed">
            - 본 애플리케이션은 <b>구글 드라이브 실제 업로드</b> 및 <b>Gemini API 기반의 정형화·질문 스트리밍·포트폴리오 생성</b>을 실제로 수행하는 하이브리드 데모입니다.
          </p>
          <p className="leading-relaxed">
            - 원본 파일은 사용자 본인의 구글 드라이브 내에만 안전하게 보관되며, 당사 서버에는 어떠한 원본 파일도 복사 및 저장되지 않습니다.
          </p>
          <p className="leading-relaxed">
            - 로그인 및 DB 영속성 관리는 목업으로 시연되므로, 브라우저 창을 닫거나 새로고침 할 경우 모든 활동 내역이 초기화될 수 있습니다.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
