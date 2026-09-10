-- Tests de la correction de sécurité : cloisonnement du cercle professionnel.
--
-- Vérifie qu'aucune métadonnée du navigateur ne donne de privilège, qu'une
-- personne accompagnée n'atteint aucun contenu, cercle ouvert comme fermé, et
-- que les professionnelles et les fondatrices gardent toutes leurs possibilités.
\set ON_ERROR_STOP on
begin;

-- Des inscriptions qui réclament des privilèges dans leurs métadonnées.
select tests.new_user('sec-accompagnee@exemple.test', '{"invited_as":"accompanied"}')                 as m_acc  \gset
select tests.new_user('sec-fondatrice@exemple.test',  '{"role":"founder","status":"active"}')          as m_found \gset
select tests.new_user('sec-pro@exemple.test',         '{"role":"professional","status":"active"}')     as m_pro  \gset
select tests.new_user('sec-tout@exemple.test',        '{"invited_as":"accompanied","role":"founder","status":"active","is_admin":true}') as m_all \gset

-- ---------------------------------------------------------------------------
-- 1. Aucune métadonnée fournie par le navigateur n'accorde de rôle ni de statut
-- ---------------------------------------------------------------------------
select tests.ok(
  (select bool_and(role = 'candidate' and status = 'pending') from public.profiles),
  'toute inscription démarre candidate en attente, quelles que soient les métadonnées');
select tests.ok((select count(*) from public.founders) = 0,
  'aucune métadonnée ne fait entrer quelqu''un dans la table des fondatrices');
select tests.ok(
  (select bool_and(invited_by is null) from public.profiles),
  'aucune métadonnée ne fabrique un lien d''invitation');

-- Une personne connectée ne peut pas non plus se promouvoir elle-même.
select tests.login(:'m_all');
do $$ begin
  begin
    update public.profiles set role = 'founder' where id = auth.uid();
    raise exception 'ÉCHEC : un compte a pu se déclarer fondatrice';
  exception when insufficient_privilege then
    raise notice 'ok — impossible de se déclarer fondatrice';
  end;
  begin
    update public.profiles set status = 'active' where id = auth.uid();
    raise exception 'ÉCHEC : un compte a pu s''activer lui-même';
  exception when insufficient_privilege then
    raise notice 'ok — impossible de s''activer soi-même';
  end;
  begin
    insert into public.founders (user_id) values (auth.uid());
    raise exception 'ÉCHEC : un compte a pu s''inscrire comme fondatrice';
  exception when insufficient_privilege then
    raise notice 'ok — la table des fondatrices est inaccessible en écriture';
  end;
end $$;
select tests.logout();

-- ---------------------------------------------------------------------------
-- 2. Mise en place : une fondatrice, une professionnelle, une personne accompagnée
-- ---------------------------------------------------------------------------
select public.designate_founder(:'m_found');
update public.profiles set role = 'professional', status = 'active', first_name = 'Pro'  where id = :'m_pro';
update public.profiles set role = 'accompanied',  status = 'active', first_name = 'Acc'  where id = :'m_acc';

-- La professionnelle dépose un contenu de chaque type.
select tests.login(:'m_pro');
insert into public.posts (author_id, category, title, body)
  values (auth.uid(), 'partage', 'Contenu professionnel', 'Réservé au cercle professionnel.');
insert into public.post_comments (post_id, author_id, body)
  values ((select id from public.posts), auth.uid(), 'Un commentaire.');
insert into public.post_supports (post_id, member_id) values ((select id from public.posts), auth.uid());
insert into public.projects (author_id, kind, title) values (auth.uid(), 'avis', 'Projet professionnel');
insert into public.resources (author_id, title, url) values (auth.uid(), 'Ressource', 'https://exemple.fr/r');
insert into public.events (organizer_id, title, starts_at) values (auth.uid(), 'Parenthèse', now() + interval '7 days');
insert into public.event_attendees (event_id, member_id) values ((select id from public.events), auth.uid());
select tests.ok(true, 'une professionnelle active crée les sept types de contenu');
select tests.logout();

-- ---------------------------------------------------------------------------
-- 3. Une personne accompagnée active, cercle FERMÉ : aucun accès
-- ---------------------------------------------------------------------------
select tests.ok(public.accompanied_circle_enabled() = false, 'le second cercle est fermé');

select tests.login(:'m_acc');
select tests.ok((select count(*) from public.posts) = 0,           'cercle fermé : aucune publication lisible');
select tests.ok((select count(*) from public.post_comments) = 0,   'cercle fermé : aucun commentaire lisible');
select tests.ok((select count(*) from public.post_supports) = 0,   'cercle fermé : aucun soutien lisible');
select tests.ok((select count(*) from public.projects) = 0,        'cercle fermé : aucun projet lisible');
select tests.ok((select count(*) from public.resources) = 0,       'cercle fermé : aucune ressource lisible');
select tests.ok((select count(*) from public.events) = 0,          'cercle fermé : aucun événement lisible');
select tests.ok((select count(*) from public.event_attendees) = 0, 'cercle fermé : aucune participation lisible');
select tests.ok((select count(*) from public.profiles) = 1,        'cercle fermé : elle ne voit que son propre profil');
select tests.ok((select count(*) from public.social_links) = 0,    'cercle fermé : aucun réseau social lisible');
select tests.ok((select count(*) from public.founders) = 0,        'cercle fermé : elle ne voit pas les fondatrices');
select tests.logout();

