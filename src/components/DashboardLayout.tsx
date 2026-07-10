"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store";
import Link from "next/link";
import { 
  FolderGit, 
  BookOpen, 
  TrendingUp, 
  Settings, 
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
    { name: "활동 관리", href: "/activities", icon: FolderGit },
    { name: "포트폴리오 빌더", href: "/portfolio/builder", icon: BookOpen },
    { name: "또래 비교 분석", href: "/portfolio/analysis", icon: TrendingUp },
    { name: "설정", href: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900/60 backdrop-blur-md border-r border-white/5 p-6 z-10 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8 px-2">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          <span className="font-extrabold text-xl bg-clip-text bg-gradient-to-r from-white to-slate-400">
            CareerFolio
          </span>
        </div>

        {/* User Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm">
              {userName.slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm text-white truncate">{userName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <HardDrive className={`w-3.5 h-3.5 ${driveLinked ? 'text-emerald-400' : 'text-gray-500'}`} />
                <span className="text-[10px] text-gray-400 truncate">
                  {driveLinked ? '구글드라이브 연동됨' : '드라이브 미연동'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-300 border-l-2 border-indigo-500 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl text-sm font-medium transition-all mt-auto"
        >
          <LogOut className="w-4.5 h-4.5" />
          로그아웃
        </button>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden bg-slate-900/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between z-20 sticky top-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span className="font-extrabold text-lg bg-clip-text bg-gradient-to-r from-white to-slate-400">
            CareerFolio
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-400 hover:text-white focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-slate-950/95 flex flex-col pt-20 px-6 pb-6 animate-fade-in">
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
                      ? "bg-indigo-500/10 text-indigo-300"
                      : "text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              logout();
            }}
            className="flex items-center gap-4 px-5 py-4 text-red-400 hover:bg-red-500/5 rounded-xl text-base font-semibold mt-auto"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 z-10 relative overflow-y-auto max-h-screen">
        <div className="p-6 md:p-10 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
