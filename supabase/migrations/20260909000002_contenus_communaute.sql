-- =============================================================================
-- LE COCON — Contenus de la communauté
--
-- Publications et commentaires, projets, ressources, événements et participations.
-- Tout est partagé : ce qu'une personne publie, les autres membres connectés le voient.
-- Chaque membre gère ses propres contenus ; les fondatrices administrent l'ensemble.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Types
-- -----------------------------------------------------------------------------
create type public.post_category as enum (
  'partage',    -- Partage ou réflexion
  'question',   -- Question
  'retour',     -- Demande de retour
  'victoire',   -- Petite victoire
  'soutien',    -- Besoin de soutien
  'actualite'   -- Actualité
);

create type public.project_kind as enum (
  'avis',          -- Je cherche un avis
  'test',          -- Je cherche des personnes pour tester
  'competence',    -- Je cherche une compétence
  'collaboration'  -- Je cherche une collaboration
);

create type public.project_status as enum ('ouvert', 'cloture');

-- -----------------------------------------------------------------------------
-- 2. Publications du Fil du Cocon
-- -----------------------------------------------------------------------------
create table public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles (id) on delete cascade,
  category   public.post_category not null default 'partage',
  title      text not null default '' check (char_length(title) <= 120),
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_created_at_idx on public.posts (created_at desc);

create table public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index post_comments_post_id_idx on public.post_comments (post_id, created_at);

-- Réaction de soutien : une par personne et par publication, sans classement.
create table public.post_supports (
  post_id    uuid not null references public.posts (id) on delete cascade,
  member_id  uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, member_id)
);

-- -----------------------------------------------------------------------------
-- 3. Projets & Synergies
-- -----------------------------------------------------------------------------
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id) on delete cascade,
  kind        public.project_kind not null default 'avis',
  title       text not null check (char_length(title) between 1 and 120),
  summary     text not null default '' check (char_length(summary) <= 2000),
  help_wanted text not null default '' check (char_length(help_wanted) <= 500),
  status      public.project_status not null default 'ouvert',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index projects_created_at_idx on public.projects (created_at desc);

-- -----------------------------------------------------------------------------
-- 4. Boîte à outils
--    Pas de téléversement de fichier ni de vidéo : un lien externe suffit.
-- -----------------------------------------------------------------------------
create table public.resources (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 140),
  description text not null default '' check (char_length(description) <= 1000),
  category    text not null default 'Outils' check (char_length(category) between 1 and 40),
  url         text not null check (char_length(url) between 4 and 500 and url ~* '^https?://'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index resources_created_at_idx on public.resources (created_at desc);

-- -----------------------------------------------------------------------------
-- 5. Agenda
-- -----------------------------------------------------------------------------
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 140),
  description  text not null default '' check (char_length(description) <= 1000),
  -- Nom de l'animatrice lorsqu'elle n'est pas la personne qui crée l'événement.
  host_name    text not null default '' check (char_length(host_name) <= 80),
  starts_at    timestamptz not null,
  duration_min integer not null default 60 check (duration_min between 5 and 1440),
  -- Lien de visioconférence, ou lieu écrit en clair.
  location     text not null default '' check (char_length(location) <= 300),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index events_starts_at_idx on public.events (starts_at);

create table public.event_attendees (
  event_id   uuid not null references public.events (id) on delete cascade,
  member_id  uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

-- -----------------------------------------------------------------------------
-- 6. Horodatage automatique
-- -----------------------------------------------------------------------------
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
create trigger resources_set_updated_at
  before update on public.resources
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. Règles d'accès
--
--    Lecture : tout membre actif du Cocon.
--    Écriture : chacun ses propres contenus.
--    Administration : les fondatrices peuvent modifier et supprimer l'ensemble.
--    Un visiteur, un candidat ou un compte suspendu ne voit rien.
-- -----------------------------------------------------------------------------
alter table public.posts           enable row level security;
alter table public.post_comments   enable row level security;
alter table public.post_supports   enable row level security;
alter table public.projects        enable row level security;
alter table public.resources       enable row level security;
alter table public.events          enable row level security;
alter table public.event_attendees enable row level security;

grant select, insert, update, delete on
  public.posts, public.post_comments, public.post_supports,
  public.projects, public.resources, public.events, public.event_attendees
  to authenticated;

-- Les quatre tables « avec auteur » suivent exactement les mêmes règles.
do $$
declare
  t text;
  owner_column text;
begin
  foreach t in array array['posts', 'post_comments', 'projects', 'resources', 'events']
  loop
    owner_column := case when t = 'events' then 'organizer_id' else 'author_id' end;

    execute format($f$
      create policy "%1$s : lecture par les membres actifs"
        on public.%1$I for select to authenticated
        using (public.is_active_member());
    $f$, t);

    execute format($f$
      create policy "%1$s : création de ses propres contenus"
        on public.%1$I for insert to authenticated
        with check (public.is_active_member() and %2$I = auth.uid());
    $f$, t, owner_column);

    execute format($f$
      create policy "%1$s : modification par l''auteur ou une fondatrice"
        on public.%1$I for update to authenticated
        using (%2$I = auth.uid() or public.is_founder())
        with check (%2$I = auth.uid() or public.is_founder());
    $f$, t, owner_column);

    execute format($f$
      create policy "%1$s : suppression par l''auteur ou une fondatrice"
        on public.%1$I for delete to authenticated
        using (%2$I = auth.uid() or public.is_founder());
    $f$, t, owner_column);
  end loop;
end $$;

-- Soutiens et participations : chacun gère le sien, tout le monde les voit.
create policy "soutiens : lecture par les membres actifs"
  on public.post_supports for select to authenticated
  using (public.is_active_member());
create policy "soutiens : chacun le sien"
  on public.post_supports for insert to authenticated
  with check (public.is_active_member() and member_id = auth.uid());
create policy "soutiens : retirer le sien"
  on public.post_supports for delete to authenticated
  using (member_id = auth.uid() or public.is_founder());

create policy "participations : lecture par les membres actifs"
  on public.event_attendees for select to authenticated
  using (public.is_active_member());
create policy "participations : s''inscrire soi-même"
  on public.event_attendees for insert to authenticated
  with check (public.is_active_member() and member_id = auth.uid());
create policy "participations : se désinscrire"
  on public.event_attendees for delete to authenticated
  using (member_id = auth.uid() or public.is_founder());
