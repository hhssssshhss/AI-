import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/google-drive';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided by Google.' }, { status: 400 });
  }

  try {
    // 코드를 사용해 토큰(액세스 토큰, 리프레시 토큰 등) 발급
    const tokens = await getTokens(code);
    
    // PRD에 명시된 대로 실제 DB 영속화는 목업이므로 
    // 발급받은 토큰을 HttpOnly 쿠키에 저장하여 세션 유지
    const cookieStore = await cookies();
    cookieStore.set('google_oauth_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7일 유지
    });

    // 구글 연동 완료 후 대시보드 내 활동 등록 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/dashboard/activities', request.url));
  } catch (error: any) {
    console.error('Google OAuth Callback Error:', error);
    return NextResponse.json({ error: 'Failed to exchange authorization code for tokens.', details: error.message }, { status: 500 });
  }
}
