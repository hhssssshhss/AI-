# PRD: AI 기반 커리어 포트폴리오 통합 플랫폼 (가칭: CareerFolio)

- 문서 버전: v1.0
- 작성일: 2026-07-08
- 대상 스택: Next.js (App Router) 풀스택
- 상태: Draft

---

## 1. 개요 (Overview)

### 1.1 제품 정의
사용자가 활동 자료(파일)를 업로드하면 AI가 이를 구조화하고, 대화형 인터뷰를 통해 성과·배운 점 등 인사이트를 추출한 뒤, 지원 직무에 맞춘 포트폴리오를 자동 생성·비교분석까지 제공하는 통합 커리어 관리 플랫폼.

### 1.2 배경 및 문제 정의
| 문제 | 상세 |
|---|---|
| 시간·방법 부재 | 취준생 대다수가 포트폴리오 작성 시간이 없거나 방법을 모름 |
| 데이터 파편화 | 인턴·프로젝트·공모전 기록이 PDF, PPT, 이미지 등으로 분산 |
| 단순 나열 | "무엇을 했다" 수준에 그쳐 성과·인사이트가 드러나지 않음 |

### 1.3 타겟 사용자
- 20~30대 대학생 및 취업 준비생
- 경험은 있으나 스토리라인·성과 중심 표현에 서툰 사용자
- 파편화된 자료로 역량 어필에 어려움을 겪는 사용자

### 1.4 핵심 가치 제안 (Value Proposition)
"업로드만 하면, AI가 질문하고, 포트폴리오가 완성된다."
1. 자료 통합 → 2. 인사이트 추출 → 3. 포트폴리오 생성 → 4. 또래(동일 연령대) 비교 벤치마킹의 원스톱 파이프라인.

### 1.5 성공 지표 (KPI)
| 지표 | 목표 (출시 후 3개월) |
|---|---|
| 활동 카드 생성 완료율 (업로드 → 카드 생성) | ≥ 85% |
| 인터뷰 완주율 (활동당 전체 질문 답변 완료) | ≥ 60% |
| 포트폴리오 초안 생성 사용자 비율 | ≥ 40% |
| 초안 → 편집 후 내보내기(Export) 전환율 | ≥ 50% |
| 주간 재방문율 (WAU/MAU) | ≥ 35% |

---

## 2. 사용자 플로우 (User Flow)

```
회원가입/로그인
   │
   ▼
[Feature 1] 활동 등록: 제목 + 기간(선택) + 파일 업로드
   │  파일 파싱 → AI 정형화 → 활동 카드 생성
   ▼
[Feature 2] AI 인터뷰: 카드 기반 맞춤 질문 → 답변 → 피드백 루프
   │  Q&A 인사이트 저장 (중간 이탈 시 자동 저장)
   ▼
[Feature 3] 포트폴리오 빌더: 직무 선택 → 초안 자동 생성 → 편집
   │
   ▼
[Feature 4] 비교 분석: 동일 연령대(또래) 포트폴리오 vs 내 포트폴리오 갭 분석 → 개선 제안
   │
   ▼
내보내기 (PDF / 웹 공유 링크)
```

---

## 3. 기능 요구사항 (Functional Requirements)

### Feature 1. 활동별 파일 업로드 및 커리어 DB 자동 정형화

**목적:** 흩어진 활동 자료를 한 곳에 모으고 AI가 구조화된 데이터로 변환.

| 항목 | 명세 |
|---|---|
| 입력 | 활동명(필수), 활동 기간(선택), 파일 1개 이상 (다중 업로드) |
| 지원 형식 | PDF, JPG/PNG, XLSX, PPTX, DOCX, TXT |
| 제약 | 파일당 최대 20MB, 활동 1건당 최대 5개 |
| 출력 | 활동 카드: 제목, 요약, 기간, 주요 역할, 키워드 태그 |

