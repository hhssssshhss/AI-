# PRD: AI 기반 커리어 포트폴리오 통합 플랫폼 (가칭: CareerFolio)

- 문서 버전: v5.0 (AI·파일 스토리지 실구현 전환)
- 작성일: 2026-07-09
- 대상 스택: Next.js (App Router) 풀스택
- 상태: **부분 실구현 데모** (AI 엔진 + 파일 스토리지는 실제 연동, 그 외는 목업)

> **⚠ 프로젝트 성격 안내 (v5 변경)**
> v4까지는 전 기능을 목업으로 시연하는 컨셉 데모였으나, v5부터는 **AI(Google Gemini API)와 파일 스토리지(사용자 Google Drive)를 실제로 연동**합니다. 나머지 영역은 기존과 동일하게 목업으로 유지합니다.
> - **AI는 실제로 구현합니다.** Google Gemini API를 실제 호출하여 활동 구조화(JSON), 인터뷰 스트리밍, 포트폴리오 초안 생성, 또래 비교 분석용 텍스트 생성을 수행합니다. (단, Feature 4의 "또래 데이터" 자체는 실 사용자 DB가 없으므로 사전에 준비한 익명화 샘플 데이터셋을 Gemini에 컨텍스트로 제공하는 방식 — 아래 4.6·Feature 4 참고)
> - **파일 스토리지는 실제로 구현합니다.** Google OAuth(`drive.file` scope) 동의 후, 사용자 본인의 Google Drive "CareerFolio" 폴더에 실제로 파일을 업로드하고, 서버는 원본을 보관하지 않고 `fileId` 등 메타데이터만 저장합니다.
> - **로그인은 여전히 완전 목업(Mock Login)입니다.** 실제 세션/사용자 인증 시스템은 구현하지 않으며, 버튼 클릭만으로 로그인 상태로 진입합니다. 단, 활동 등록 시점에 Google OAuth 동의(Drive 접근용)는 별도로 실제 진행합니다.
> - **영속 DB(Prisma/PostgreSQL)는 목업입니다.** 활동 카드·인터뷰 Q&A·포트폴리오 등은 브라우저 세션(클라이언트 상태) 또는 로컬 스토리지 수준으로만 유지하고, 서버 DB에 영구 저장하지 않습니다. (단, Drive `fileId` 등 최소 메타데이터는 API 라우트 처리 중 임시로만 사용)
> - **또래 비교 DB(PeerCase)는 목업입니다.** 실제 사용자들이 동의하고 축적한 또래 포트폴리오 DB는 없으며, 사전에 작성한 익명화 샘플 세트를 사용합니다.
> - 개발 기간은 기존 1주에서 **2주**로 재조정합니다 (사유는 6장 로드맵 참고).

---

## 1. 개요 (Overview)

### 1.1 제품 정의
사용자가 활동 자료(파일)를 업로드하면 AI가 이를 구조화하고, 대화형 인터뷰를 통해 성과·배운 점 등 인사이트를 추출한 뒤, 지원 직무에 맞춘 포트폴리오를 자동 생성·비교분석까지 제공하는 통합 커리어 관리 플랫폼 — **AI(Google Gemini API)·파일 스토리지(Google Drive)는 실제로 연동하고, 로그인·DB·또래 데이터는 목업으로 시연하는 부분 실구현 데모.**

원본 파일은 자체 서버·클라우드에 저장하지 않고, **사용자 본인의 Google Drive(Google 계정)** 에 저장하는 구조를 지향한다. 서비스는 파일 원본을 보관하지 않고 메타데이터(파일 ID·이름 등)만 참조하여, 사용자가 자기 데이터의 소유권을 그대로 유지할 수 있게 한다.

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

### 1.5 성공 지표 (참고용 – 실서비스화 시 목표)
> 아래 지표는 **실제 서비스로 출시할 경우의 목표치**입니다. v5 데모 단계에서는 이 지표를 정식으로 측정하지 않으며, 대신 "AI(Gemini)·Drive 연동이 실제로 동작하며 4개 기능 화면이 끊김 없이 연결되는지"를 완성 기준으로 삼습니다.

| 지표 | 목표 (출시 후 3개월 가정) |
|---|---|
| 활동 카드 생성 완료율 (업로드 → 카드 생성) | ≥ 85% |
| 인터뷰 완주율 (활동당 전체 질문 답변 완료) | ≥ 60% |
| 포트폴리오 초안 생성 사용자 비율 | ≥ 40% |
| 초안 → 편집 후 내보내기(Export) 전환율 | ≥ 50% |
| 주간 재방문율 (WAU/MAU) | ≥ 35% |

---

## 2. 사용자 플로우 (User Flow)

