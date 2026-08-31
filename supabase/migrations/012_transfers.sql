create table if not exists transfers (
  id bigint generated always as identity primary key,
  mode text not null check (mode in ('boat', 'plane')),
  label text not null,
  from_lat double precision not null,
  from_lng double precision not null,
  to_lat double precision not null,
  to_lng double precision not null,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);
