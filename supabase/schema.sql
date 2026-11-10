-- =====================================================================
--  Wedding invitation database — run once in Supabase → SQL Editor.
--  Guests can NEVER read the table directly. They can only:
--    • get_invite(code)  → their own name / party size / RSVP
--    • submit_rsvp(...)  → update their own RSVP
--    • submit_open_rsvp(...) → reply without a personal link (saved as "Website RSVP")
--  Only emails listed in public.admins (and logged in) can manage guests.
-- =====================================================================

-- ---------- Invite code generator (10 chars, no look-alike letters) ----------
create or replace function public.gen_invite_code()
returns text language plpgsql volatile as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  b bytea := uuid_send(gen_random_uuid());   -- 16 cryptographically random bytes
  result text := '';
begin
  for i in 0..9 loop
    result := result || substr(alphabet, (get_byte(b, i) % length(alphabet)) + 1, 1);
  end loop;
  return result;
end $$;

-- ---------- Tables ----------
create table if not exists public.guests (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique default public.gen_invite_code(),
  display_name     text not null check (char_length(display_name) between 1 and 120),
  invite_type      text not null default 'full' check (invite_type in ('full','reception')),
  max_guests       int  not null default 1 check (max_guests between 1 and 20),
  side             text,                -- Bride / Groom / Both
  tag              text,                -- Family, Office, School…
  phone            text,                -- for WhatsApp, e.g. 94771234567
  notes            text,
  opened_count     int  not null default 0,
  first_opened_at  timestamptz,
  last_opened_at   timestamptz,
  rsvp_name        text,                -- full name typed on the RSVP form
  rsvp_status      text not null default 'pending'
                   check (rsvp_status in ('pending','attending','declined')),
  rsvp_count       int,
  rsvp_names       text,
  rsvp_message     text,
  rsvp_at          timestamptz,
  created_at       timestamptz not null default now()
);

-- (If you already created the table earlier, this adds the new column safely.)
alter table public.guests add column if not exists invite_type text not null default 'full'
  check (invite_type in ('full','reception'));

alter table public.guests add column if not exists rsvp_name text;

create table if not exists public.admins (
  email text primary key
);

-- ---------- Security ----------
alter table public.guests enable row level security;
alter table public.admins enable row level security;

revoke all on public.guests from anon;
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

drop policy if exists guests_admin_all on public.guests;
create policy guests_admin_all on public.guests
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Public functions used by the invitation page ----------
create or replace function public.get_invite(p_code text, p_track boolean default true)
returns json language plpgsql security definer set search_path = public as $$
declare g public.guests;
begin
  if p_track then
    update public.guests
       set opened_count    = opened_count + 1,
           first_opened_at = coalesce(first_opened_at, now()),
           last_opened_at  = now()
     where code = upper(trim(p_code))
     returning * into g;
  else
    select * into g from public.guests where code = upper(trim(p_code));
  end if;

  if g.id is null then return null; end if;

  return json_build_object(
    'name',         g.display_name,
    'invite_type',  g.invite_type,
    'max_guests',   g.max_guests,
    'rsvp_name',    g.rsvp_name,
    'rsvp_status',  g.rsvp_status,
    'rsvp_count',   g.rsvp_count,
    'rsvp_names',   g.rsvp_names,
    'rsvp_message', g.rsvp_message
  );
end $$;

drop function if exists public.submit_rsvp(text, boolean, int, text, text);

-- Reply from a guest with a personal link
create or replace function public.submit_rsvp(
  p_code text, p_name text, p_attending boolean, p_count int, p_names text
) returns json language plpgsql security definer set search_path = public as $$
declare g public.guests;
begin
  select * into g from public.guests where code = upper(trim(p_code));
  if g.id is null then
    return json_build_object('ok', false, 'error', 'Invitation not found');
  end if;
  if p_attending and (p_count is null or p_count < 1 or p_count > g.max_guests) then
    return json_build_object('ok', false, 'error', 'Invalid party size');
  end if;

  update public.guests set
    rsvp_name    = left(nullif(trim(p_name), ''), 120),
    rsvp_status  = case when p_attending then 'attending' else 'declined' end,
    rsvp_count   = case when p_attending then p_count else 0 end,
    rsvp_names   = left(coalesce(p_names, ''), 500),
    rsvp_at      = now()
  where id = g.id;
  return json_build_object('ok', true);
end $$;

-- Reply from someone who opened the site WITHOUT a personal link.
-- Saved as a new reception-only row tagged 'Website RSVP' for the couple to review.
create or replace function public.submit_open_rsvp(
  p_name text, p_attending boolean, p_count int, p_names text
) returns json language plpgsql security definer set search_path = public as $$
declare n text := left(nullif(trim(p_name), ''), 120);
begin
  if n is null then return json_build_object('ok', false, 'error', 'Name required'); end if;
  if p_attending and (p_count is null or p_count < 1 or p_count > 3) then
    return json_build_object('ok', false, 'error', 'Invalid party size');
  end if;
  -- simple flood guard: max 200 open replies in total
  if (select count(*) from public.guests where tag = 'Website RSVP') >= 200 then
    return json_build_object('ok', false, 'error', 'Closed');
  end if;
  insert into public.guests (display_name, rsvp_name, invite_type, max_guests, tag,
                             rsvp_status, rsvp_count, rsvp_names, rsvp_at)
  values (n, n, 'reception', greatest(coalesce(p_count, 1), 1), 'Website RSVP',
          case when p_attending then 'attending' else 'declined' end,
          case when p_attending then p_count else 0 end,
          left(coalesce(p_names, ''), 500), now());
  return json_build_object('ok', true);
end $$;

revoke all on function public.get_invite(text, boolean)                     from public;
revoke all on function public.submit_rsvp(text, text, boolean, int, text)   from public;
revoke all on function public.submit_open_rsvp(text, boolean, int, text)    from public;
grant execute on function public.get_invite(text, boolean)                  to anon, authenticated;
grant execute on function public.submit_rsvp(text, text, boolean, int, text) to anon, authenticated;
grant execute on function public.submit_open_rsvp(text, boolean, int, text)  to anon, authenticated;

-- ---------- Add your admin login email(s) ----------
-- insert into public.admins (email) values ('you@example.com'), ('partner@example.com');
