"use client";

import { useState } from "react";
import { PortfolioBlock, useAuthStore } from "@/store";
import { 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  RefreshCw, 
  Check, 
  LayoutGrid,
  AlignLeft,
  Briefcase,
  FileText
} from "lucide-react";

interface BlockEditorProps {
  blocks: PortfolioBlock[];
  targetJob: string;
  onUpdateBlocks: (blocks: PortfolioBlock[]) => void;
}

export default function BlockEditor({ blocks, targetJob, onUpdateBlocks }: BlockEditorProps) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [rewriteOption, setRewriteOption] = useState<"concise" | "highlight" | "keyword">("concise");
  const [loadingBlockId, setLoadingBlockId] = useState<string | null>(null);
  
  const { driveAccessToken } = useAuthStore();

  const handleTextChange = (id: string, text: string) => {
    const updated = blocks.map(b => b.id === id ? { ...b, content: text } : b);
    onUpdateBlocks(updated);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[nextIndex];
    newBlocks[nextIndex] = temp;

    onUpdateBlocks(newBlocks);
  };

  const handleRewrite = async (id: string, currentContent: string) => {
    setLoadingBlockId(id);
    try {
      const res = await fetch("/api/portfolio/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockContent: currentContent,
          rewriteOption,
          targetJob
        })
      });

      if (!res.ok) throw new Error("AI Rewrite failed");

      const data = await res.json();
      if (data.content) {
        handleTextChange(id, data.content);
        setEditingBlockId(null);
      }
    } catch (err) {
      console.error(err);
      alert("AI 재작성 중 오류가 발생했습니다.");
    } finally {
      setLoadingBlockId(null);
    }
  };

  const blockTypeMeta = {
    title: { label: "포트폴리오 제목", icon: LayoutGrid, color: "text-blue-600 border-blue-200 bg-blue-50" },
    intro: { label: "자기소개", icon: AlignLeft, color: "text-purple-600 border-purple-200 bg-purple-50" },
    activity: { label: "활동 설명", icon: Briefcase, color: "text-emerald-600 border-emerald-200 bg-emerald-50" },
    summary: { label: "핵심 성과 요약", icon: FileText, color: "text-amber-600 border-amber-200 bg-amber-50" }
  };

  return (
    <div className="space-y-6">
      {blocks.map((block, idx) => {
        const meta = blockTypeMeta[block.type] || blockTypeMeta.activity;
        const Icon = meta.icon;
        const isLoading = loadingBlockId === block.id;
        const isEditing = editingBlockId === block.id;

        return (
          <div 
            key={block.id}
            className="group relative bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 transition-all duration-200 shadow-sm"
          >
            {/* Header controls */}
            <div className="flex items-center justify-between mb-3.5">
              <div className={`inline-flex items-center gap-2 px-3 py-1 border rounded-full text-xs font-semibold ${meta.color}`}>
                <Icon className="w-3.5 h-3.5" />
                {meta.label}
              </div>

              <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveBlock(idx, "up")}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg hover:text-slate-800 transition-all disabled:opacity-30 disabled:hover:bg-slate-100"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === blocks.length - 1}
                  onClick={() => moveBlock(idx, "down")}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg hover:text-slate-800 transition-all disabled:opacity-30 disabled:hover:bg-slate-100"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBlockId(isEditing ? null : block.id)}
                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold ${
                    isEditing 
                      ? "bg-[#0055d4] text-white" 
                      : "bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI 교정
                </button>
              </div>
            </div>

            {/* AI Rewrite Options Panel */}
            {isEditing && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-blue-700">AI 재작성 모드:</span>
                  <div className="flex rounded-lg bg-white p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setRewriteOption("concise")}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        rewriteOption === "concise"
                          ? "bg-[#0055d4] text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      더 간결하게
                    </button>
                    <button
                      type="button"
                      onClick={() => setRewriteOption("highlight")}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        rewriteOption === "highlight"
                          ? "bg-[#0055d4] text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      성과 강조
                    </button>
                    <button
                      type="button"
                      onClick={() => setRewriteOption("keyword")}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        rewriteOption === "keyword"
                          ? "bg-[#0055d4] text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      키워드 반영
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleRewrite(block.id, block.content)}
                    className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-[#0055d4] hover:bg-blue-700 disabled:bg-slate-300 text-white disabled:text-slate-500 font-semibold rounded-lg text-xs transition-all"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        재작성 중...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        적용하기
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Block Body: Text and (Optional) Image Layout */}
            <div className={`relative ${block.googleDriveFileId ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : ''}`}>
              <div className="relative h-full flex flex-col">
                <textarea
                  value={block.content}
                  onChange={(e) => handleTextChange(block.id, e.target.value)}
                  disabled={isLoading}
                  rows={block.googleDriveFileId ? 8 : (block.type === "title" ? 1 : block.type === "intro" ? 3 : 5)}
                  className={`w-full h-full min-h-[120px] bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all resize-none custom-scrollbar leading-relaxed ${
                    block.type === "title" ? "text-lg font-bold" : ""
                  } disabled:opacity-50 focus:bg-white focus:ring-1 focus:ring-blue-500 shadow-inner`}
                  placeholder={`${meta.label} 내용을 입력하세요...`}
                />
                {isLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 animate-pulse bg-white px-4 py-2 rounded-full shadow-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      AI가 문장을 교정하는 중...
                    </div>
                  </div>
                )}
              </div>
              
              {/* Image Side */}
              {block.googleDriveFileId && driveAccessToken && (
                <div className="relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[200px]">
                  <img 
                    src={`/api/drive/image?fileId=${block.googleDriveFileId}&token=${driveAccessToken}`} 
                    alt="Activity Reference" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                      (e.target as HTMLImageElement).className = 'w-16 h-16 opacity-30';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm font-semibold">
                    첨부된 활동 사진
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