```
회원가입/로그인 (목업 로그인 버튼 클릭 → 실제 인증 없이 즉시 로그인 상태로 진입)
   │
   ▼
[Feature 1] 활동 등록: 제목 + 기간(선택) + 파일 업로드
   │  (실제) Google Drive 업로드 → 파일 파싱 → Gemini API 정형화 → 활동 카드 생성
   ▼
[Feature 2] AI 인터뷰: 카드 기반 맞춤 질문 → 답변 → 피드백 루프
   │  (실제) Gemini 스트리밍 질문/피드백, Q&A는 클라이언트 상태로 저장 (서버 DB 미구현)
   ▼
[Feature 3] 포트폴리오 빌더: 직무 선택 → 초안 자동 생성 → 편집
   │  (실제) Gemini가 활동+인터뷰 데이터를 반영해 초안 생성
   ▼
[Feature 4] 비교 분석: 동일 연령대(또래) 포트폴리오 vs 내 포트폴리오 갭 분석 → 개선 제안
   │  (실제 AI 호출 + 목업 또래 샘플셋) Gemini가 목업 또래 데이터셋 기반으로 리포트 생성
   ▼
내보내기 (PDF / 웹 공유 링크) — 목업 화면만 제공, 실제 파일 생성/링크 발급 X
```

---

## 3. 기능 요구사항 (Functional Requirements)

> v5부터 Feature 1~3의 "처리 파이프라인/대화 로직/처리 과정"은 **실제로 구현·실행**됩니다 (Google Drive 업로드, 파일 파싱, Gemini API 호출). Feature 4는 AI 분석 자체는 실제로 실행되지만, 입력으로 쓰이는 "또래 데이터"는 실 사용자 DB가 없어 사전에 준비한 목업 샘플셋을 사용합니다. 로그인·서버 DB 영속 저장은 여전히 목업입니다.

### Feature 1. 활동별 파일 업로드 및 커리어 DB 자동 정형화

**목적:** 흩어진 활동 자료를 한 곳에 모으고 AI가 구조화된 데이터로 변환.

| 항목 | 명세 |
|---|---|
| 입력 | 활동명(필수), 활동 기간(선택), 파일 1개 이상 (다중 업로드) |
| 지원 형식 | PDF, JPG/PNG, XLSX, PPTX, DOCX, TXT |
| 제약 | 파일당 최대 20MB, 활동 1건당 최대 5개 |
| 출력 | 활동 카드: 제목, 요약, 기간, 주요 역할, 키워드 태그 |

**처리 파이프라인 (v5: 실제 구현):**
1. 로그인(목업) 이후, 활동 등록을 처음 시도할 때 Google OAuth 동의(Drive 파일 쓰기 권한, `drive.file` scope)를 **실제로** 받아 사용자 Google 계정과 연동 (※ 로그인 자체와는 별개의 동의 단계이며, 이 OAuth만 실제 Google Identity Platform을 사용)
2. 클라이언트에서 Google Drive API(v3, `files.create`)로 사용자 본인 드라이브 내 "CareerFolio" 전용 폴더에 파일을 **실제로 직접 업로드** (자체 서버에는 파일 원본 미보관, resumable upload 사용)
3. 업로드 완료 → 반환된 Google Drive `fileId`를 API 라우트(`/api/activities`)에 전달, 파싱 처리 시작
4. 텍스트 추출: Drive API로 파일을 서버에서 임시로 읽어와 PDF(`pdf-parse`), DOCX(`mammoth`), XLSX(`sheetjs`), PPTX(zip+XML 파싱), 이미지(Gemini 멀티모달 입력)로 텍스트/콘텐츠 추출 후 메모리에서만 처리, 원본 바이트는 응답 직후 폐기(서버 디스크·DB에 저장하지 않음)
5. 추출 결과를 Gemini API(`generateContent` + `responseSchema`)에 전달 → JSON 스키마로 활동 개요·역할·키워드를 **실제로** 구조화
6. 활동 카드는 구조화 결과와 Drive `fileId`를 클라이언트 상태(Zustand)에 저장 (서버 DB 영속 저장은 목업 범위 — 새로고침 시 초기화될 수 있음을 UI에 안내)

**실제 구현 시 필요 요소:**
- Google Cloud Console 프로젝트 생성, OAuth 동의화면 등록(테스트 사용자 등록으로 검수 대기 없이 데모 가능), Drive API 활성화
- Gemini API 키 발급 및 서버 사이드 환경변수(`GEMINI_API_KEY`)로 관리 (클라이언트에 노출 금지)
- 파일 크기·형식 사전 검증(20MB, 5개) 로직은 그대로 유지

