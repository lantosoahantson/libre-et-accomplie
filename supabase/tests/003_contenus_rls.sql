-- Tests : contenus partagés de la communauté.
-- Chacun gère les siens, les fondatrices administrent, personne d'autre ne voit rien.
\set ON_ERROR_STOP on
begin;

select tests.new_user('f1@exemple.test')  as f1 \gset
select tests.new_user('m1@exemple.test')  as m1 \gset
select tests.new_user('m2@exemple.test')  as m2 \gset
select tests.new_user('cand@exemple.test') as cand \gset
select tests.new_user('susp@exemple.test') as susp \gset

select public.designate_founder(:'f1');
update public.profiles set role = 'professional', status = 'active', first_name = 'Membre un'   where id = :'m1';
update public.profiles set role = 'professional', status = 'active', first_name = 'Membre deux' where id = :'m2';
update public.profiles set role = 'professional', status = 'suspended' where id = :'susp';

-- ---------------------------------------------------------------------------
-- Un membre crée ses contenus
-- ---------------------------------------------------------------------------
select tests.login(:'m1');

insert into public.posts (author_id, category, title, body)
  values (auth.uid(), 'victoire', 'Premier pas', 'J''ai osé publier.');
select tests.ok((select count(*) from public.posts) = 1, 'un membre peut publier dans le Fil');

insert into public.projects (author_id, kind, title, summary, help_wanted)
  values (auth.uid(), 'collaboration', 'Atelier à deux voix', 'Deux heures en entreprise.', 'Une sophrologue.');
select tests.ok((select count(*) from public.projects) = 1, 'un membre peut proposer un projet');

insert into public.resources (author_id, title, description, category, url)
  values (auth.uid(), 'Grille d''atelier', 'Une page à imprimer.', 'Outils', 'https://exemple.fr/grille');
select tests.ok((select count(*) from public.resources) = 1, 'un membre peut partager une ressource');

insert into public.events (organizer_id, title, description, starts_at, duration_min, location)
  values (auth.uid(), 'La Parenthèse', 'Notre visio.', now() + interval '7 days', 90, 'https://visio.exemple.fr/a');
select tests.ok((select count(*) from public.events) = 1, 'un membre peut créer un événement');

-- Il ne peut pas signer au nom d'un autre
do $$ begin
  begin
    insert into public.posts (author_id, body)
      values ((select id from public.profiles where first_name = 'Membre deux'), 'Publication usurpée');
    raise exception 'ÉCHEC : une publication a pu être signée au nom d''un autre membre';
  exception when insufficient_privilege then
    raise notice 'ok — impossible de publier au nom de quelqu''un d''autre';
  end;
end $$;

-- Une adresse de ressource sans protocole est refusée : l'application normalise avant.
do $$ begin
  begin
    insert into public.resources (author_id, title, url) values (auth.uid(), 'Sans protocole', 'exemple.fr/x');
    raise exception 'ÉCHEC : une adresse sans protocole a été acceptée';
  exception when check_violation then
    raise notice 'ok — une adresse de ressource sans protocole est refusée';
  end;
end $$;

-- Un texte trop long est refusé, jamais coupé
do $$ begin
  begin
    insert into public.posts (author_id, body) values (auth.uid(), repeat('a', 4001));
    raise exception 'ÉCHEC : un texte trop long a été accepté';
  exception when check_violation then
    raise notice 'ok — un texte de publication trop long est refusé, jamais tronqué';
  end;
end $$;
select tests.logout();

-- ---------------------------------------------------------------------------
-- Un autre membre lit, commente, soutient et s'inscrit
-- ---------------------------------------------------------------------------
select tests.login(:'m2');
select tests.ok((select count(*) from public.posts) = 1, 'un autre membre voit la publication');
select tests.ok((select count(*) from public.projects) = 1, 'un autre membre voit le projet');
select tests.ok((select count(*) from public.resources) = 1, 'un autre membre voit la ressource');
select tests.ok((select count(*) from public.events) = 1, 'un autre membre voit l''événement');

insert into public.post_comments (post_id, author_id, body)
  values ((select id from public.posts), auth.uid(), 'Bravo pour ce premier pas.');
