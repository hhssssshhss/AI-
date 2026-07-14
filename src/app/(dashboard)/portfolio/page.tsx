"use client";

import { useState, useEffect } from "react";
import { usePortfolioStore } from "@/store";
import DashboardLayout from "@/components/DashboardLayout";
import { Sparkles, Edit2, Check, Download, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function PortfolioPage() {
  const { portfolio, updatePageContent, deletePage } = usePortfolioStore();
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditClick = (pageId: string, content: string) => {
    setEditingPageId(pageId);
    setEditContent(content);
  };

  const handleSaveEdit = (pageId: string) => {
    updatePageContent(pageId, editContent);
    setEditingPageId(null);
  };

  const pages = portfolio?.pages || [];

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">내 마스터 포트폴리오</h1>
            <p className="text-slate-500 text-sm mt-1">
              AI 인터뷰를 마친 활동들이 이곳에 자동으로 누적됩니다.
            </p>
          </div>
          <button 
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4" />
            PDF로 내보내기
          </button>
        </div>

        {pages.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-10 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-extrabold text-xl text-slate-800 mb-2">아직 기록된 활동이 없습니다</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">
              활동 탭에서 새로운 활동을 추가하고 AI와 인터뷰를 완료하면 이곳에 포트폴리오 내용이 자동으로 기록됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {pages.map((page, index) => (
              <div 
                key={page.id} 
                className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none"
              >
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                  <div>
                    <div className="text-xs font-bold text-blue-600 mb-1">Activity {index + 1}</div>
                    <h2 className="text-xl font-bold text-slate-900">{page.activityTitle}</h2>
                    <p className="text-sm text-slate-500 mt-1">{page.period}</p>
                  </div>
                  <div className="flex items-center gap-2 print:hidden">
                    {editingPageId === page.id ? (
                      <button 
                        onClick={() => handleSaveEdit(page.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Check className="w-4 h-4" />
                        저장
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleEditClick(page.id, page.content)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="내용 수정"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        if (confirm("이 포트폴리오 페이지를 삭제하시겠습니까?")) {
                          deletePage(page.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-8 prose prose-slate max-w-none prose-h3:text-slate-800 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600">
                  {editingPageId === page.id ? (
                    <textarea 
                      className="w-full min-h-[300px] p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y font-mono text-sm"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                  ) : (
                    <ReactMarkdown>{page.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </DashboardLayout>
  );
}