**예외 처리 (실제 구현):**
- 텍스트 추출 실패(저화질 스캔 등) → 카드 상태 `NEEDS_MANUAL_INPUT`로 표시, 수동 보완 입력 폼 제공
- 지원하지 않는 형식/용량 초과 → 업로드 전 클라이언트 검증 + 서버 이중 검증
- Gemini 응답이 스키마와 불일치하거나 API 오류(429/5xx) → 최대 3회 재시도(지수 백오프) 후 수동 입력 유도
- Drive OAuth 거부/토큰 만료 → 재동의 유도 배너 노출

**Acceptance Criteria (v5 기준):**
- [ ] 실제 Google 계정으로 OAuth 동의 후 사용자 Drive에 "CareerFolio" 폴더와 업로드 파일이 실제로 생성된다
- [ ] 업로드한 파일 내용을 기반으로 Gemini가 생성한 실제 활동 카드(제목/요약/키워드)가 화면에 나타난다
- [ ] 이미지 등 추출 실패 케이스에서 "수동 입력 필요" 상태 UI가 표시된다
- [ ] Gemini API 오류 시 재시도 및 수동 입력 유도 흐름이 동작한다

---

### Feature 2. AI 기반 활동 인사이트 인터뷰

**목적:** 대화형 질의응답으로 성과와 배운 점을 구체적인 언어로 추출.

| 항목 | 명세 |
|---|---|
| 입력 | Feature 1의 활동 카드 (개요, 역할, 키워드) |
| 질문 카테고리 | ① 문제 상황·극복 과정 ② 정량/정성 성과 ③ 배운 점·아쉬운 점 |
| 출력 | Q&A 데이터 (질문, 답변, AI 요약 핵심 한 줄) |

**대화 로직 (v5: 실제 구현):**
- 카드의 역할/키워드를 시스템 프롬프트에 주입, Gemini가 카테고리별 맞춤 질문을 **실제로** 순차 생성 (활동당 기본 5~8문항, STAR 프레임워크 기반)
- 답변 수신 → Gemini가 구체성 평가(루브릭 기반 프롬프트):
  - 충분 → 핵심 한 줄 요약 생성 후 다음 질문
  - 부족 → 재질문 (최대 2회, 이후 다음 질문으로 강제 진행하여 피로 방지)
  - "모르겠다"/회피 → Gemini가 유사 사례 예시를 생성해 구체화 유도
- Gemini API **스트리밍(`generateContentStream`)** 응답을 실제로 사용해 질문/피드백을 토큰 단위로 순차 표시, 대화 체감 속도 확보

**실제 구현 시 필요 요소:**
- `/api/interview/stream` 라우트에서 Route Handler + `ReadableStream`으로 Gemini 스트리밍 응답을 SSE 형태로 클라이언트에 중계
- 활동 카드(Feature 1 결과)를 컨텍스트로 포함한 멀티턴 대화 이력 관리(클라이언트 상태로 유지, 서버는 무상태)

**저장 방식 (v5):**
- 답변 제출 시 클라이언트 상태(Zustand)에 즉시 반영 (자동 저장 UI 동일하게 표시). 서버 DB 영속 저장은 목업 범위이므로, 세션(브라우저) 유지 중에는 이어서 진행 가능하나 완전히 새로고침/재접속 시 초기화될 수 있음
- 인터뷰 상태: `NOT_STARTED` / `IN_PROGRESS` / `COMPLETED`

**Acceptance Criteria (v5 기준):**
- [ ] Gemini가 활동 카드 내용에 맞춰 실제로 생성한 질문이 스트리밍으로 순차 표시된다
- [ ] "모르겠다" 입력 시 Gemini가 생성한 예시 포함 재질문이 노출된다
- [ ] 마지막 문항 완료 시 "인터뷰 완료" 상태로 전환되고 활동 카드에 표시된다

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
- AI 부분 재작성: 문단 선택 → "더 간결하게 / 성과 강조 / 직무 키워드 반영" 리라이트를 Gemini API에 실제로 요청해 재작성 결과로 치환
- 버전 이력: 초안 생성 시점 스냅샷을 클라이언트 상태에 저장, 되돌리기 지원 (서버 영속 저장은 목업 범위)

**실제 구현 방식 (v5):** 직무를 선택하면 활동 카드+인터뷰 Q&A(모두 실제 Gemini 결과물)를 컨텍스트로 `/api/portfolio/generate`가 Gemini API를 호출해 직무별 문체·구성으로 포트폴리오 초안을 **실제로 생성**한다. 블록 편집·드래그 순서 변경 UI는 그대로 동작하며, 편집 결과는 클라이언트 상태에만 반영(서버 저장 X).

**실제 구현 시 필요 요소:**
- 직무별 스타일 가이드(어휘·구성 템플릿)를 시스템 프롬프트로 관리, "사용자의 실제 답변만 근거로 사용"하도록 프롬프트에 명시해 환각 방지
- 초안 생성은 비스트리밍(`generateContent`)으로 처리 후 블록 JSON으로 파싱해 에디터에 로드

