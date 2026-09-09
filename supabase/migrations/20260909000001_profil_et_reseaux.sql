-- =============================================================================
-- LE COCON — Fiche « Mon Univers » et réseaux sociaux
--
-- Complète la table des profils avec les champs de la fiche, et ajoute une table
-- souple pour les liens sociaux, plutôt qu'une série de colonnes figées.
-- Un seul champ Instagram : le « deuxième Instagram » n'existe pas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Champs de la fiche « Mon Univers »
--    Les limites sont volontairement larges et toujours annoncées à l'écran par
--    un compteur : rien n'est jamais coupé en silence.
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column headline            text not null default '' check (char_length(headline) <= 180),
  add column activity            text not null default '' check (char_length(activity) <= 120),
  add column approach            text not null default '' check (char_length(approach) <= 800),
  add column skills              text[] not null default '{}' check (array_length(skills, 1) is null or array_length(skills, 1) <= 20),
  add column contribution_topics text[] not null default '{}' check (array_length(contribution_topics, 1) is null or array_length(contribution_topics, 1) <= 20),
  add column audience            text not null default '' check (char_length(audience) <= 160),
  add column location            text not null default '' check (char_length(location) <= 80),
  add column presence            text not null default 'les-deux' check (presence in ('presentiel', 'distance', 'les-deux')),
  add column current_project     text not null default '' check (char_length(current_project) <= 400),
  add column website             text not null default '' check (char_length(website) <= 300),
  -- Identifiant Instagram seul, sans arobase ni adresse : le lien est reconstruit
  -- à l'affichage. Un seul compte, conformément au cahier des charges.
  add column instagram           text not null default '' check (instagram = '' or instagram ~ '^[A-Za-z0-9._]{1,30}$');

comment on column public.profiles.instagram is 'Identifiant Instagram principal, sans arobase. Aucun second compte n''est prévu.';
comment on column public.profiles.presence is 'presentiel, distance ou les-deux.';

-- -----------------------------------------------------------------------------
-- 2. Autres réseaux sociaux : table souple, huit liens au maximum
-- -----------------------------------------------------------------------------
create table public.social_links (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  network    text not null check (network in ('threads', 'facebook', 'linkedin', 'tiktok', 'youtube', 'pinterest', 'other')),
  label      text not null default '' check (char_length(label) <= 40),
  url        text not null check (char_length(url) between 4 and 300 and url ~* '^https?://'),
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index social_links_profile_id_idx on public.social_links (profile_id, position);

comment on table public.social_links is 'Réseaux sociaux supplémentaires d''un membre. Instagram principal reste sur profiles.';

-- Huit liens supplémentaires au maximum par membre.
create or replace function public.limit_social_links()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.social_links where profile_id = new.profile_id) >= 8 then
    raise exception 'Vous pouvez ajouter huit réseaux au maximum.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger social_links_limit
  before insert on public.social_links
  for each row execute function public.limit_social_links();

-- -----------------------------------------------------------------------------
-- 3. Règles d'accès
--    Un lien social se lit exactement comme le profil auquel il appartient :
--    la visibilité de l'annuaire s'applique donc aussi aux liens.
-- -----------------------------------------------------------------------------
alter table public.social_links enable row level security;

grant select, insert, update, delete on public.social_links to authenticated;

create policy "liens: lire ceux des profils visibles"
  on public.social_links for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = social_links.profile_id
    )
  );

create policy "liens: gérer les siens"
  on public.social_links for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "liens: modifier les siens"
  on public.social_links for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "liens: supprimer les siens"
  on public.social_links for delete
  to authenticated
  using (profile_id = auth.uid() or public.is_founder());
