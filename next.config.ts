import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 서버 전용 네이티브 모듈 — 빌드 타임에 번들링하지 않고 런타임에 require()로 로드
  serverExternalPackages: [
    "pdf-parse",
    "mammoth",
    "xlsx",
    "googleapis",
    "jszip",
  ],
};

export default nextConfig;