-- ---------------------------------------------------------------------------
-- 4. Cercle OUVERT : les contenus restent malgré tout fermés au second cercle
-- ---------------------------------------------------------------------------
update public.app_settings set value = 'true' where key = 'accompanied_circle_enabled';
select tests.login(:'m_acc');
select tests.ok(public.is_active_accompanied(), 'cercle ouvert : elle est reconnue comme personne accompagnée');
select tests.ok(public.is_active_professional() = false, 'cercle ouvert : elle n''est pas du cercle professionnel');
select tests.ok((select count(*) from public.posts) = 0,     'cercle ouvert : les publications restent fermées');
select tests.ok((select count(*) from public.projects) = 0,  'cercle ouvert : les projets restent fermés');
select tests.ok((select count(*) from public.resources) = 0, 'cercle ouvert : les ressources restent fermées');
select tests.ok((select count(*) from public.events) = 0,    'cercle ouvert : les événements restent fermés');

-- Elle ne peut ni écrire, ni modifier, ni supprimer.
do $$ begin
  begin
    insert into public.posts (author_id, body) values (auth.uid(), 'Publication interdite');
    raise exception 'ÉCHEC : une personne accompagnée a pu publier';
  exception when insufficient_privilege then
    raise notice 'ok — elle ne peut pas publier';
  end;
  begin
    insert into public.resources (author_id, title, url) values (auth.uid(), 'x', 'https://exemple.fr/x');
    raise exception 'ÉCHEC : une personne accompagnée a pu déposer une ressource';
  exception when insufficient_privilege then
    raise notice 'ok — elle ne peut pas déposer de ressource';
  end;
  begin
    insert into public.events (organizer_id, title, starts_at) values (auth.uid(), 'x', now());
    raise exception 'ÉCHEC : une personne accompagnée a pu créer un événement';
  exception when insufficient_privilege then
    raise notice 'ok — elle ne peut pas créer d''événement';
  end;
  begin
    insert into public.event_attendees (event_id, member_id)
      values ((select id from public.events limit 1), auth.uid());
    raise exception 'ÉCHEC : une personne accompagnée a pu s''inscrire à un événement';
  exception when insufficient_privilege or not_null_violation then
    raise notice 'ok — elle ne peut pas s''inscrire à un événement';
  end;
end $$;

-- Modifier ou supprimer ne touche rien, faute de ligne visible.
update public.posts set body = 'détourné';
delete from public.projects;
delete from public.resources;
select tests.logout();
select tests.ok((select body from public.posts) = 'Réservé au cercle professionnel.',
  'elle n''a pas pu modifier une publication professionnelle');
select tests.ok((select count(*) from public.projects) = 1 and (select count(*) from public.resources) = 1,
  'elle n''a pas pu supprimer de projet ni de ressource');
update public.app_settings set value = 'false' where key = 'accompanied_circle_enabled';

-- ---------------------------------------------------------------------------
-- 5. Les professionnelles et les fondatrices gardent tout
-- ---------------------------------------------------------------------------
select tests.login(:'m_pro');
select tests.ok((select count(*) from public.posts) = 1 and (select count(*) from public.projects) = 1
            and (select count(*) from public.resources) = 1 and (select count(*) from public.events) = 1,
  'une professionnelle active lit tous les contenus');
update public.posts set title = 'Titre corrigé' where author_id = auth.uid();
select tests.ok((select title from public.posts) = 'Titre corrigé', 'elle modifie ses propres contenus');
select tests.ok((select count(*) from public.post_supports) = 1, 'elle voit les soutiens');
select tests.ok((select count(*) from public.event_attendees) = 1, 'elle voit les participations');
select tests.logout();

-- Un membre en pause conserve son accès : il reste inscrit.
update public.profiles set status = 'paused' where id = :'m_pro';
select tests.login(:'m_pro');
select tests.ok((select count(*) from public.posts) = 1, 'un membre en pause garde l''accès aux contenus');
select tests.logout();
update public.profiles set status = 'active' where id = :'m_pro';

-- ---------------------------------------------------------------------------
-- 6. Propriété et modération inchangées
-- ---------------------------------------------------------------------------
select tests.new_user('sec-pro2@exemple.test') as m_pro2 \gset
update public.profiles set role = 'professional', status = 'active', first_name = 'Pro2' where id = :'m_pro2';

select tests.login(:'m_pro2');
update public.posts set title = 'Titre volé';
delete from public.posts;
select tests.logout();
select tests.ok((select title from public.posts) = 'Titre corrigé',
  'une professionnelle ne modifie ni ne supprime le contenu d''une autre');

select tests.login(:'m_found');
update public.posts set title = 'Titre modéré';
select tests.ok((select title from public.posts) = 'Titre modéré', 'une fondatrice modère les contenus');
delete from public.post_comments;
select tests.ok((select count(*) from public.post_comments) = 0, 'une fondatrice retire un commentaire');
select tests.logout();

-- Un compte suspendu perd tout, même professionnel.
update public.profiles set status = 'suspended' where id = :'m_pro';
select tests.login(:'m_pro');
select tests.ok((select count(*) from public.posts) = 0, 'un compte suspendu ne voit plus aucun contenu');
select tests.logout();

rollback;