**처리 파이프라인:**
1. 클라이언트에서 Presigned URL로 S3 직접 업로드 (Next.js API Route가 URL 발급)
2. 업로드 완료 → 파싱 잡(job) 큐 등록
3. 텍스트 추출: PDF(`pdf-parse`), DOCX(`mammoth`), XLSX(`sheetjs`), PPTX(zip+XML 파싱), 이미지(Claude Vision 멀티모달 입력)
4. 추출 텍스트를 Claude API에 전달 → JSON 스키마로 활동 개요·역할·키워드 구조화
5. 활동 카드 DB 저장 → 클라이언트에 실시간 상태 갱신(폴링 or SSE)

**예외 처리:**
- 텍스트 추출 실패(저화질 스캔 등) → 카드 상태 `NEEDS_MANUAL_INPUT`로 표시, 수동 보완 입력 폼 제공
- 지원하지 않는 형식/용량 초과 → 업로드 전 클라이언트 검증 + 서버 이중 검증
- AI 파싱 실패 → 3회 재시도 후 수동 입력 유도

**Acceptance Criteria:**
- [ ] 5개 파일 동시 업로드 시 각 파일의 진행률이 개별 표시된다
- [ ] 업로드 완료 후 60초 이내 활동 카드가 생성된다 (P90 기준)
- [ ] 추출 불가 파일은 실패 사유와 함께 수동 입력 UI가 노출된다

---

### Feature 2. AI 기반 활동 인사이트 인터뷰

**목적:** 대화형 질의응답으로 성과와 배운 점을 구체적인 언어로 추출.

| 항목 | 명세 |
|---|---|
| 입력 | Feature 1의 활동 카드 (개요, 역할, 키워드) |
| 질문 카테고리 | ① 문제 상황·극복 과정 ② 정량/정성 성과 ③ 배운 점·아쉬운 점 |
| 출력 | Q&A 데이터 (질문, 답변, AI 요약 핵심 한 줄) |

**대화 로직:**
- 카드의 역할/키워드 기반으로 카테고리별 맞춤 질문을 순차 생성 (활동당 기본 5~8문항)
- 답변 수신 → AI가 구체성 평가:
  - 충분 → 핵심 한 줄 요약 저장 후 다음 질문
  - 부족 → 재질문 (최대 2회, 이후 다음 질문으로 강제 진행하여 피로 방지)
  - "모르겠다"/회피 → 유사 사례 예시 제시 후 구체화 유도
- 스트리밍 응답(Claude API streaming)으로 대화 체감 속도 확보

**저장 방식:**
- 답변 제출 즉시 DB 저장 (자동 저장). 세션 이탈 후 재진입 시 마지막 질문부터 이어서 진행
- 인터뷰 상태: `NOT_STARTED` / `IN_PROGRESS` / `COMPLETED`

**Acceptance Criteria:**
- [ ] 인터뷰 중 브라우저 종료 후 재접속 시 동일 지점에서 재개된다
- [ ] "모르겠다" 답변 시 예시 포함 재질문이 생성된다
- [ ] 완료 시 활동 카드에 인사이트 요약이 자동 연결된다

---

### Feature 3. 데이터 연동형 맞춤 포트폴리오 자동 빌더

**목적:** 활동 데이터 + 인터뷰 인사이트 + 지원 직무를 종합해 포트폴리오 초안 자동 생성.

| 항목 | 명세 |
|---|---|
| 입력 | 전체 활동 카드 + Q&A 데이터 + 지원 직무 선택 (마케팅/개발/데이터분석/기획/디자인 등) |
| 처리 | ① 직무 관련성 기반 활동 우선순위화 ② 직무 스타일 문체·구성 재구성 ③ 초안 생성 |
| 출력 | 제목, 자기소개, 활동별 상세(스토리라인), 핵심 성과 요약 |

**편집 기능:**
- 블록 기반 에디터: 문장 단위 수정, 활동 순서 드래그 변경, 특정 활동 제외 토글
- AI 부분 재작성: 문단 선택 → "더 간결하게 / 성과 강조 / 직무 키워드 반영" 리라이트
- 버전 이력: 초안 생성 시점 스냅샷 저장, 되돌리기 지원

**예외 처리:**
- 인터뷰 미완료 활동 → 초안에서 제외하거나 "정보 보완 필요" 경고 배지 표시 (사용자 선택)
- 활동 데이터 부족(카드 1개 미만) → 생성 차단 + 활동 등록 유도

