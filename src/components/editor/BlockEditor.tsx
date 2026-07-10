"use client";

import { useState } from "react";
import { PortfolioBlock } from "@/store";
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
    title: { label: "포트폴리오 제목", icon: LayoutGrid, color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5" },
    intro: { label: "자기소개", icon: AlignLeft, color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
    activity: { label: "활동 설명", icon: Briefcase, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
    summary: { label: "핵심 성과 요약", icon: FileText, color: "text-amber-400 border-amber-500/20 bg-amber-500/5" }
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
            className="group relative bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-200"
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
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-slate-800"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === blocks.length - 1}
                  onClick={() => moveBlock(idx, "down")}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-slate-800"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBlockId(isEditing ? null : block.id)}
                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold ${
                    isEditing 
                      ? "bg-indigo-600 text-white" 
                      : "bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI 교정
                </button>
              </div>
            </div>

            {/* AI Rewrite Options Panel */}
            {isEditing && (
              <div className="mb-4 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-indigo-300">AI 재작성 모드:</span>
                  <div className="flex rounded-lg bg-black/40 p-1 border border-white/5">
                    <button
                      type="button"
                      onClick={() => setRewriteOption("concise")}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        rewriteOption === "concise"
                          ? "bg-indigo-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      더 간결하게
                    </button>
                    <button
                      type="button"
                      onClick={() => setRewriteOption("highlight")}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        rewriteOption === "highlight"
                          ? "bg-indigo-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      성과 강조
                    </button>
                    <button
                      type="button"
                      onClick={() => setRewriteOption("keyword")}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        rewriteOption === "keyword"
                          ? "bg-indigo-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      키워드 반영
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleRewrite(block.id, block.content)}
                    className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white disabled:text-slate-500 font-semibold rounded-lg text-xs transition-all"
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

            {/* Block Body Textarea */}
            <div className="relative">
              <textarea
                value={block.content}
                onChange={(e) => handleTextChange(block.id, e.target.value)}
                disabled={isLoading}
                rows={block.type === "title" ? 1 : block.type === "intro" ? 3 : 5}
                className={`w-full bg-slate-950/60 border border-white/5 hover:border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-gray-600 focus:outline-none transition-all resize-none custom-scrollbar leading-relaxed ${
                  block.type === "title" ? "text-lg font-bold" : ""
                } disabled:opacity-50`}
                placeholder={`${meta.label} 내용을 입력하세요...`}
              />
              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs rounded-xl flex items-center justify-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    AI가 문장을 교정하는 중...
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
