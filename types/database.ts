export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string;
          host_spotify_id: string;
          host_email: string | null;
          playlist_id: string;
          playlist_name: string;
          playlist_image_url: string | null;
          game_code: string;
          status: 'waiting' | 'playing' | 'finished';
          grid_size: 4 | 5;
          pre_marked_count: number;
          host_device_id: string | null;
          winner_player_index: number | null;
          created_at: string;
          started_at: string | null;
          ended_at: string | null;
          tracks: unknown;
        };
        Insert: {
          id?: string;
          host_spotify_id: string;
          host_email?: string | null;
          playlist_id: string;
          playlist_name: string;
          playlist_image_url?: string | null;
          game_code: string;
          status?: 'waiting' | 'playing' | 'finished';
          grid_size: 4 | 5;
          pre_marked_count?: number;
          host_device_id?: string | null;
          winner_player_index?: number | null;
          created_at?: string;
          started_at?: string | null;
          ended_at?: string | null;
          tracks?: unknown;
        };
        Update: {
          status?: 'waiting' | 'playing' | 'finished';
          winner_player_index?: number | null;
          started_at?: string | null;
          ended_at?: string | null;
        };
      };
      players: {
        Row: {
          id: number;
          game_id: string;
          player_index: number;
          name: string;
          spotify_id: string | null;
          email: string | null;
          joined_at: string;
        };
        Insert: {
          id?: number;
          game_id: string;
          player_index: number;
          name: string;
          spotify_id?: string | null;
          email?: string | null;
          joined_at?: string;
        };
        Update: {
          name?: string;
        };
      };
      drawn_songs: {
        Row: {
          id: number;
          game_id: string;
          song_id: string;
          draw_order: number;
          drawn_at: string;
        };
        Insert: {
          id?: number;
          game_id: string;
          song_id: string;
          draw_order: number;
          drawn_at?: string;
        };
        Update: Record<string, never>;
      };
    };
  };
}
