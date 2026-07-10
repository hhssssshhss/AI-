// Feature 4: 익명화 또래 포트폴리오 샘플 데이터셋 (peer-dataset.ts)
// 실 사용자 DB 없음 — 사전 준비한 목업 데이터셋으로 대체 (PRD v5 4.1 명세)

export interface PeerCase {
  id: string;
  ageGroup: number;      // 만 나이 기준 그룹 값
  jobFamily: string;     // 직무 군 (marketing, dev, data, planning, design)
  title: string;
  intro: string;
  activities: {
    title: string;
    role: string;
    keywords: string[];
    highlights: string[];
  }[];
  summary: string;
}

export const peerDataset: PeerCase[] = [
  // ── 마케팅 ── 23세
  {
    id: "peer-001",
    ageGroup: 23,
    jobFamily: "marketing",
    title: "브랜드 마케터 지원 포트폴리오",
    intro: "대학교 3학년 재학 중 소비재 스타트업에서 SNS 운영 및 콘텐츠 마케팅 업무를 담당했습니다.",
    activities: [
      {
        title: "스타트업 SNS 마케팅 인턴십",
        role: "콘텐츠 기획 및 인스타그램 운영",
        keywords: ["인스타그램", "콘텐츠 마케팅", "팔로워 성장"],
        highlights: ["3개월 만에 팔로워 120% 성장", "월평균 도달 수 15만 달성"],
      },
      {
        title: "교내 마케팅 학회 공모전 참가",
        role: "팀장 / 전략 수립",
        keywords: ["시장분석", "브랜드전략", "발표"],
        highlights: ["전국 공모전 장려상 수상", "5개 대학 중 유일 기업 제안 채택"],
      },
    ],
    summary: "SNS 운영과 콘텐츠 기획을 중심으로 실질적인 성과를 경험했습니다.",
  },
  // ── 마케팅 ── 25세
  {
    id: "peer-002",
    ageGroup: 25,
    jobFamily: "marketing",
    title: "퍼포먼스 마케터 포트폴리오",
    intro: "광고 대행사에서 GA4·Meta 광고를 운영하며 ROI 중심의 퍼포먼스 마케팅을 경험했습니다.",
    activities: [
      {
        title: "광고 대행사 퍼포먼스 마케팅 인턴",
        role: "Meta/Google 광고 운영 및 리포팅",
        keywords: ["Meta Ads", "Google Ads", "GA4", "ROAS"],
        highlights: ["광고비 20% 절감하며 ROAS 1.8 → 2.4 개선", "월 5천만 원 광고 예산 단독 운영"],
      },
    ],
    summary: "데이터 기반 광고 최적화를 통한 실질적 성과 창출 경험을 보유하고 있습니다.",
  },
  // ── 개발 ── 24세
  {
    id: "peer-003",
    ageGroup: 24,
    jobFamily: "dev",
    title: "프론트엔드 개발자 포트폴리오",
    intro: "React와 TypeScript를 주력으로 사용하며, 사이드 프로젝트와 해커톤을 통해 협업 경험을 쌓았습니다.",
    activities: [
      {
        title: "React 기반 일정 관리 SaaS 사이드 프로젝트",
        role: "프론트엔드 개발 리드",
        keywords: ["React", "TypeScript", "Zustand", "Tailwind CSS"],
        highlights: ["MAU 200명 달성", "코어 웹 바이탈 LCP 2.1s → 0.8s 개선"],
      },
      {
        title: "사내 해커톤 1위",
        role: "팀 리드 / 풀스택 개발",
        keywords: ["해커톤", "Next.js", "협업"],
        highlights: ["24시간 내 MVP 완성 및 발표", "전체 12팀 중 1위"],
      },
    ],
    summary: "사용자 경험을 최우선으로 생각하는 프론트엔드 개발자입니다.",
  },
  // ── 개발 ── 26세
  {
    id: "peer-004",
    ageGroup: 26,
    jobFamily: "dev",
    title: "백엔드 개발자 포트폴리오",
    intro: "Java Spring Boot 기반 백엔드 개발 경험이 있으며, 클라우드 인프라 운영까지 담당했습니다.",
    activities: [
      {
        title: "커머스 스타트업 백엔드 인턴십",
        role: "REST API 설계 및 개발",
        keywords: ["Spring Boot", "PostgreSQL", "AWS", "Docker"],
        highlights: ["주문 처리 API 응답속도 40% 단축", "일 최대 5만 건 트래픽 무장애 처리"],
      },
    ],
    summary: "안정성과 성능을 균형 있게 추구하는 백엔드 엔지니어입니다.",
  },
  // ── 기획 ── 24세
  {
    id: "peer-005",
    ageGroup: 24,
    jobFamily: "planning",
    title: "서비스 기획자 포트폴리오",
    intro: "UX 리서치부터 기능 명세서 작성까지 제품 개발 전 과정을 경험했습니다.",
    activities: [
      {
        title: "핀테크 스타트업 기획 인턴",
        role: "서비스 기획 및 PRD 작성",
        keywords: ["PRD", "UX 리서치", "와이어프레임", "Figma"],
        highlights: ["신규 기능 3건 기획 및 출시", "사용자 인터뷰 20건 진행, 핵심 페인포인트 도출"],
      },
      {
        title: "창업 아이디어 경진대회 수상",
        role: "팀장 / 사업 기획",
        keywords: ["사업계획서", "린 스타트업", "MVP"],
        highlights: ["지역 창업대회 우수상 수상", "투자 관심 IR 2건 진행"],
      },
    ],
    summary: "사용자 중심의 문제 정의부터 해결책 설계까지 일관되게 수행할 수 있습니다.",
  },
  // ── 데이터분석 ── 25세
  {
    id: "peer-006",
    ageGroup: 25,
    jobFamily: "data",
    title: "데이터 분석가 포트폴리오",
    intro: "Python과 SQL을 활용한 데이터 분석 및 비즈니스 인사이트 도출 경험을 보유하고 있습니다.",
    activities: [
      {
        title: "이커머스 데이터 분석 인턴",
        role: "구매 패턴 분석 및 리포팅",
        keywords: ["Python", "SQL", "Tableau", "코호트 분석"],
        highlights: ["재구매율 15% 향상 기여 분석", "월간 데이터 리포트 자동화로 분석 시간 80% 절감"],
      },
    ],
    summary: "데이터에서 액션 가능한 인사이트를 발굴하는 분석가를 목표로 합니다.",
  },
  // ── 디자인 ── 23세
  {
    id: "peer-007",
    ageGroup: 23,
    jobFamily: "design",
    title: "UX/UI 디자이너 포트폴리오",
    intro: "Figma를 기반으로 사용자 여정 지도 설계부터 프로토타입 제작까지 담당한 경험이 있습니다.",
    activities: [
      {
        title: "앱 리디자인 프로젝트 (사이드)",
        role: "UI/UX 디자인 전담",
        keywords: ["Figma", "프로토타입", "사용성 테스트"],
        highlights: ["5명 사용성 테스트 진행 후 태스크 완료율 78% → 95% 개선", "디자인 시스템 구축"],
      },
    ],
    summary: "사용자 경험을 데이터로 검증하며 개선해 나가는 디자이너입니다.",
  },
  // ── 디자인 ── 26세
  {
    id: "peer-008",
    ageGroup: 26,
    jobFamily: "design",
    title: "브랜드 디자이너 포트폴리오",
    intro: "브랜드 아이덴티티 설계부터 마케팅 소재 제작까지 브랜딩 전반을 담당했습니다.",
    activities: [
      {
        title: "스타트업 브랜딩 리뉴얼 프로젝트",
        role: "브랜드 디자인 리드",
        keywords: ["브랜드 아이덴티티", "Illustrator", "Photoshop"],
        highlights: ["브랜드 인지도 설문 결과 긍정 응답 40%p 상승", "리뉴얼 발표 후 SNS 언급량 3배 증가"],
      },
    ],
    summary: "일관된 브랜드 경험을 설계하고 전달하는 디자이너입니다.",
  },
];

/**
 * 나이 그룹(±2세)과 직무군 기반으로 또래 샘플을 필터링합니다.
 */
export const filterPeers = (
  ageGroup: number,
  jobFamily: string,
  range: number = 2
): PeerCase[] => {
  return peerDataset.filter(
    (p) =>
      Math.abs(p.ageGroup - ageGroup) <= range &&
      p.jobFamily === jobFamily
  );
};
