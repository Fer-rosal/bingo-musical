create table games (
  id                  uuid primary key default gen_random_uuid(),
  host_spotify_id     text not null,
  host_email          text,
  playlist_id         text not null,
  playlist_name       text not null,
  playlist_image_url  text,
  game_code           text not null unique,
  status              text not null default 'waiting'
                        check (status in ('waiting', 'playing', 'finished')),
  grid_size           smallint not null check (grid_size in (4, 5)),
  pre_marked_count    smallint not null default 0,
  host_device_id      text,
  winner_player_index int,
  created_at          timestamptz not null default now(),
  started_at          timestamptz,
  ended_at            timestamptz
);

create table players (
  id            serial primary key,
  game_id       uuid not null references games(id) on delete cascade,
  player_index  int not null,
  name          text not null,
  spotify_id    text,
  email         text,
  joined_at     timestamptz not null default now(),
  unique (game_id, player_index)
);

create table drawn_songs (
  id          serial primary key,
  game_id     uuid not null references games(id) on delete cascade,
  song_id     text not null,
  draw_order  int not null,
  drawn_at    timestamptz not null default now(),
  unique (game_id, song_id),
  unique (game_id, draw_order)
);

create index on games (game_code) where status != 'finished';
create index on players (game_id);
create index on drawn_songs (game_id, draw_order);
