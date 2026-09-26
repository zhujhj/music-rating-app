-- Username+password auth generates a synthetic email like
-- "<username>@musicratingapp.internal" under the hood (Supabase Auth always
-- needs an email). Prefer the raw username passed in signup metadata for
-- display_name so casing is preserved, falling back to the email prefix.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;
