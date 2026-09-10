-- =============================================================================
-- LE COCON — Cloisonnement du cercle professionnel
--
-- Correction de sécurité. Trois défauts sont corrigés :
--
-- 1. Les sept tables de contenu étaient lisibles, et pour certaines modifiables,
--    par tout membre actif, y compris une personne accompagnée. L'interface le
--    masquait, mais un appel direct à l'API passait outre.
--
-- 2. Le paramètre « accompanied_circle_enabled » n'était lu nulle part : il
--    n'empêchait donc rien. Il devient un véritable verrou côté base.
--
-- 3. La création d'un compte lisait des métadonnées fournies par le navigateur
--    pour attribuer le rôle et le statut. Une personne pouvait ainsi se déclarer
--    elle-même « accompagnée ». Ces métadonnées ne sont plus lues du tout.
--
-- Décision retenue pour le prototype pilote : tous les contenus communautaires
-- sont strictement réservés aux professionnelles actives et aux fondatrices.
-- L'ouverture éventuelle de certains contenus au second cercle sera décidée plus
-- tard, et fera l'objet d'une autre migration.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Le paramètre du second cercle devient un verrou réel
-- -----------------------------------------------------------------------------
create or replace function public.accompanied_circle_enabled()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select (value)::boolean from public.app_settings where key = 'accompanied_circle_enabled'),
    false
  );
$$;

comment on function public.accompanied_circle_enabled() is
  'Vrai uniquement si les trois fondatrices ont ouvert le cercle des personnes accompagnées.';

-- Tant que le cercle est fermé, une personne accompagnée n'est reconnue nulle part.
create or replace function public.is_active_accompanied()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.accompanied_circle_enabled()
     and exists (
       select 1 from public.profiles
       where id = auth.uid()
         and role = 'accompanied'
         and status in ('active', 'paused')
     );
$$;

-- Un membre du Cocon : professionnelle ou fondatrice active, et, seulement si le
-- second cercle est ouvert, une personne accompagnée.
create or replace function public.is_active_member()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status in ('active', 'paused')
      and (
        role in ('professional', 'founder')
        or (role = 'accompanied' and public.accompanied_circle_enabled())
      )
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. Aucune métadonnée du navigateur ne peut accorder un rôle ou un statut
--
--    Les métadonnées d'inscription sont fournies par le client : elles ne sont
--    donc jamais dignes de confiance. Tout nouveau compte démarre candidat, en
--    attente, sans lien d'invitation. Le rôle de fondatrice s'accorde uniquement
--    par designate_founder, côté serveur ; l'activation d'un membre uniquement
--    par une fondatrice.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, status)
  values (new.id, 'candidate', 'pending')
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Crée le profil d''un nouveau compte. N''utilise aucune métadonnée du navigateur.';

-- -----------------------------------------------------------------------------
-- 3. Les sept tables de contenu passent au cercle professionnel
--
--    Lecture, création, modification et suppression exigent désormais toutes
--    is_active_professional(), c'est-à-dire un rôle professionnel ou fondatrice
--    avec un statut actif ou en pause. La propriété et la modération restent
--    inchangées : chacun ses contenus, les fondatrices administrent l'ensemble.
-- -----------------------------------------------------------------------------
-- On supprime d'abord TOUTES les politiques existantes de ces sept tables, par
-- recensement plutôt que par nom : certains noms créés précédemment contiennent
-- une apostrophe doublée, et une suppression par nom laisserait en place une
-- ancienne règle permissive sans que rien ne le signale.
do $$
declare
  t text;
  pol record;
  owner_column text;
begin
  foreach t in array array['posts', 'post_comments', 'post_supports', 'projects',
                           'resources', 'events', 'event_attendees']
  loop
    for pol in
      select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;
  end loop;

  -- Puis on recrée le jeu complet, réservé au cercle professionnel.
  foreach t in array array['posts', 'post_comments', 'projects', 'resources', 'events']
  loop
    owner_column := case when t = 'events' then 'organizer_id' else 'author_id' end;

    execute format($f$
      create policy "%1$s : lecture réservée au cercle professionnel"
        on public.%1$I for select to authenticated
        using (public.is_active_professional());
    $f$, t);

    execute format($f$
      create policy "%1$s : création de ses propres contenus"
        on public.%1$I for insert to authenticated
        with check (public.is_active_professional() and %2$I = auth.uid());
    $f$, t, owner_column);

    execute format($f$
      create policy "%1$s : modification par l'auteur ou une fondatrice"
        on public.%1$I for update to authenticated
        using (public.is_active_professional() and (%2$I = auth.uid() or public.is_founder()))
        with check (public.is_active_professional() and (%2$I = auth.uid() or public.is_founder()));
    $f$, t, owner_column);

    execute format($f$
      create policy "%1$s : suppression par l'auteur ou une fondatrice"
        on public.%1$I for delete to authenticated
        using (public.is_active_professional() and (%2$I = auth.uid() or public.is_founder()));
    $f$, t, owner_column);
  end loop;
end $$;

-- Soutiens
create policy "soutiens : lecture réservée au cercle professionnel"
  on public.post_supports for select to authenticated
  using (public.is_active_professional());
create policy "soutiens : chacun le sien"
  on public.post_supports for insert to authenticated
  with check (public.is_active_professional() and member_id = auth.uid());
create policy "soutiens : retirer le sien"
  on public.post_supports for delete to authenticated
  using (public.is_active_professional() and (member_id = auth.uid() or public.is_founder()));

-- Participations aux événements
create policy "participations : lecture réservée au cercle professionnel"
  on public.event_attendees for select to authenticated
  using (public.is_active_professional());
create policy "participations : s'inscrire soi-même"
  on public.event_attendees for insert to authenticated
  with check (public.is_active_professional() and member_id = auth.uid());
create policy "participations : se désinscrire"
  on public.event_attendees for delete to authenticated
  using (public.is_active_professional() and (member_id = auth.uid() or public.is_founder()));
