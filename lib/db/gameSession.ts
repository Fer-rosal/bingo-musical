import { getDb } from '@/lib/supabase';
import { GameSession, GamePlayer, OnlineGameConfig } from '@/types/online';
import { generateGameCode } from '@/lib/gameCode';
import type { Database } from '@/types/database';

type GameRow = Database['public']['Tables']['games']['Row'];
type PlayerRow = Database['public']['Tables']['players']['Row'];
type DrawnSongRow = Database['public']['Tables']['drawn_songs']['Row'];

// ── helpers ──────────────────────────────────────────────────────────────────

function rowToSession(
  row: GameRow,
  players: GamePlayer[],
  drawnSongIds: string[],
): GameSession {
  return {
    id: row.id,
    hostSpotifyId: row.host_spotify_id,
    hostEmail: row.host_email ?? undefined,
    playlistId: row.playlist_id,
    playlistName: row.playlist_name,
    playlistImageUrl: row.playlist_image_url ?? undefined,
    gameCode: row.game_code,
    status: row.status,
    gridSize: row.grid_size,
    playerCount: players.length,
    preMarkedCount: row.pre_marked_count,
    drawnSongIds,
    players,
    createdAt: new Date(row.created_at).getTime(),
    startedAt: row.started_at ? new Date(row.started_at).getTime() : undefined,
    endedAt: row.ended_at ? new Date(row.ended_at).getTime() : undefined,
    hostDeviceId: row.host_device_id ?? undefined,
    winnerPlayerIndex: row.winner_player_index ?? undefined,
  };
}

async function fetchPlayers(gameId: string): Promise<GamePlayer[]> {
  const { data, error } = await getDb()
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .order('player_index');
  if (error) throw error;
  return ((data ?? []) as PlayerRow[]).map((r) => ({
    index: r.player_index,
    name: r.name,
    spotifyId: r.spotify_id ?? undefined,
    email: r.email ?? undefined,
    joinedAt: new Date(r.joined_at).getTime(),
  }));
}

async function fetchDrawnSongIds(gameId: string): Promise<string[]> {
  const { data, error } = await getDb()
    .from('drawn_songs')
    .select('song_id')
    .eq('game_id', gameId)
    .order('draw_order');
  if (error) throw error;
  return ((data ?? []) as Pick<DrawnSongRow, 'song_id'>[]).map((r) => r.song_id);
}

// ── public API (same shape as before) ────────────────────────────────────────

export async function createGameSession(
  hostSpotifyId: string,
  hostEmail: string,
  playlistId: string,
  playlistName: string,
  playlistImageUrl: string | undefined,
  config: OnlineGameConfig,
  hostDeviceId?: string,
): Promise<GameSession> {
  if (!hostSpotifyId) throw new Error('hostSpotifyId is required');
  if (!playlistId) throw new Error('playlistId is required');

  const gameCode = generateGameCode();

  const { data, error } = await getDb()
    .from('games')
    .insert({
      host_spotify_id: hostSpotifyId,
      host_email: hostEmail || null,
      playlist_id: playlistId,
      playlist_name: playlistName,
      playlist_image_url: playlistImageUrl ?? null,
      game_code: gameCode,
      status: 'waiting',
      grid_size: config.gridSize,
      pre_marked_count: config.preMarkedCount,
      host_device_id: hostDeviceId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToSession(data, [], []);
}

export async function getGameSessionById(gameId: string): Promise<GameSession | null> {
  const { data, error } = await getDb()
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (error || !data) return null;
  const row = data as unknown as GameRow;

  const [players, drawnSongIds] = await Promise.all([
    fetchPlayers(gameId),
    fetchDrawnSongIds(gameId),
  ]);

  return rowToSession(row, players, drawnSongIds);
}

export async function getGameSessionByCode(gameCode: string): Promise<GameSession | null> {
  const { data, error } = await getDb()
    .from('games')
    .select('*')
    .eq('game_code', gameCode)
    .neq('status', 'finished')
    .single();

  if (error || !data) return null;
  const row = data as unknown as GameRow;

  const [players, drawnSongIds] = await Promise.all([
    fetchPlayers(row.id),
    fetchDrawnSongIds(row.id),
  ]);

  return rowToSession(row, players, drawnSongIds);
}

export async function addPlayerToGame(
  gameId: string,
  playerName: string,
  spotifyId?: string,
  email?: string,
): Promise<number> {
  const db = getDb();

  // Count existing players to derive next index
  const { count, error: countError } = await db
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId);

  if (countError) throw countError;
  const playerIndex = count ?? 0;

  const { error } = await db.from('players').insert({
    game_id: gameId,
    player_index: playerIndex,
    name: playerName,
    spotify_id: spotifyId ?? null,
    email: email ?? null,
  });

  if (error) throw error;
  return playerIndex;
}

export async function updateGameStatus(
  gameId: string,
  status: 'waiting' | 'playing' | 'finished',
): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (status === 'playing') update.started_at = new Date().toISOString();
  else if (status === 'finished') update.ended_at = new Date().toISOString();

  const { error } = await getDb().from('games').update(update).eq('id', gameId);
  if (error) throw error;
}

export async function addDrawnSong(gameId: string, songId: string): Promise<void> {
  const db = getDb();

  const { count, error: countError } = await db
    .from('drawn_songs')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId);

  if (countError) throw countError;

  // Ignore if already drawn (idempotent)
  const { error } = await db.from('drawn_songs').upsert(
    { game_id: gameId, song_id: songId, draw_order: count ?? 0 },
    { onConflict: 'game_id,song_id' },
  );

  if (error) throw error;
}

export async function confirmWinner(gameId: string, playerIndex: number): Promise<void> {
  const { error } = await getDb()
    .from('games')
    .update({
      status: 'finished',
      winner_player_index: playerIndex >= 0 ? playerIndex : null,
      ended_at: new Date().toISOString(),
    })
    .eq('id', gameId);

  if (error) throw error;
}

export async function getPlayerGames(spotifyId: string): Promise<GameSession[]> {
  const { data, error } = await getDb()
    .from('games')
    .select('*')
    .eq('host_spotify_id', spotifyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  return Promise.all(
    (data as GameRow[]).map(async (row) => {
      const [players, drawnSongIds] = await Promise.all([
        fetchPlayers(row.id),
        fetchDrawnSongIds(row.id),
      ]);
      return rowToSession(row, players, drawnSongIds);
    }),
  );
}