**예외 처리 (v5):**
- 인터뷰 미완료 활동 → 초안에서 제외하거나 "정보 보완 필요" 경고 배지 표시 (사용자 선택)
- 활동 데이터 부족(카드 1개 미만) → 생성 차단 + 활동 등록 유도
- Gemini 응답이 기대 블록 스키마와 불일치 → 재시도 후 실패 시 안내 메시지 + 수동 작성 유도

**Acceptance Criteria (v5 기준):**
- [ ] 직무 선택 후 Gemini가 실제 활동/인터뷰 데이터를 반영해 생성한 초안이 화면에 표시된다
- [ ] 미완료 인터뷰 활동에 경고 배지가 표시되고, 클릭 시 인터뷰 화면으로 이동한다
- [ ] 블록 순서 변경·문단 편집·AI 부분 재작성이 실제 Gemini 응답으로 동작한다

---

### Feature 4. 또래(동일 연령대) 포트폴리오 비교 분석

**목적:** 나와 비슷한 나이대·직무를 지원하는 또래 사용자들의 포트폴리오(익명화)와 비교해 벤치마킹 인사이트 제공.

| 항목 | 명세 |
|---|---|
| 입력 | 사용자 출생연도/나이 + 지원 직무 + 사용자 포트폴리오 초안 |
| 데이터 소스 | 플랫폼 내 동의 기반 익명화 또래 포트폴리오 DB (동일·인접 연령대 사용자, 예: ±2세) |
| 출력 | ① 또래 그룹 내 공통 패턴 요약 ② 갭 분석 리포트 ③ 개선 제안 리스트 |

**처리 과정 (v5: AI 호출은 실제, 또래 데이터는 목업):**
1. 실 사용자 또래 DB·임베딩 검색은 아직 없으므로, 연령대·직무군별로 사전에 준비한 **익명화 샘플 포트폴리오 데이터셋**(`src/mock/peer-dataset.ts`)에서 사용자와 같은/인접 연령대(±2세) & 동일·유사 직무군 샘플을 필터링
2. 필터링된 샘플 데이터를 컨텍스트로 Gemini API에 전달 → 공통 패턴(강조 활동 유형, 성과 표현 방식, 구성 순서)을 **실제로** 요약·추출 (사전 작성된 고정 텍스트가 아니라 매 요청마다 Gemini가 생성)
3. 사용자의 실제 포트폴리오(Feature 3 결과)와 Gemini가 추출한 또래 패턴을 함께 프롬프트에 넣어 갭 스코어링·개선 제안을 Gemini가 생성
4. 차이점·개선 포인트 시각화 (레이더 차트, 항목별 체크리스트) — 차트 수치는 Gemini 응답을 구조화된 JSON으로 받아 렌더링

**실제 구현 방식 (v5):** 또래 원본 DB·pgvector 임베딩 검색은 목업 데이터셋으로 대체하지만, 그 위에서 실행되는 패턴 요약·갭 분석·개선 제안은 매번 Gemini API를 실제로 호출해 생성한다(같은 조건이라도 표현이 조금씩 달라질 수 있음). "표본 부족" 폴백은 목업 데이터셋에 해당 조합 샘플이 없을 때 실제로 발생하도록 구성한다.

**예외 처리 (설계안):**
- 해당 연령대·직무 조합 표본 부족(예: n < 10) → 연령대 범위 확장(±2세 → ±4세) 또는 유사 직무군 확장 비교, 그래도 부족 시 "데이터 부족" 안내 + 일반 가이드 제공

**개인정보 보호 (설계안 – 실 데이터 미보유):**
- 비교 DB의 모든 사례는 이름·소속·사진 등 식별 정보 제거 후 저장, 나이는 연령대 구간으로만 저장(정확한 생년월일 비저장)
- 사용자 포트폴리오는 명시적 opt-in 동의 없이는 비교 DB에 축적되지 않음
- 동의 철회 시 30일 이내 DB에서 삭제

**Acceptance Criteria (v5 기준):**
- [ ] 나이대·직무를 선택하면 Gemini가 실제로 생성한 갭 분석 리포트(레이더 차트 + 체크리스트)가 표시된다
- [ ] 목업 데이터셋에 해당 조합 샘플이 부족한 경우 "또래 데이터 부족" 폴백 화면이 노출된다
- [ ] 개선 제안이 최소 3개 이상 Gemini 응답으로 노출된다

---

## 4. 기술 아키텍처 (v5: AI·파일 스토리지 실구현 기준)