select tests.ok((select count(*) from public.post_comments) = 1, 'un membre peut commenter');

insert into public.post_supports (post_id, member_id) values ((select id from public.posts), auth.uid());
select tests.ok((select count(*) from public.post_supports) = 1, 'un membre peut envoyer du soutien');
delete from public.post_supports where member_id = auth.uid();
select tests.ok((select count(*) from public.post_supports) = 0, 'il peut retirer son soutien');

insert into public.event_attendees (event_id, member_id) values ((select id from public.events), auth.uid());
select tests.ok((select count(*) from public.event_attendees) = 1, 'un membre peut s''inscrire à un événement');
delete from public.event_attendees where member_id = auth.uid();
select tests.ok((select count(*) from public.event_attendees) = 0, 'il peut se désinscrire');

-- Il ne peut pas modifier ni supprimer les contenus d'autrui
update public.posts set body = 'Texte modifié par un tiers';
delete from public.projects;
select tests.logout();
select tests.ok((select body from public.posts) = 'J''ai osé publier.', 'un membre ne peut pas modifier la publication d''un autre');
select tests.ok((select count(*) from public.projects) = 1, 'un membre ne peut pas supprimer le projet d''un autre');

-- ---------------------------------------------------------------------------
-- L'auteur modifie, clôture et supprime ses propres contenus
-- ---------------------------------------------------------------------------
select tests.login(:'m1');
update public.posts set title = 'Premier pas, corrigé' where author_id = auth.uid();
select tests.ok((select title from public.posts) = 'Premier pas, corrigé', 'l''auteur peut modifier sa publication');
update public.projects set status = 'cloture' where author_id = auth.uid();
select tests.ok((select status = 'cloture' from public.projects), 'l''auteur peut clôturer son projet');
select tests.logout();

-- ---------------------------------------------------------------------------
-- Ni visiteur, ni candidat, ni compte suspendu ne voient quoi que ce soit
-- ---------------------------------------------------------------------------
select tests.anon();
select tests.ok((select count(*) from public.posts) = 0, 'un visiteur ne voit aucune publication');
select tests.ok((select count(*) from public.projects) = 0, 'un visiteur ne voit aucun projet');
select tests.ok((select count(*) from public.resources) = 0, 'un visiteur ne voit aucune ressource');
select tests.ok((select count(*) from public.events) = 0, 'un visiteur ne voit aucun événement');
select tests.logout();

select tests.login(:'cand');
select tests.ok((select count(*) from public.posts) = 0, 'un candidat ne voit aucune publication');
select tests.ok((select count(*) from public.events) = 0, 'un candidat ne voit aucun événement');
do $$ begin
  begin
    insert into public.posts (author_id, body) values (auth.uid(), 'Publication d''un candidat');
    raise exception 'ÉCHEC : un candidat a pu publier';
  exception when insufficient_privilege then
    raise notice 'ok — un candidat ne peut pas publier';
  end;
end $$;
select tests.logout();

select tests.login(:'susp');
select tests.ok((select count(*) from public.posts) = 0, 'un compte suspendu ne voit aucune publication');
select tests.logout();

-- ---------------------------------------------------------------------------
-- Les fondatrices administrent l'ensemble
-- ---------------------------------------------------------------------------
select tests.login(:'f1');
select tests.ok((select count(*) from public.posts) = 1, 'une fondatrice voit les publications');
update public.posts set title = 'Titre modéré';
select tests.ok((select title from public.posts) = 'Titre modéré', 'une fondatrice peut modérer une publication');
delete from public.post_comments;
select tests.ok((select count(*) from public.post_comments) = 0, 'une fondatrice peut retirer un commentaire');
delete from public.posts;
select tests.ok((select count(*) from public.posts) = 0, 'une fondatrice peut retirer une publication');
delete from public.projects;
delete from public.resources;
delete from public.events;
select tests.ok(
  (select count(*) from public.projects) = 0 and (select count(*) from public.resources) = 0
    and (select count(*) from public.events) = 0,
  'une fondatrice peut administrer projets, ressources et événements');
select tests.logout();

rollback;
