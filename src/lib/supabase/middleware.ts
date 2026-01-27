import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  // In demo mode, we don't use server-side auth
  // Auth is handled client-side via Zustand store
  // This middleware just allows all requests through

  return response;
}

