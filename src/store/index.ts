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
  category: "PROBLEM" | "RESULT" | "DEEP_DIVE" | "LESSON";
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

export interface PortfolioPage {
  id: string;
  activityId: string;
  activityTitle: string;
  period: string;
  content: string;
}

export interface Portfolio {
  id: string;
  pages: PortfolioPage[];
}

export interface AnalysisReport {
  patterns: string;
  gaps: { area: string; score: number }[];
  suggestions: string[];
}


// ──────────────────────────────────────────────────────
// Auth state (DB 연동 기반 세션 관리)
// ──────────────────────────────────────────────────────

interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  userName: string;
  birthYear: number | null;
  driveLinked: boolean;
  driveAccessToken: string | null;
  login: (user: { id: string; name: string; birthYear: number | null; driveLinked: boolean }) => void;
  logout: () => void;
  setDriveLinked: (linked: boolean, token?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      userId: null,
      userName: "",
      birthYear: null,
      driveLinked: false,
      driveAccessToken: null,
      login: (user) => set({ 
        isLoggedIn: true, 
        userId: user.id, 
        userName: user.name, 
        birthYear: user.birthYear, 
        driveLinked: user.driveLinked 
      }),
      logout: () =>
        set({
          isLoggedIn: false,
          userId: null,
          userName: "",
          birthYear: null,
          driveLinked: false,
          driveAccessToken: null,
        }),
      setDriveLinked: (linked, token) =>
        set({ driveLinked: linked, driveAccessToken: token || null }),
    }),
    {
      name: 'careerfolio-auth-storage',
    }
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
  setActivities: (activities: Activity[]) => void;
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
      setActivities: (activities) => set({ activities }),
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
  addPage: (page: PortfolioPage) => void;
  updatePageContent: (pageId: string, content: string) => void;
  deletePage: (pageId: string) => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      portfolio: null,
      setPortfolio: (portfolio) => set({ portfolio }),
      addPage: (page) =>
        set((state) => {
          if (!state.portfolio) {
            return { portfolio: { id: "port_master", pages: [page] } };
          }
          const pages = state.portfolio.pages || [];
          // If page for this activity already exists, update it. Otherwise append.
          const existing = pages.find(p => p.activityId === page.activityId);
          if (existing) {
            return {
              portfolio: {
                ...state.portfolio,
                pages: pages.map(p => p.activityId === page.activityId ? page : p)
              }
            };
          }
          return {
            portfolio: {
              ...state.portfolio,
              pages: [...pages, page]
            }
          };
        }),
      updatePageContent: (pageId, content) =>
        set((state) => {
          if (!state.portfolio) return {};
          const pages = state.portfolio.pages || [];
          return {
            portfolio: {
              ...state.portfolio,
              pages: pages.map(p => p.id === pageId ? { ...p, content } : p)
            }
          };
        }),
      deletePage: (pageId) =>
        set((state) => {
          if (!state.portfolio) return {};
          const pages = state.portfolio.pages || [];
          return {
            portfolio: {
              ...state.portfolio,
              pages: pages.filter(p => p.id !== pageId)
            }
          };
        })
    }),
    { name: "careerfolio-portfolio-storage" }
  )
);
