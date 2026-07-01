alter table games add column tracks jsonb not null default '[]'::jsonb;
