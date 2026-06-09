import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-js';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(accessToken);

    const currentUser = await spotifyApi.getMe();

    return NextResponse.json({
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.display_name,
      image: currentUser.images?.[0]?.url,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: errorMessage },
      { status: 500 }
    );
  }
}
