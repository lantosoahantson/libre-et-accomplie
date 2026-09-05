-- =============================================================================
-- LE COCON — Étape 1 : fondations
-- Rôles, statuts, profils, fondatrices, paramètres généraux, règles RLS.
-- Toute règle d'accès est appliquée ici, côté base, jamais seulement côté client.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Types
-- -----------------------------------------------------------------------------
create type public.member_role as enum (
  'candidate',     -- candidat·e professionnel·le (compte créé, pas encore validé)
  'professional',  -- professionnel·le validé·e
  'accompanied',   -- personne accompagnée (sur invitation uniquement)
  'founder'        -- fondatrice / administratrice
);

create type public.member_status as enum (
  'invited',   -- invité·e (compte pas encore activé)
  'pending',   -- candidature en attente
  'active',    -- actif·ve
  'paused',    -- en pause
  'suspended', -- suspendu·e
  'left',      -- sorti·e du groupe
  'refused'    -- candidature refusée
);

-- -----------------------------------------------------------------------------
-- 2. Tables
-- -----------------------------------------------------------------------------

-- Profils : une ligne par compte. L'adresse électronique de connexion n'est
-- JAMAIS stockée ici : elle reste dans auth.users et n'apparaît donc nulle part
-- dans l'annuaire.
create table public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  role                     public.member_role   not null default 'candidate',
  status                   public.member_status not null default 'pending',
  first_name               text not null default '' check (char_length(first_name) <= 60),
  last_name                text not null default '' check (char_length(last_name) <= 60),
  is_hidden                boolean not null default false,  -- masquage temporaire de la fiche
  visible_to_accompanied   boolean not null default false,  -- fiche visible pour le cercle des personnes accompagnées
  public_directory_consent boolean not null default false,  -- consentement annuaire public (fonction désactivée, à valider)
  onboarding_done          boolean not null default false,
  invited_by               uuid references auth.users (id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table  public.profiles is 'Profil de chaque compte. Ne contient jamais l''adresse électronique de connexion.';
comment on column public.profiles.is_hidden is 'Masquage temporaire de la fiche dans l''annuaire, sans suppression du compte.';

-- Fondatrices : désignées par identifiant de compte, jamais par courriel affiché.
create table public.founders (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  designated_at timestamptz not null default now()
);

comment on table public.founders is 'Les trois fondatrices. Trois lignes au maximum (voir trigger).';

-- Paramètres généraux configurables par les fondatrices.
create table public.app_settings (
  key              text primary key,
  value            jsonb not null default 'null'::jsonb,
  label            text not null,
  description      text not null default '',
  audience         text not null default 'members'
                   check (audience in ('public', 'members', 'professionals', 'founders')),
  needs_validation boolean not null default false, -- point « à valider » par les trois fondatrices
  updated_at       timestamptz not null default now(),
  updated_by       uuid references auth.users (id) on delete set null
);

comment on column public.app_settings.audience is 'Qui peut lire ce paramètre : public, members (tous les membres actifs), professionals, founders.';
comment on column public.app_settings.needs_validation is 'Vrai si la valeur reste à valider conjointement par les trois fondatrices.';

-- -----------------------------------------------------------------------------
-- 3. Fonctions utilitaires (security definer, lecture seule)
--    Elles lisent public.profiles en contournant la RLS pour éviter toute
--    récursion dans les politiques. search_path est fixé pour la sécurité.
-- -----------------------------------------------------------------------------
create or replace function public.current_member_role()
returns public.member_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_member_status()
returns public.member_status
language sql stable security definer
set search_path = public
as $$
  select status from public.profiles where id = auth.uid();
$$;

create or replace function public.is_founder()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.founders f
    join public.profiles p on p.id = f.user_id
    where f.user_id = auth.uid()
      and p.status in ('active', 'paused')
  );
$$;

-- Membre actif : statut actif ou en pause (une personne en pause reste inscrite).
create or replace function public.is_active_member()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('professional', 'accompanied', 'founder')
      and status in ('active', 'paused')
  );
$$;

create or replace function public.is_active_professional()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('professional', 'founder')
      and status in ('active', 'paused')
  );
$$;

create or replace function public.is_active_accompanied()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'accompanied'
      and status in ('active', 'paused')
  );
$$;

-- -----------------------------------------------------------------------------
-- 4. Triggers
-- -----------------------------------------------------------------------------

-- updated_at automatique
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- Création automatique du profil à la création d'un compte.
-- Un compte invité (métadonnées invited_as = 'accompanied') démarre comme
-- personne accompagnée « invitée » ; tout autre compte démarre comme
-- candidat·e « en attente ».
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_role   public.member_role   := 'candidate';
  v_status public.member_status := 'pending';
  v_invited_by uuid := null;