> 이 장은 v5 기준 실제 구현 범위를 반영합니다. **AI(Gemini API)와 파일 스토리지(Google Drive)는 실제로 연동**하며, 인증·DB·벡터 검색·비동기 잡 큐는 여전히 목업/미구현입니다.

### 4.1 기술 스택

| 레이어 | 선택 | 비고 | v5 적용 여부 |
|---|---|---|---|
| 프레임워크 | Next.js 15 (App Router) + TypeScript | 풀스택 (RSC + Server Actions + Route Handlers) | ✅ 사용 |
| UI | Tailwind CSS + shadcn/ui | 블록 에디터는 Tiptap | ✅ 사용 |
| 상태 관리 | TanStack Query + Zustand | 서버 상태(Gemini/Drive 호출) / 클라이언트 UI 상태 분리 | ✅ 사용 (실제 API 호출 연동) |
| 인증 | Auth.js (NextAuth v5) | 이메일 + 카카오/구글 OAuth | ❌ 미구현 (완전 목업 로그인 버튼, v5에서도 유지) |
| DB | PostgreSQL + Prisma ORM | 배포: Supabase 또는 Neon | ❌ 미구현 (클라이언트 상태/정적 JSON으로 대체) |
| 벡터 검색 | pgvector | 연령대·직무 유사도 기반 또래 사례 검색 | ❌ 미구현 (Feature 4는 목업 샘플셋 + 단순 필터링으로 대체) |
| 파일 스토리지 | 사용자 Google Drive (Google OAuth `drive.file` scope) | 자체 서버/클라우드에 파일 원본 미보관, 메타데이터(fileId)만 저장 | ✅ **실제 구현** (Google Cloud 프로젝트 필요) |
| AI | Google Gemini API | 구조화(JSON), 인터뷰(streaming), 초안 생성, 비교 분석 | ✅ **실제 구현** (`GEMINI_API_KEY` 필요) |
| 비동기 잡 | Inngest 또는 BullMQ + Redis | 파일 파싱, 카드 생성, 익명화 배치 | ❌ 미구현 (파싱은 API 라우트 내 동기 처리로 대체) |
| 배포 | Vercel | 배포용 (서버 API 라우트에서 Gemini/Drive 호출) | ✅ 사용 |
| 모니터링 | Sentry + Vercel Analytics | API 오류·비용 모니터링 필요성 증가 | △ 최소 로깅만 (Sentry는 선택) |

### 4.2 시스템 구성도 (v5: 실제 구현 범위)

```
[Browser]
   │
   ├─ Google OAuth 동의(drive.file) → [Google 계정 인증 서버] (실제)
   │
   ▼
[Next.js on Vercel]
   ├─ Route Handlers (/api/*)             ← 실제 동작 (Gemini/Drive 호출)
   ├─ Server Actions                       ← 목업 로그인, 클라이언트 상태 저장용
   └─ 인증(Auth.js)/DB(Prisma)             ← 미구현, 클라이언트 상태로 대체
        │
        ├──────────────▶ [사용자 Google Drive] (실제, drive.file scope)
        │                 파일 업로드/읽기, 서버에는 원본 미보관
        │
        └──────────────▶ [Gemini API] (실제)
                          구조화(JSON) / 인터뷰 스트리밍 / 초안 생성 / 비교 분석

※ 잡 큐(Inngest/BullMQ), pgvector, 실 또래 DB는 미구현 —
   파싱은 API 라우트 내 동기 처리, 또래 비교는 목업 샘플셋으로 대체
```

### 4.3 디렉터리 구조 (v5)

```
src/
├─ app/
│  ├─ (auth)/login, signup           # 목업 로그인 화면 (유지)
│  ├─ (dashboard)/
│  │  ├─ activities/                 # Feature 1: 활동 목록·등록 (실제 Drive 업로드 + Gemini 카드 생성)
│  │  │  └─ [id]/interview/          # Feature 2: 인터뷰 화면 (실제 Gemini 스트리밍)
│  │  ├─ portfolio/
│  │  │  ├─ builder/                 # Feature 3: 실제 Gemini 초안 생성·재작성
│  │  │  └─ analysis/                # Feature 4: 실제 Gemini 분석 + 목업 또래 샘플셋
│  │  └─ settings/
│  └─ share/[slug]/                  # 공유 화면 UI만 (실제 링크 발급 X, 목업 유지)
├─ app/api/
│  ├─ google/oauth/callback/         # 실제 OAuth 콜백 처리
│  ├─ activities/                    # 실제 Drive 업로드 결과 수신 + Gemini 구조화 호출
│  ├─ interview/stream/              # 실제 Gemini 스트리밍 SSE 중계
│  ├─ portfolio/generate/            # 실제 Gemini 초안 생성 호출
│  └─ analysis/                      # 실제 Gemini 비교 분석 호출 (입력: 목업 또래 샘플셋)
├─ mock/                             # 여전히 필요한 목업 데이터
│  └─ peer-dataset.ts                # Feature 4용 익명화 또래 샘플 (실 DB 없음)
├─ lib/
│  ├─ google-drive.ts                # Drive API 클라이언트 (실제 사용)
│  ├─ gemini.ts                      # Gemini API 클라이언트 (실제 사용)
│  ├─ parsers/                       # pdf-parse, mammoth, sheetjs 등 (실제 사용)
│  └─ prisma.ts (설계안, 미사용)
└─ components/ (ui/, editor/, charts/)
```

