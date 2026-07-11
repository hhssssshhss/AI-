import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-drive';

export async function GET() {
  // 구글 OAuth 로그인 화면(동의 화면) URL 생성
  const url = getAuthUrl();
  
  // 사용자를 해당 구글 로그인 페이지로 리다이렉트
  return NextResponse.redirect(url);
}