begin
  if coalesce(new.raw_user_meta_data ->> 'invited_as', '') = 'accompanied' then
    v_role := 'accompanied';
    v_status := 'invited';
    begin
      v_invited_by := (new.raw_user_meta_data ->> 'invited_by')::uuid;
    exception when others then
      v_invited_by := null;
    end;
  end if;

  insert into public.profiles (id, role, status, first_name, invited_by)
  values (
    new.id,
    v_role,
    v_status,
    left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 60),
    v_invited_by
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Protection des colonnes sensibles du profil.
-- Un membre ne peut modifier ni son rôle, ni son statut (sauf actif <-> en pause,
-- et quitter le groupe), ni les colonnes d'administration. Les fondatrices peuvent.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  -- Opérations serveur (migrations, éditeur SQL, service_role) : pas de restriction.
  if auth.uid() is null then
    return new;
  end if;

  if public.is_founder() then
    -- Une fondatrice ne peut pas se retirer elle-même son rôle par erreur.
    if old.id = auth.uid() and new.role <> 'founder' then
      raise exception 'Une fondatrice ne peut pas modifier son propre rôle.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.id <> old.id or new.role <> old.role or new.created_at <> old.created_at
     or coalesce(new.invited_by, '00000000-0000-0000-0000-000000000000'::uuid)
        <> coalesce(old.invited_by, '00000000-0000-0000-0000-000000000000'::uuid) then
    raise exception 'Vous ne pouvez pas modifier ces informations de votre compte.'
      using errcode = '42501';
  end if;

  if new.status <> old.status then
    -- Transitions autorisées pour un membre : actif -> en pause, en pause -> actif, -> sorti du groupe
    if not (
      (old.status = 'active' and new.status = 'paused') or
      (old.status = 'paused' and new.status = 'active') or
      (old.status in ('active', 'paused') and new.status = 'left')
    ) then
      raise exception 'Ce changement de statut n''est pas autorisé.'
        using errcode = '42501';
    end if;
  end if;

  -- L'annuaire public reste désactivé tant que les fondatrices ne l'ont pas validé.
  if new.public_directory_consent and not old.public_directory_consent then
    if coalesce((select (value)::boolean from public.app_settings where key = 'public_directory_enabled'), false) = false then
      raise exception 'L''annuaire public n''est pas encore activé : ce point reste à valider par les fondatrices.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Trois fondatrices au maximum.
create or replace function public.limit_founders()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.founders) >= 3 then
    raise exception 'Le Cocon compte déjà trois fondatrices.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger founders_limit
  before insert on public.founders
  for each row execute function public.limit_founders();

