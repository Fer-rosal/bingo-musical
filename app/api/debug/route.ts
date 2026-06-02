import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI,
    app_url: process.env.NEXT_PUBLIC_APP_URL,
    node_env: process.env.NODE_ENV,
    cookies: Object.fromEntries(request.cookies),
  })
}