**Acceptance Criteria:**
- [ ] 직무 선택 후 90초 이내 초안 생성 (P90)
- [ ] 미완료 인터뷰 활동에 경고 배지가 표시되고, 클릭 시 인터뷰로 이동한다
- [ ] PDF 내보내기 및 읽기 전용 공유 링크가 동작한다

---

### Feature 4. 또래(동일 연령대) 포트폴리오 비교 분석

**목적:** 나와 비슷한 나이대·직무를 지원하는 또래 사용자들의 포트폴리오(익명화)와 비교해 벤치마킹 인사이트 제공.

| 항목 | 명세 |
|---|---|
| 입력 | 사용자 출생연도/나이 + 지원 직무 + 사용자 포트폴리오 초안 |
| 데이터 소스 | 플랫폼 내 동의 기반 익명화 또래 포트폴리오 DB (동일·인접 연령대 사용자, 예: ±2세) |
| 출력 | ① 또래 그룹 내 공통 패턴 요약 ② 갭 분석 리포트 ③ 개선 제안 리스트 |

**처리 과정:**
1. 사용자와 동일·인접 연령대(예: 만 나이 ±2세) & 동일·유사 직무군 사용자 포트폴리오 필터링 (연령 구간 + 직무 임베딩 유사도 기반)
2. AI가 또래 그룹 내 공통 패턴 추출: 강조 활동 유형, 성과 표현 방식(정량 지표 위치 등), 구성 순서
3. 사용자 포트폴리오와 또래 패턴 비교 → 갭 스코어링
4. 차이점·개선 포인트 시각화 (레이더 차트, 항목별 체크리스트)

**예외 처리:**
- 해당 연령대·직무 조합 표본 부족(예: n < 10) → 연령대 범위 확장(±2세 → ±4세) 또는 유사 직무군 확장 비교, 그래도 부족 시 "데이터 부족" 안내 + 일반 가이드 제공

**개인정보 보호:**
- 비교 DB의 모든 사례는 이름·소속·사진 등 식별 정보 제거 후 저장, 나이는 연령대 구간으로만 저장(정확한 생년월일 비저장)
- 사용자 포트폴리오는 명시적 opt-in 동의 없이는 비교 DB에 축적되지 않음
- 동의 철회 시 30일 이내 DB에서 삭제

**Acceptance Criteria:**
- [ ] 갭 분석 리포트에 최소 3개 이상의 실행 가능한 개선 제안이 포함된다
- [ ] 동일 연령대 표본 부족 시 연령대 확장 비교 또는 안내 메시지가 노출된다
- [ ] 익명화 파이프라인이 PII(이름/이메일/전화번호/소속/정확한 생년월일)를 자동 마스킹한다

---

## 4. 기술 아키텍처 (Next.js 스택)

### 4.1 기술 스택

| 레이어 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 15 (App Router) + TypeScript | 풀스택 (RSC + Server Actions + Route Handlers) |
| UI | Tailwind CSS + shadcn/ui | 블록 에디터는 Tiptap |
| 상태 관리 | TanStack Query + Zustand | 서버 상태 / 클라이언트 UI 상태 분리 |
| 인증 | Auth.js (NextAuth v5) | 이메일 + 카카오/구글 OAuth |
| DB | PostgreSQL + Prisma ORM | 배포: Supabase 또는 Neon |
| 벡터 검색 | pgvector | Feature 4 연령대·직무 유사도 기반 또래 사례 검색 |
| 파일 스토리지 | AWS S3 (Presigned URL 업로드) | CloudFront CDN |
| AI | Anthropic Claude API | 구조화(JSON), 인터뷰(streaming), 초안 생성, 비교 분석 |
| 비동기 잡 | Inngest 또는 BullMQ + Redis | 파일 파싱, 카드 생성, 익명화 배치 |
| 배포 | Vercel (앱) + AWS (스토리지/잡 워커) | |
| 모니터링 | Sentry + Vercel Analytics | |

### 4.2 시스템 구성도

