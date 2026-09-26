-- Profiles: 1:1 with auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Posts: a song shared to the feed. Track metadata is denormalized so the
-- feed never needs to re-fetch Spotify.
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  spotify_track_id text not null,
  track_name text not null,
  artist_name text not null,
  album_name text not null,
  album_art_url text,
  spotify_url text,
  created_at timestamptz not null default now()
);
create index posts_created_at_idx on posts (created_at desc);
create index posts_user_id_idx on posts (user_id);

-- Ratings: one rating per user per post, 1-10. Client upserts on
-- (post_id, user_id) so re-rating updates rather than duplicates.
create table ratings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  score smallint not null check (score between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create index ratings_post_id_idx on ratings (post_id);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index comments_post_id_idx on comments (post_id);

-- Feed view: aggregates author name, avg rating, and counts in one query
-- so the feed screen avoids N+1 lookups.
create view feed_posts as
select
  p.*,
  pr.display_name as author_name,
  coalesce(avg(r.score), 0)::numeric(4, 2) as avg_rating,
  count(distinct r.id) as rating_count,
  count(distinct c.id) as comment_count
from posts p
join profiles pr on pr.id = p.user_id
left join ratings r on r.post_id = p.id
left join comments c on c.post_id = p.id
group by p.id, pr.display_name
order by p.created_at desc;

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: any authenticated user (i.e. any logged-in friend)
-- can read everything; users can only write/edit/delete their own rows.
-- No anonymous access at all.
alter table profiles enable row level security;
alter table posts enable row level security;
alter table ratings enable row level security;
alter table comments enable row level security;

create policy "profiles are readable by authenticated users"
  on profiles for select
  using (auth.role() = 'authenticated');
create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "posts are readable by authenticated users"
  on posts for select
  using (auth.role() = 'authenticated');
create policy "users can insert their own posts"
  on posts for insert
  with check (auth.uid() = user_id);
create policy "users can update their own posts"
  on posts for update
  using (auth.uid() = user_id);
create policy "users can delete their own posts"
  on posts for delete
  using (auth.uid() = user_id);

create policy "ratings are readable by authenticated users"
  on ratings for select
  using (auth.role() = 'authenticated');
create policy "users can insert their own ratings"
  on ratings for insert
  with check (auth.uid() = user_id);
create policy "users can update their own ratings"
  on ratings for update
  using (auth.uid() = user_id);
create policy "users can delete their own ratings"
  on ratings for delete
  using (auth.uid() = user_id);

create policy "comments are readable by authenticated users"
  on comments for select
  using (auth.role() = 'authenticated');
create policy "users can insert their own comments"
  on comments for insert
  with check (auth.uid() = user_id);
create policy "users can update their own comments"
  on comments for update
  using (auth.uid() = user_id);
create policy "users can delete their own comments"
  on comments for delete
  using (auth.uid() = user_id);
