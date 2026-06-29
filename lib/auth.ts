import { getDb } from '@/lib/supabase';

/**
 * Delete all data associated with a Spotify user (GDPR Right to Erasure).
 * Games they hosted and player records are removed.
 */
export async function deleteUserAccount(spotifyId: string): Promise<void> {
  const db = getDb();

  // Delete games hosted by this user (cascades to players + drawn_songs)
  const { error: gamesError } = await db
    .from('games')
    .delete()
    .eq('host_spotify_id', spotifyId);
  if (gamesError) throw gamesError;

  // Remove player entries where they joined someone else's game
  const { error: playersError } = await db
    .from('players')
    .delete()
    .eq('spotify_id', spotifyId);
  if (playersError) throw playersError;
}
