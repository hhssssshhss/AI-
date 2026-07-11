// Zustand store: 활동 카드, 인터뷰 Q&A, 포트폴리오 상태 관리
// 서버 DB 없이 클라이언트 상태로만 유지 (PRD v5 명세 기반)
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ──────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────

export type ActivityStatus =
  | "PROCESSING"
  | "READY"
  | "NEEDS_MANUAL_INPUT"
  | "FAILED";
export type InterviewStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface ActivityFile {
  id: string;
  googleDriveFileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  parseStatus: "PENDING" | "DONE" | "FAILED";
}

export interface Activity {
  id: string;
  title: string;
  periodStart?: string;
  periodEnd?: string;
  summary?: string;
  role?: string;
  keywords: string[];
  status: ActivityStatus;
  files: ActivityFile[];
  interview: Interview | null;
}

export interface QaItem {
  id: string;
  category: "PROBLEM" | "RESULT" | "LESSON";
  question: string;
  answer?: string;
  keyInsight?: string;
  order: number;
}

export interface Interview {
  id: string;
  activityId: string;
  status: InterviewStatus;
  qaItems: QaItem[];
}

export interface PortfolioBlock {
  id: string;
  type: "title" | "intro" | "activity" | "summary";
  content: string;
  activityId?: string;
}

export interface Portfolio {
  id: string;
  targetJob: string;
  blocks: PortfolioBlock[];
  version: number;
  snapshots: PortfolioBlock[][];
}

export interface AnalysisReport {
  patterns: string;
  gaps: { area: string; score: number }[];
  suggestions: string[];
}

// ──────────────────────────────────────────────────────
// Auth state (목업 로그인)
// ──────────────────────────────────────────────────────

interface AuthState {
  isLoggedIn: boolean;
  userName: string;
  birthYear: number | null;
  driveLinked: boolean;
  driveAccessToken: string | null;
  login: (name: string) => void;
  logout: () => void;
  setDriveLinked: (token: string) => void;
  setBirthYear: (year: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      userName: "",
      birthYear: null,
      driveLinked: false,
      driveAccessToken: null,
      login: (name) => set({ isLoggedIn: true, userName: name }),
      logout: () =>
        set({
          isLoggedIn: false,
          userName: "",
          driveLinked: false,
          driveAccessToken: null,
        }),
      setDriveLinked: (token) =>
        set({ driveLinked: true, driveAccessToken: token }),
      setBirthYear: (year) => set({ birthYear: year }),
    }),
    { name: "careerfolio-auth-storage" }
  )
);

// ──────────────────────────────────────────────────────
// Activities store
// ──────────────────────────────────────────────────────

interface ActivitiesState {
  activities: Activity[];
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  removeActivity: (id: string) => void;
  getActivity: (id: string) => Activity | undefined;
}

export const useActivitiesStore = create<ActivitiesState>()(
  persist(
    (set, get) => ({
      activities: [],
      addActivity: (activity) =>
        set((state) => ({ activities: [...state.activities, activity] })),
      updateActivity: (id, updates) =>
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      removeActivity: (id) =>
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== id),
        })),
      getActivity: (id) => get().activities.find((a) => a.id === id),
    }),
    { name: "careerfolio-activities-storage" }
  )
);

// ──────────────────────────────────────────────────────
// Portfolio store
// ──────────────────────────────────────────────────────

interface PortfolioState {
  portfolio: Portfolio | null;
  setPortfolio: (portfolio: Portfolio | null) => void;
  updateBlocks: (blocks: PortfolioBlock[]) => void;
  saveSnapshot: () => void;
  restoreSnapshot: (index: number) => void;
  analysisReport: AnalysisReport | null;
  setAnalysisReport: (report: AnalysisReport) => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      portfolio: null,
      setPortfolio: (portfolio) => set({ portfolio }),
      updateBlocks: (blocks) =>
        set((state) =>
          state.portfolio
            ? { portfolio: { ...state.portfolio, blocks } }
            : {}
        ),
      saveSnapshot: () =>
        set((state) => {
          if (!state.portfolio) return {};
          const snapshots = [
            ...state.portfolio.snapshots,
            [...state.portfolio.blocks],
          ];
          return { portfolio: { ...state.portfolio, snapshots } };
        }),
      restoreSnapshot: (index) =>
        set((state) => {
          if (!state.portfolio) return {};
          const snapshot = state.portfolio.snapshots[index];
          if (!snapshot) return {};
          return { portfolio: { ...state.portfolio, blocks: [...snapshot] } };
        }),
      analysisReport: null,
      setAnalysisReport: (report) => set({ analysisReport: report }),
    }),
    { name: "careerfolio-portfolio-storage" }
  )
);