### 4.4 데이터 모델 (설계안 – DB 자체는 여전히 미구현, 아래 형태의 TS 클라이언트 상태 객체로 대체)

> `ActivityFile.googleDriveFileId`·`extractedText` 등은 실제로 Drive API·Gemini 호출 결과에서 나오는 실 데이터이지만, 이를 저장하는 Prisma/PostgreSQL 자체는 v5에서도 구현하지 않습니다. 즉 "값은 진짜, 영속 저장소는 목업"입니다.

```prisma
model User {
  id                String      @id @default(cuid())
  email             String      @unique
  name              String?
  birthYear         Int?        // Feature 4 또래 비교용 출생연도
  targetJob         String?     // 지원 직무
  consentToDb       Boolean     @default(false) // Feature 4 또래 비교 DB 축적 동의
  googleDriveLinked Boolean     @default(false) // 구글 드라이브 연동 여부
  googleRefreshToken String?    @db.Text // OAuth refresh token (암호화 저장)
  activities        Activity[]
  portfolios        Portfolio[]
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
  id                String   @id @default(cuid())
  activityId        String
  googleDriveFileId  String   // 사용자 Drive 내 "CareerFolio" 폴더의 파일 ID (원본은 서버에 미보관)
  fileName          String
  mimeType          String
  sizeBytes         Int
  extractedText     String?  @db.Text // 파싱 시 임시로 읽어 추출한 텍스트만 저장
  parseStatus       String    // PENDING / DONE / FAILED
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

### 4.5 핵심 API 명세 (v5: AI·Drive 관련 엔드포인트는 실제 구현)

| Method | Endpoint | 설명 | v5 구현 상태 |
|---|---|---|---|
| POST | `/api/google/oauth/callback` | Google OAuth 인증 콜백 처리 | ✅ 실제 구현 (refresh token은 서버 DB가 없으므로 세션/쿠키 등 임시 보관 방식 검토 필요) |
| POST | `/api/activities` | Drive 업로드 결과(fileId) 수신 + 텍스트 추출 + Gemini 구조화 호출 | ✅ 실제 구현 (응답을 클라이언트 상태에 저장) |
| GET | `/api/activities/:id` | 카드 상태·데이터 조회 | ❌ 미구현 (서버 DB 없음 → 폴링 대신 클라이언트 상태로 즉시 반영, SSE 불필요) |
| POST | `/api/interview/stream` | 인터뷰 질문/피드백 Gemini 스트리밍 SSE 중계 | ✅ 실제 구현 |
| PATCH | `/api/interview/:id/answer` | 답변 저장 | ❌ 미구현 (클라이언트 상태(Zustand)에만 저장, 서버 API 불필요) |
| POST | `/api/portfolio/generate` | 직무 기반 Gemini 초안 생성 | ✅ 실제 구현 |
| PATCH | `/api/portfolio/:id` | 편집 내용 저장 | ❌ 미구현 (클라이언트 상태에만 저장) |
| POST | `/api/analysis` | 목업 또래 샘플셋 + 사용자 포트폴리오로 Gemini 비교 분석 실행 | ✅ 실제 구현 (또래 원본 데이터는 목업) |

### 4.6 AI 프롬프트 설계 원칙 (v5: 실제 사용)
- **구조화(Feature 1):** JSON 스키마 강제 + 필드별 누락 시 `null` 허용, 환각 방지를 위해 "파일에 없는 정보는 추측하지 말 것" 명시
- **인터뷰(Feature 2):** STAR 프레임워크(Situation-Task-Action-Result) 기반 질문 생성, 답변 구체성 평가 루브릭 포함
- **생성(Feature 3):** 직무별 스타일 가이드(어휘·구성 템플릿)를 시스템 프롬프트에 주입, 사용자의 실제 답변만 근거로 사용
- **분석(Feature 4):** 또래(동일 연령대) 사례 원문 노출 금지 — 패턴 요약만 출력하여 타인 포트폴리오 유출 방지

---

## 5. 비기능 요구사항 (v5: AI·Drive 영역은 실질 적용, 나머지는 목표치로 참고)

| 영역 | 요구사항 | v5 적용 여부 |
|---|---|---|
| 성능 | 카드 생성(Gemini 구조화) P90 < 30초, 인터뷰 스트리밍 첫 토큰 < 2초, 초안 생성 P90 < 45초 | ✅ 실측 관리 필요 (Gemini 응답 지연 대비 로딩 UX 필수) |
| 보안 | 파일 원본은 자체 서버에 저장하지 않고 사용자 Google Drive에만 보관, OAuth는 최소 권한(`drive.file`) scope만 요청, `GEMINI_API_KEY`는 서버 환경변수로만 관리(클라이언트 노출 금지), 전 구간 HTTPS | ✅ 실제 적용 |
| 개인정보 | 파일 원본 미보관으로 유출 리스크 최소화, 업로드 파일은 처리 직후 메모리에서 폐기, 구글 연동 해제 시 남아있는 메타데이터(fileId 등) 즉시 삭제 안내 | ✅ 실제 적용 (단, 서버 DB가 없어 "삭제"는 클라이언트 상태 초기화 수준) |
| 가용성 | Gemini API 오류(429/5xx) 시 재시도 + 사용자에게 상태 안내 및 재시도 버튼, Drive 업로드 실패 시 재시도 유도 | ✅ 실제 적용 (DLQ·비동기 잡 큐는 미구현이므로 API 라우트 내 재시도로 대체) |
| 접근성 | WCAG 2.1 AA 준수, 키보드 내비게이션 지원 | △ 목표치 (데모 범위에서 최소 준수) |
| 확장성 | 파싱 워커 수평 확장, DB 커넥션 풀링 | ❌ 해당 없음 (DB·워커 자체 미구현) |
| 비용 관리 | Gemini API 호출 비용 모니터링, 파일당/사용자당 호출 횟수 상한(rate limit) 권장 | ✅ 실제 적용 필요 (실 API 과금 발생) |

**v5 기준 실질 요구사항:** 데스크톱 기준 주요 브라우저(Chrome)에서 4개 Feature 화면이 끊김 없이 전환되고, Google OAuth 동의·Drive 업로드·Gemini 응답이 실제로 정상 동작하며, API 실패 시에도 화면이 깨지지 않고 재시도/수동입력 경로로 복구되면 충분함.

---

## 6. 진행 로드맵 (v5: 2주 일정으로 재조정)

> AI(Gemini)·파일 스토리지(Drive)를 실제로 연동하면서, Google Cloud/OAuth 설정, API 클라이언트 구현, 프롬프트 튜닝, 에러 핸들링에 추가 시간이 필요해 기존 1주에서 **2주**로 재조정했습니다. 로그인·DB·또래 원본 데이터는 여전히 목업이라 해당 작업량은 그대로입니다.

| Day | 목표 | 산출물 |
|---|---|---|
| Day 1 (월) | 요구사항 정리, Google Cloud 프로젝트 생성(OAuth 동의화면·Drive API 활성화), Gemini API 키 발급, 목업 또래 샘플셋 설계 | PRD 확정, API 키/OAuth 설정 완료 |
| Day 2 (화) | 와이어프레임/디자인 시스템 셋업, `lib/google-drive.ts`·`lib/gemini.ts` 클라이언트 기본 구현 | 공통 인프라 코드 |
| Day 3 (수) | Feature 1: 실제 Drive OAuth 동의 + 업로드 플로우 구현 | Drive 연동 완료 |
| Day 4 (목) | Feature 1: 파일 파싱(pdf-parse/mammoth/sheetjs) + Gemini 구조화 JSON 연동, 활동 카드 화면 | 활동 등록 화면 (실 데이터) |
| Day 5 (금) | Feature 2: `/api/interview/stream` SSE + Gemini 스트리밍 연동, 인터뷰 화면 | 인터뷰 화면 (실 스트리밍) |
| Day 6 (토) | Feature 2 마무리(재질문/피로도 로직) + Feature 3 초안 생성(`/api/portfolio/generate`) 연동 시작 | 인터뷰 완성, 빌더 초안 연동 |
| Day 7 (일) | Feature 3: 블록 에디터 + AI 부분 재작성 연동, 버전 이력 UI | 빌더 화면 완성 |
| Day 8 (월) | Feature 4: 목업 또래 샘플셋 필터링 로직 + Gemini 비교 분석 프롬프트 구현 | 비교 분석 화면 (실 AI 응답) |
| Day 9 (화) | Feature 4 마무리(레이더 차트·폴백 화면) + 전체 API 에러 핸들링(재시도/수동입력 유도) 점검 | 에러 처리 통합 |
| Day 10 (수) | 전체 플로우 연결(대시보드→인터뷰→빌더→분석→공유), 반응형/디테일 다듬기 | 통합 빌드 |
| Day 11 (목) | Gemini 프롬프트 품질 튜닝(구체성 평가, 환각 방지 문구 등), 실사용 시나리오 QA | 프롬프트 개선판 |
| Day 12 (금) | API 비용/rate limit 점검, OAuth 재동의·토큰 만료 등 예외 케이스 테스트 | 예외 케이스 보강 |
| Day 13 (토) | 버그 픽스, 시연 시나리오 스크립트 작성 | 시연 스크립트 |
| Day 14 (일) | 최종 리허설, 발표 자료 정리 | 최종 데모 빌드 |

---

## 7. 리스크 및 대응 (v5: AI·Drive 실연동 기준)

| 리스크 | 영향 | 대응 |
|---|---|---|
| Gemini API 응답 지연/불안정(429, 5xx, 타임아웃) | 카드 생성·인터뷰·초안 생성이 멈추거나 느려 보임 | 지수 백오프 재시도(최대 3회), 스켈레톤/로딩 UI로 체감 대기시간 완화, 실패 시 수동 입력 경로 제공 |
| Gemini 구조화 결과가 스키마와 불일치하거나 환각 발생 | 잘못된 활동 카드/초안 생성 | `responseSchema` 강제 + "파일에 없는 정보는 추측 금지" 프롬프트, 스키마 검증 실패 시 재시도 후 수동 입력 유도 |
| Google OAuth 동의 화면이 "테스트 앱" 경고로 표시될 수 있음(앱 미검수 상태) | 사용자가 연동을 꺼릴 수 있음 | 테스트 사용자 목록에 데모 참여자 등록, 검수 없이도 진행 가능함을 시연 전 안내 |
| Drive 업로드/다운로드 중 네트워크 오류 | 파일 손실 또는 파싱 실패로 보임 | resumable upload 사용, 실패 시 재시도 버튼 및 명확한 오류 메시지 |
| Gemini API 실 사용 비용 발생 (호출량 예측 어려움) | 데모/개발 중 예상 밖 비용 | 사용자당/파일당 호출 횟수 상한 설정, 개발 단계에서 요청 로깅으로 비용 추적 |
| 2주라는 기간 내 AI+Drive 실연동 포함 4개 Feature 전부 구현 | 일부 화면·프롬프트 품질 저하 위험 | Day 1~2에 인프라(OAuth/API 키/클라이언트)부터 확정, Feature별 타임박스 준수, Day 11~12를 품질 튜닝·예외 케이스 전용으로 확보 |
| 또래 비교(Feature 4) 데이터가 여전히 목업 샘플셋이라, Gemini가 실제 존재하지 않는 "또래"처럼 느껴지게 응답할 위험 | 사용자에게 실제 데이터로 오인될 소지 | 화면에 "베타/샘플 데이터 기반 분석" 안내 문구 표시, 목업 샘플셋임을 8장 Out of Scope에도 명시 |
| 민감 개인정보(연령 등) 입력 UI 관련 오해 | 실제 서버 DB에 영구 저장되는 것으로 오인될 수 있음 | 화면에 "입력값은 서버에 영구 저장되지 않으며 세션 내에서만 사용됨" 안내 문구 표시 |
| 사용자 Google 계정 연동 실패/권한 철회 시 파일 접근 불가 | 활동 카드가 원본 파일에 접근하지 못해 기능 이용 중단 | 연동 해제 감지 시 안내 배너 노출 + 재연동 유도, 이미 구조화된 메타데이터(요약/키워드)는 클라이언트 상태에 별도 보존해 일부 기능은 유지 |

---

## 8. Out of Scope (v5 제외 범위)
- 실제 회원가입/로그인(OAuth 등) 및 사용자 데이터 영속 저장 — 여전히 목업 로그인
- 실제 DB(PostgreSQL/Prisma) 구축 — 활동/인터뷰/포트폴리오는 클라이언트 상태로만 유지
- 실제 또래 비교 DB 구축 및 pgvector 기반 임베딩 검색 — 사전 준비한 목업 샘플셋으로 대체 (Gemini 분석 자체는 실제 호출)
- 비동기 잡 큐(Inngest/BullMQ) 및 파싱 워커 수평 확장 — API 라우트 내 동기 처리로 대체
- 실제 파일 링크 발급(내보내기/공유 링크) — 화면 UI만 제공
- 기업 채용 담당자용 열람 서비스
- 다국어 포트폴리오 생성
- 모바일 네이티브 앱 (반응형 웹으로 대응)
- 실시간 협업 편집
- Google OAuth 앱 정식 검수(프로덕션 게시) — 테스트 사용자 등록 방식으로 데모 진행

> ~~실제 AI API(Gemini) 연동~~, ~~실제 Google Drive 연동~~은 v5부터 **In Scope로 전환**되어 위 목록에서 제외되었습니다.
