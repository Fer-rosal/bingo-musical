import { NextRequest, NextResponse } from 'next/server';
import { getPlayerGames } from '@/lib/db/gameSession';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('spotify_access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const spotifyRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!spotifyRes.ok) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const me = await spotifyRes.json();

    const games = await getPlayerGames(me.id);
    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error fetching player games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}