```
[Browser]
   │  RSC / Server Actions / fetch
   ▼
[Next.js on Vercel]
   ├─ app/ (RSC 페이지)
   ├─ Route Handlers (/api/*)        ─┬─→ [PostgreSQL + pgvector]
   ├─ Server Actions (뮤테이션)       │
   └─ Presigned URL 발급              │
        │                            │
        ▼                            │
     [S3 업로드] ──(이벤트)──→ [잡 큐(Inngest)] ──→ 파일 파싱 워커
                                                     │
                                                     ▼
                                              [Claude API]
                                          (구조화/인터뷰/생성/분석)
```

### 4.3 디렉터리 구조 (제안)

```
src/
├─ app/
│  ├─ (auth)/login, signup
│  ├─ (dashboard)/
│  │  ├─ activities/              # Feature 1: 활동 목록·등록
│  │  │  └─ [id]/interview/       # Feature 2: 인터뷰 화면
│  │  ├─ portfolio/
│  │  │  ├─ builder/              # Feature 3: 생성·편집
│  │  │  └─ analysis/             # Feature 4: 비교 분석
│  │  └─ settings/
│  ├─ share/[slug]/               # 읽기 전용 공유 페이지
│  └─ api/
│     ├─ uploads/presign/route.ts
│     ├─ activities/route.ts
│     ├─ interview/stream/route.ts   # SSE 스트리밍
│     ├─ portfolio/generate/route.ts
│     └─ analysis/route.ts
├─ lib/ (prisma, s3, claude, parsers/)
├─ components/ (ui/, editor/, charts/)
└─ inngest/ (functions: parse-file, build-card, anonymize)
```

### 4.4 데이터 모델 (Prisma 스키마 요약)

```prisma
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  name          String?
  birthYear     Int?        // Feature 4 또래 비교용 출생연도
  targetJob     String?     // 지원 직무
  consentToDb   Boolean     @default(false) // Feature 4 또래 비교 DB 축적 동의
  activities    Activity[]
  portfolios    Portfolio[]
}

model Activity {
  id          String        @id @default(cuid())
  userId      String
  title       String
  periodStart DateTime?
  periodEnd   DateTime?
  summary     String?       // AI 생성 요약
  role        String?       // 주요 역할
  keywords    String[]      // 키워드 태그
  status      ActivityStatus @default(PROCESSING)
  files       ActivityFile[]
  interview   Interview?
}

enum ActivityStatus { PROCESSING  READY  NEEDS_MANUAL_INPUT  FAILED }

model ActivityFile {
  id           String   @id @default(cuid())
  activityId   String
  s3Key        String
  fileName     String
  mimeType     String
  sizeBytes    Int
  extractedText String?  @db.Text
  parseStatus  String    // PENDING / DONE / FAILED
}

model Interview {
  id         String          @id @default(cuid())
  activityId String          @unique
  status     InterviewStatus @default(NOT_STARTED)
  qaItems    QaItem[]
}

model QaItem {
  id          String  @id @default(cuid())
  interviewId String
  category    String  // PROBLEM / RESULT / LESSON
  question    String  @db.Text
  answer      String? @db.Text
  keyInsight  String? // AI 핵심 한 줄 요약
  order       Int
}

model Portfolio {
  id        String   @id @default(cuid())
  userId    String
  targetJob String
  content   Json     // 블록 기반 구조 (제목/소개/활동섹션/성과요약)
  version   Int      @default(1)
  shareSlug String?  @unique
  analyses  AnalysisReport[]
}

model AnalysisReport {
  id           String   @id @default(cuid())
  portfolioId  String
  patterns     Json     // 또래 그룹(연령대x직무) 공통 패턴
  gaps         Json     // 갭 분석 결과
  suggestions  Json     // 개선 제안 리스트
  createdAt    DateTime @default(now())
}

model PeerCase {             // 익명화된 또래 포트폴리오 사례
  id         String                    @id @default(cuid())
  ageGroup   Int                       // 연령대 구간 (예: 만 나이 기준 그룹 값)
  jobFamily  String
  content    Json                      // PII 제거 완료 데이터
  embedding  Unsupported("vector")?    // pgvector
  source     String                    // INTERNAL_OPTIN
}
```

