"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, useActivitiesStore, usePortfolioStore, Activity } from "@/store";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  CloudLightning, 
  FolderPlus, 
  UploadCloud, 
  FileText, 
  Calendar, 
  Loader2, 
  AlertTriangle,
  Trash2
} from "lucide-react";
import { fetchUserActivities, createActivity, deleteActivityAction } from "@/app/actions/activities";

function ActivitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { driveLinked, driveAccessToken, setDriveLinked, userId } = useAuthStore();
  const { activities, addActivity, updateActivity, removeActivity, setActivities } = useActivitiesStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityRole, setActivityRole] = useState("");
  const [activityKeywords, setActivityKeywords] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");



  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL에서 Drive Token 감지 후 상태 동기화
  useEffect(() => {
    const driveToken = searchParams.get("driveToken");
    if (driveToken) {
      setDriveLinked(true, driveToken);
      // URL 파라미터 정리
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams, setDriveLinked]);

  // DB에서 유저 활동 불러오기 (Zustand 로컬 스토리지와 최신 상태 동기화)
  useEffect(() => {
    if (userId) {
      fetchUserActivities(userId).then((data) => {
        const mapped = data.map((d) => ({
          ...d,
          summary: d.summary ?? undefined,
          role: d.role ?? undefined,
          periodStart: d.periodStart ? new Date(d.periodStart).toISOString().split('T')[0] : undefined,
          periodEnd: d.periodEnd ? new Date(d.periodEnd).toISOString().split('T')[0] : undefined,
        })) as unknown as Activity[];
        
        // 서버에서 가져온 최신 데이터를 상태에 덮어씌움 (인터뷰 데이터도 이제 서버에 저장됨)
        setActivities(mapped);
      }).catch(console.error);
    }
  }, [userId, setActivities]);

  const handleOAuthConnect = () => {
    if (!userId) {
      setErrorMsg("로그인이 필요합니다.");
      return;
    }
    router.push(`/api/google/oauth?userId=${userId}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      // 파일 크기 20MB 제한 검증
      const oversized = filesArray.some(f => f.size > 20 * 1024 * 1024);
      if (oversized) {
        setErrorMsg("파일당 최대 크기는 20MB입니다.");
        return;
      }
      // 파일 개수 5개 제한
      if (selectedFiles.length + filesArray.length > 5) {
        setErrorMsg("활동 1건당 최대 5개 파일까지만 업로드 가능합니다.");
        return;
      }
      setSelectedFiles(prev => [...prev, ...filesArray]);
      setErrorMsg("");
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      // 로컬 전용 ID(act_)가 아니면 DB 삭제 시도
      if (!id.startsWith("act_") && !id.startsWith("temp_")) {
        await deleteActivityAction(id);
      }
    } catch (err) {
      console.error("DB 삭제 실패 (로컬 전용 데이터일 수 있음)", err);
    } finally {
      // 에러 발생 여부와 상관없이 로컬 UI(Zustand)에서는 무조건 삭제
      removeActivity(id);

      // 활동이 삭제되면 연관된 포트폴리오 페이지도 함께 삭제
      const currentUserId = useAuthStore.getState().userId;
      const currentBirthYear = useAuthStore.getState().birthYear;
      const userKey = `${currentUserId}_${currentBirthYear || 'unknown'}`;
      const currentPortfolio = usePortfolioStore.getState().portfoliosByUser[userKey];
      const pageToDelete = currentPortfolio?.pages?.find(p => p.activityId === id);
      if (pageToDelete) {
        usePortfolioStore.getState().deletePage(userKey, pageToDelete.id);
      }
    }
  };

  // Google Drive 폴더 생성/조회 및 파일 업로드 헬퍼
  const uploadToGoogleDrive = async (file: File, token: string): Promise<string> => {
    // 1. "CareerFolio" 전용 폴더 찾기
    setUploadProgress("구글 드라이브 폴더 확인 중...");
    const query = encodeURIComponent("name='CareerFolio' and mimeType='application/vnd.google-apps.folder' and trashed=false");
    const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData = await listRes.json();
    let folderId = "";

    if (listData.files && listData.files.length > 0) {
      folderId = listData.files[0].id;
    } else {
      // 폴더가 없으면 생성
      setUploadProgress("구글 드라이브에 'CareerFolio' 폴더 생성 중...");
      const createFolderRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "CareerFolio",
          mimeType: "application/vnd.google-apps.folder"
        })
      });
      const folderData = await createFolderRes.json();
      folderId = folderData.id;
    }

    // 2. 파일 업로드 (Multipart)
    setUploadProgress(`'${file.name}' 업로드 중...`);
    const metadata = {
      name: file.name,
      parents: [folderId]
    };
    const formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    formData.append("file", file);

    const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (uploadRes.status === 401) {
      setDriveLinked(false, undefined);
      throw new Error("구글 드라이브 접근 권한이 만료되었습니다. 다시 연동해주세요.");
    }
    
    if (!uploadRes.ok) {
      throw new Error(`Drive 업로드 실패: ${uploadRes.statusText}`);
    }

    const uploadData = await uploadRes.json();
    return uploadData.id;
  };

  const handleRegisterActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim()) {
      setErrorMsg("활동명을 입력해주세요.");
      return;
    }
    if (selectedFiles.length === 0) {
      setErrorMsg("최소 1개 이상의 파일을 업로드해주세요.");
      return;
    }
    if (!driveAccessToken) {
      setErrorMsg("구글 드라이브가 연동되어 있지 않습니다.");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");

    // 임시 활동 생성 (Zustand)
    const tempId = "act_" + Math.random().toString(36).substring(2, 11);
    const newAct: Activity = {
      id: tempId,
      title: activityTitle,
      periodStart: startDate || undefined,
      periodEnd: endDate || undefined,
      status: "PROCESSING",
      keywords: [],
      files: [],
      interview: null
    };

    addActivity(newAct);
    setIsModalOpen(false);

    try {
      // 1단계: 파일 업로드
      const file = selectedFiles[0];
      const googleDriveFileId = await uploadToGoogleDrive(file, driveAccessToken);

      // 2단계: 유저가 입력한 정보를 바탕으로 즉시 활동 데이터 저장 (AI 파싱 생략)
      setUploadProgress("활동을 저장하고 있습니다...");
      const keywordsArray = activityKeywords.split(",").map(k => k.trim()).filter(Boolean);

      if (userId) {
        const dbActivity = await createActivity(userId, {
          title: activityTitle,
          summary: activityDescription || "설명 없음",
          role: activityRole || "역할 없음",
          keywords: keywordsArray,
          periodStart: startDate,
          periodEnd: endDate,
          files: [{
            googleDriveFileId,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size
          }]
        });

        // Zustand 스토어 업데이트 (임시 항목 교체)
        removeActivity(tempId);
        addActivity({
          ...dbActivity,
          summary: dbActivity.summary ?? undefined,
          role: dbActivity.role ?? undefined,
          periodStart: dbActivity.periodStart ? new Date(dbActivity.periodStart).toISOString().split('T')[0] : undefined,
          periodEnd: dbActivity.periodEnd ? new Date(dbActivity.periodEnd).toISOString().split('T')[0] : undefined,
          status: "READY"
        } as unknown as Activity);
      } else {
        // 로컬 환경용
        removeActivity(tempId);
        addActivity({
          id: `act_${Math.random().toString(36).substring(2, 11)}`,
          title: activityTitle,
          summary: activityDescription || "설명 없음",
          role: activityRole || "역할 없음",
          keywords: keywordsArray,
          periodStart: startDate || undefined,
          periodEnd: endDate || undefined,
          status: "READY",
          files: [{
            id: `file_${Math.random().toString(36).substring(2, 11)}`,
            googleDriveFileId: googleDriveFileId,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            parseStatus: "DONE"
          }],
          interview: null
        } as unknown as Activity);
      }

    } catch (err: any) {
      console.error(err);
      removeActivity(tempId);
      setErrorMsg(err.message || "활동 등록 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      setActivityTitle("");
      setStartDate("");
      setEndDate("");
      setSelectedFiles([]);
    }
  };

  if (!isMounted) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              활동 내역 라이브러리
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              나의 전문 경험을 관리하고 추적하세요.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
              <input type="text" placeholder="활동 검색..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-64 bg-white" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
              필터
            </button>
            {driveAccessToken ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#0055d4] hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all"
              >
                <span className="text-lg leading-none">+</span> 새 기록
              </button>
            ) : (
              <button
                onClick={handleOAuthConnect}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-sm transition-all"
              >
                <CloudLightning className="w-4 h-4 text-amber-400" />
                드라이브 연동
              </button>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">작업 오류</p>
              <p className="text-xs text-red-400/80 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Upload Loading Overlay */}
        {isUploading && (
          <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <div>
              <p className="font-bold text-white text-sm">활동 카드를 생성 중입니다...</p>
              <p className="text-xs text-indigo-200/70 mt-0.5">{uploadProgress}</p>
            </div>
          </div>
        )}



        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white border border-slate-200 rounded-3xl text-center shadow-sm relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <FolderPlus className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="font-extrabold text-2xl text-slate-800 mb-3">포트폴리오의 시작, 첫 활동을 기록해보세요</h3>
              <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-8">
                프로젝트, 워크샵, 자격증 등 어떤 경험이든 좋습니다. 증빙 자료를 업로드하면 AI가 핵심 역량을 분석하여 포트폴리오의 기초를 만들어 드립니다.
              </p>
              
              <button
                onClick={() => driveAccessToken ? setIsModalOpen(true) : handleOAuthConnect()}
                className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
              >
                <UploadCloud className="w-5 h-5" />
                {driveAccessToken ? "첫 활동 추가하기" : "구글 드라이브 연동하고 시작하기"}
              </button>

              {!driveAccessToken && (
                <p className="mt-4 text-xs font-semibold text-blue-500">
                  파일 업로드를 위해 최초 1회 구글 드라이브 연동이 필요합니다.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((act) => (
              <div 
                key={act.id} 
                className="bg-white border border-slate-200 rounded-2xl flex flex-col hover:shadow-md transition-shadow overflow-hidden relative cursor-pointer"
                onClick={() => {
                  if (act.status === "READY") {
                    router.push(`/activities/${act.id}/interview`);
                  }
                }}
              >
                {/* Mock Image Placeholder */}
                <div className="h-40 bg-slate-100 w-full relative">
                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    프로젝트
                  </div>
                  <div className="absolute top-3 right-3">
                    {act.status === "READY" && (
                      <span className="px-2.5 py-1 bg-[#0055d4] text-white rounded-full text-[10px] font-bold shadow-sm">완료됨</span>
                    )}
                    {act.status === "PROCESSING" && (
                      <span className="px-2.5 py-1 bg-blue-400 text-white rounded-full text-[10px] font-bold shadow-sm">진행 중</span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-1">
                      {act.title}
                    </h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteActivity(act.id); }}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {act.status === "READY" && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {act.summary}
                    </p>
                  )}
                  {act.status === "PROCESSING" && (
                    <div className="space-y-2 mb-4 pt-1">
                      <div className="h-3 bg-slate-100 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse"></div>
                    </div>
                  )}

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {act.periodStart ? `${act.periodStart} - ${act.periodEnd || "현재"}` : "일정 미정"}
                    </div>
                    {act.keywords && act.keywords.length > 0 && (
                      <div className="flex gap-1.5">
                        {act.keywords.slice(0, 2).map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-[10px] text-slate-600 font-medium rounded-md">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add Activity */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-400" />
                새 활동 등록
              </h2>

              <form onSubmit={handleRegisterActivity} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    활동명 (필수)
                  </label>
                  <input
                    type="text"
                    required
                    value={activityTitle}
                    onChange={(e) => setActivityTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    placeholder="예: 2026 해커톤 백엔드 개발"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    간단한 설명 (선택)
                  </label>
                  <textarea
                    value={activityDescription}
                    onChange={(e) => setActivityDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    placeholder="활동에 대한 간단한 설명을 적어주세요."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    맡은 역할 (선택)
                  </label>
                  <input
                    type="text"
                    value={activityRole}
                    onChange={(e) => setActivityRole(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    placeholder="예: 프론트엔드 개발, 기획 등"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    키워드 (선택, 쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={activityKeywords}
                    onChange={(e) => setActivityKeywords(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    placeholder="예: React, TypeScript, 기획, 소통"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      시작일 (선택)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      종료일 (선택)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-70"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    활동 파일 업로드 (최대 5개, 개당 20MB 제한)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-white/10 hover:border-indigo-500/50 bg-slate-950 hover:bg-indigo-950/20 rounded-xl p-6 text-center cursor-pointer transition-all duration-200"
                  >
                    <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-300 font-semibold">클릭하여 파일 선택</p>
                    <p className="text-[10px] text-slate-500 mt-1">PDF, DOCX, XLSX, PPTX, TXT, JPG, PNG 지원</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      className="hidden"
                      accept=".pdf,.docx,.xlsx,.pptx,.txt,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,image/jpeg,image/png"
                    />
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5 text-xs">
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="text-slate-300 truncate">{file.name}</span>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              ({(file.size / 1024 / 1024).toFixed(2)}MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(idx)}
                            className="text-slate-500 hover:text-red-400 text-[10px]"
                          >
                            제거
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedFiles([]);
                      setErrorMsg("");
                      setActivityTitle("");
                      setActivityDescription("");
                      setActivityRole("");
                      setActivityKeywords("");
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all font-semibold"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg"
                  >
                    카드 생성 및 업로드
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <ActivitiesContent />
    </Suspense>
  );
}
