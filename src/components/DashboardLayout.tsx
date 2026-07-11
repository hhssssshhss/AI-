"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store";
import Link from "next/link";
import { 
  FolderGit, 
  BookOpen, 
  TrendingUp, 
  LogOut, 
  Sparkles,
  Menu,
  X,
  HardDrive
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, userName, logout, driveLinked } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Google Login Callback
  useEffect(() => {
    if (!mounted) return;
    const loggedInId = searchParams?.get("loggedInUserId");
    if (loggedInId && !isLoggedIn) {
      import("@/app/actions/auth").then(({ getUserById }) => {
        getUserById(loggedInId).then(user => {
          if (user) {
            useAuthStore.getState().login(user);
            // Optional: clean up URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }
        });
      });
    }
  }, [mounted, searchParams, isLoggedIn]);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace("/login");
    }
  }, [mounted, isLoggedIn, router]);

  if (!mounted || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#020005] flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "대시보드", href: "/dashboard", icon: TrendingUp }, // Temporary icon for dashboard
    { name: "활동 내역", href: "/activities", icon: FolderGit },
    { name: "포트폴리오", href: "/portfolio/builder", icon: BookOpen },
    { name: "역량 분석", href: "/portfolio/analysis", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-100/50 border-r border-slate-200 p-6 z-10 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-10 px-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <div className="flex flex-col">
            <span className="font-extrabold text-xl text-slate-800 leading-none">
              CareerFolio
            </span>
            <span className="text-[10px] text-slate-500 mt-1 leading-none">AI 커리어 파트너</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive 
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* New Portfolio Button */}
        <div className="mt-8 mb-6">
          <Link href="/portfolio/builder" className="w-full flex items-center justify-center gap-2 py-3 bg-[#0055d4] hover:bg-blue-700 text-white rounded-full font-semibold text-sm transition-colors shadow-sm">
            <span className="text-lg leading-none">+</span> 새 포트폴리오 만들기
          </Link>
        </div>

        {/* User Card & Logout */}
        <div className="mt-auto pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm overflow-hidden">
              {userName ? userName.slice(0, 2) : "User"}
            </div>
            <div className="overflow-hidden flex flex-col">
              <span className="font-semibold text-sm text-slate-800 truncate">{userName || "User"}</span>
              <span className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                {driveLinked ? <HardDrive className="w-3 h-3 text-emerald-500" /> : <HardDrive className="w-3 h-3 text-slate-400" />}
                {driveLinked ? '연동됨' : '미연동'}
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="로그아웃"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-20 sticky top-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span className="font-extrabold text-lg text-slate-800">
            CareerFolio
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-600 hover:text-slate-900 focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-white/95 backdrop-blur-md flex flex-col pt-20 px-6 pb-6 animate-fade-in">
          <div className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-xl text-base font-semibold ${
                    isActive 
                      ? "bg-blue-500 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
          
          <div className="mb-4">
             <Link href="/portfolio/builder" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex items-center justify-center gap-2 py-3 bg-[#0055d4] text-white rounded-full font-semibold text-sm transition-colors">
              <span className="text-lg leading-none">+</span> 새 포트폴리오 만들기
            </Link>
          </div>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              logout();
            }}
            className="flex items-center gap-4 px-5 py-4 text-red-500 hover:bg-red-50 rounded-xl text-base font-semibold mt-auto border border-red-100"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 z-10 relative overflow-y-auto max-h-screen bg-slate-50">
        <div className="p-6 md:p-10 w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