-- -----------------------------------------------------------------------------
-- 5. Désignation sécurisée des fondatrices
--    Exécutable uniquement côté serveur (éditeur SQL Supabase / service_role),
--    jamais depuis l'application.
-- -----------------------------------------------------------------------------
create or replace function public.designate_founder(target_user_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'Aucun compte ne correspond à cet identifiant.';
  end if;

  insert into public.founders (user_id) values (target_user_id)
  on conflict (user_id) do nothing;

  -- Le profil existe normalement déjà (trigger) ; on le crée par sécurité.
  insert into public.profiles (id, role, status)
  values (target_user_id, 'founder', 'active')
  on conflict (id) do update
    set role = 'founder', status = 'active';
end;
$$;

-- Variante par courriel : à exécuter dans l'éditeur SQL du tableau de bord.
-- Le courriel n'est jamais affiché dans l'application.
create or replace function public.designate_founder_by_email(target_email text)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(trim(target_email)) limit 1;
  if v_id is null then
    raise exception 'Aucun compte ne correspond à ce courriel. La personne doit d''abord se connecter une première fois.';
  end if;
  perform public.designate_founder(v_id);
end;
$$;

create or replace function public.revoke_founder(target_user_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  delete from public.founders where user_id = target_user_id;
  update public.profiles set role = 'professional' where id = target_user_id and role = 'founder';
end;
$$;

revoke execute on function public.designate_founder(uuid)          from public, anon, authenticated;
revoke execute on function public.designate_founder_by_email(text) from public, anon, authenticated;
revoke execute on function public.revoke_founder(uuid)             from public, anon, authenticated;
grant  execute on function public.designate_founder(uuid)          to service_role;
grant  execute on function public.designate_founder_by_email(text) to service_role;
grant  execute on function public.revoke_founder(uuid)             to service_role;

-- -----------------------------------------------------------------------------
-- 6. Fonctions appelables par l'application (RPC)
-- -----------------------------------------------------------------------------

-- Garantit l'existence du profil de l'utilisateur connecté (filet de sécurité).
create or replace function public.ensure_own_profile()
returns public.profiles
language plpgsql security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Vous devez être connecté·e.' using errcode = '42501';
  end if;
  insert into public.profiles (id) values (auth.uid())
  on conflict (id) do nothing;
  select * into v_profile from public.profiles where id = auth.uid();
  return v_profile;
end;
$$;

revoke execute on function public.ensure_own_profile() from public, anon;
grant  execute on function public.ensure_own_profile() to authenticated;

-- -----------------------------------------------------------------------------
-- 7. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.founders     enable row level security;
alter table public.app_settings enable row level security;

-- Droits de base (la RLS fait ensuite le tri ligne par ligne)
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.founders to authenticated;
grant select on public.app_settings to anon, authenticated;
grant insert, update, delete on public.app_settings to authenticated; -- restreint aux fondatrices par RLS

-- PROFILS ------------------------------------------------------------------
-- Lecture : soi-même ; les fondatrices voient tout ; un·e professionnel·le actif·ve
-- voit les membres actifs non masqués ; une personne accompagnée voit uniquement
-- les fiches professionnelles ouvertes à son cercle et les autres personnes
-- accompagnées actives. Aucun visiteur, aucun·e candidat·e ne voit les autres.
create policy "profiles: lire son propre profil"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles: fondatrices lisent tout"
  on public.profiles for select
  to authenticated
  using (public.is_founder());

create policy "profiles: professionnels lisent les membres actifs visibles"
  on public.profiles for select
  to authenticated
  using (
    public.is_active_professional()
    and status in ('active', 'paused')
    and not is_hidden
  );

create policy "profiles: personnes accompagnées lisent leur cercle"
  on public.profiles for select
  to authenticated
  using (
    public.is_active_accompanied()
    and status in ('active', 'paused')
    and not is_hidden
    and (
      (role in ('professional', 'founder') and visible_to_accompanied)
      or role = 'accompanied'
    )
  );

-- Écriture : uniquement son propre profil (colonnes sensibles protégées par trigger),
-- ou fondatrice.
create policy "profiles: créer son propre profil"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid() and role = 'candidate' and status = 'pending');

create policy "profiles: modifier son propre profil"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: fondatrices modifient tout"
  on public.profiles for update
  to authenticated
  using (public.is_founder())
  with check (public.is_founder());

-- FONDATRICES --------------------------------------------------------------
create policy "founders: membres actifs voient qui sont les fondatrices"
  on public.founders for select
  to authenticated
  using (public.is_active_member() or user_id = auth.uid());

-- PARAMÈTRES ---------------------------------------------------------------
create policy "settings: lecture publique"
  on public.app_settings for select
  to anon, authenticated
  using (audience = 'public');

create policy "settings: lecture membres"
  on public.app_settings for select
  to authenticated
  using (
    (audience = 'members' and public.is_active_member())
    or (audience = 'professionals' and public.is_active_professional())
    or public.is_founder()
  );

create policy "settings: fondatrices modifient"
  on public.app_settings for insert
  to authenticated
  with check (public.is_founder());

create policy "settings: fondatrices mettent à jour"
  on public.app_settings for update
  to authenticated
  using (public.is_founder())
  with check (public.is_founder());

create policy "settings: fondatrices suppriment"
  on public.app_settings for delete
  to authenticated
  using (public.is_founder());

-- -----------------------------------------------------------------------------
-- 8. Paramètres initiaux
-- -----------------------------------------------------------------------------
insert into public.app_settings (key, value, label, description, audience, needs_validation) values
  ('app_name', '"Le Cocon — La Parenthèse des Invisibles"', 'Nom de l''application', '', 'public', false),
  ('intention_phrase', '"Notre refuge de co-création au rythme du corps."', 'Phrase d''intention (accueil)',
     'Formulation finale de la vision à valider par les trois fondatrices.', 'public', true),
  ('whatsapp_link', '""', 'Lien du groupe WhatsApp',
     'Canal léger pour annonces, rappels et liens rapides. Visible par les membres actifs.', 'members', false),
  ('facebook_link', '""', 'Lien Facebook (transition)',
     'Lien facultatif pendant la période de transition. Laisser vide pour ne rien afficher.', 'members', false),
  ('accompanied_circle_enabled', 'false', 'Cercle des personnes accompagnées : invitations activées',
     'Désactivé par défaut. L''ouverture complète de ce cercle reste à valider.', 'founders', true),
  ('public_directory_enabled', 'false', 'Annuaire public (avec consentement explicite)',
     'Désactivé. L''ouverture d''une partie publique de l''annuaire reste à valider.', 'founders', true),
  ('events_require_validation', 'true', 'Les événements proposés doivent être validés par une fondatrice', '', 'founders', false),
  ('application_target_days', '14', 'Délai cible de réponse aux candidatures (jours)',
     'Indicateur administratif uniquement ; aucun délai n''est promis à la candidate.', 'founders', false),
  ('replay_retention_days', 'null', 'Durée de conservation des replays (jours)',
     'Non fixée. À valider par les trois fondatrices.', 'founders', true),
  ('parenthese_recurrence', '{"weekday": 4, "hour": 18, "minute": 0, "every_weeks": 2, "timezone": "Europe/Paris"}',
     'Récurrence habituelle des visios de La Parenthèse',
     'Par défaut le jeudi à 18 h toutes les deux semaines (modifiable).', 'founders', false);