### 4.5 핵심 API 명세 (요약)

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/uploads/presign` | S3 Presigned URL 발급 (형식·용량 검증) |
| POST | `/api/activities` | 활동 생성 + 파싱 잡 등록 |
| GET | `/api/activities/:id` | 카드 상태·데이터 조회 (폴링용) |
| POST | `/api/interview/stream` | 인터뷰 질문/피드백 SSE 스트리밍 |
| PATCH | `/api/interview/:id/answer` | 답변 저장 (자동 저장) |
| POST | `/api/portfolio/generate` | 직무 기반 초안 생성 |
| PATCH | `/api/portfolio/:id` | 편집 내용 저장 (블록 JSON) |
| POST | `/api/analysis` | 비교 분석 실행 → 리포트 반환 |

### 4.6 AI 프롬프트 설계 원칙
- **구조화(Feature 1):** JSON 스키마 강제 + 필드별 누락 시 `null` 허용, 환각 방지를 위해 "파일에 없는 정보는 추측하지 말 것" 명시
- **인터뷰(Feature 2):** STAR 프레임워크(Situation-Task-Action-Result) 기반 질문 생성, 답변 구체성 평가 루브릭 포함
- **생성(Feature 3):** 직무별 스타일 가이드(어휘·구성 템플릿)를 시스템 프롬프트에 주입, 사용자의 실제 답변만 근거로 사용
- **분석(Feature 4):** 또래(동일 연령대) 사례 원문 노출 금지 — 패턴 요약만 출력하여 타인 포트폴리오 유출 방지

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

| 영역 | 요구사항 |
|---|---|
| 성능 | 페이지 LCP < 2.5s, 카드 생성 P90 < 60s, 초안 생성 P90 < 90s |
| 보안 | 파일 접근은 소유자 한정 Presigned URL(만료 10분), 전 구간 HTTPS, Rate limiting |
| 개인정보 | 익명화 파이프라인 PII 자동 마스킹, opt-in 동의 관리, 철회 시 30일 내 삭제, 개인정보처리방침 고지 |
| 가용성 | 잡 실패 시 3회 재시도 + DLQ, AI API 장애 시 사용자에게 상태 안내 및 재시도 버튼 |
| 접근성 | WCAG 2.1 AA 준수, 키보드 내비게이션 지원 |
| 확장성 | 파싱 워커 수평 확장 가능 구조, DB 커넥션 풀링(PgBouncer) |

---

## 6. 출시 로드맵 (Milestones)

| 단계 | 기간 | 범위 |
|---|---|---|
| M1: MVP | 6주 | 인증 + Feature 1 (업로드·카드 생성) + Feature 2 (인터뷰) |
| M2: 빌더 | 4주 | Feature 3 (초안 생성 + 블록 에디터 + PDF 내보내기) |
| M3: 분석 | 4주 | Feature 4 (또래 포트폴리오 DB 구축 + 갭 분석) + 공유 링크 |
| M4: 고도화 | 지속 | 템플릿 다양화, 직무 확장, 협업 피드백 기능 |

---

## 7. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 초기 또래 비교 데이터 부족 | Feature 4 품질 저하 | 초기 사용자 대상 opt-in 유도로 시드 데이터 확보, 연령대·직무 조합 표본 부족 시 범위 확장 및 일반 가이드 폴백 |
| AI 환각(허위 성과 생성) | 신뢰도 하락 | 사용자 답변·파일 근거만 사용하도록 프롬프트 제약 + 생성물에 근거 하이라이트 |
| 파일 파싱 실패율 | 온보딩 이탈 | 수동 입력 폴백 UI, 형식별 파서 지속 개선 |
| AI API 비용 | 수익성 | 캐싱, 토큰 최적화, 무료 티어 사용량 제한(예: 월 활동 5건) |
| 민감 개인정보 업로드 | 법적 리스크 | 업로드 시 PII 경고 고지, 익명화 필수 처리 |

---

## 8. Out of Scope (v1 제외)
- 기업 채용 담당자용 열람 서비스
- 다국어 포트폴리오 생성
- 모바일 네이티브 앱 (반응형 웹으로 대응)
- 실시간 협업 편집
