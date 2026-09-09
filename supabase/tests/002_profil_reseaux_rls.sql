-- Tests : fiche « Mon Univers », réseaux sociaux et absence de troncature.
-- Scénarios 9, 10, 12 à 16 de la section 19 du cahier des charges.
\set ON_ERROR_STOP on
begin;

select tests.new_user('demo-pro-a@exemple.test')      as pro_a \gset
select tests.new_user('demo-pro-b@exemple.test')      as pro_b \gset
select tests.new_user('demo-pro-masquee2@exemple.test') as pro_hidden \gset
select tests.new_user('demo-accompagnee2@exemple.test', '{"invited_as":"accompanied"}') as acc \gset
select tests.new_user('demo-candidate2@exemple.test')  as cand \gset

update public.profiles set role = 'professional', status = 'active', first_name = 'Alix',
       instagram = 'alix.demo', website = 'https://alix-demo.exemple.fr', visible_to_accompanied = true
  where id = :'pro_a';
update public.profiles set role = 'professional', status = 'active', first_name = 'Naïma' where id = :'pro_b';
update public.profiles set role = 'professional', status = 'active', is_hidden = true where id = :'pro_hidden';
update public.profiles set status = 'active' where id = :'acc';

insert into public.social_links (profile_id, network, url, label) values
  (:'pro_a', 'threads',  'https://threads.net/@alix.demo', ''),
  (:'pro_a', 'linkedin', 'https://linkedin.com/in/alix-demo', 'Mon profil pro'),
  (:'pro_hidden', 'facebook', 'https://facebook.com/masquee', '');

-- ---------------------------------------------------------------------------
-- Un seul Instagram, et aucune trace d'un second compte
-- ---------------------------------------------------------------------------
select tests.ok(
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name ilike '%instagram%') = 1,
  'la fiche ne comporte qu''un seul champ Instagram');
select tests.ok(
  not exists (select 1 from information_schema.columns
    where table_schema = 'public' and column_name ilike '%instagram%2%'
       or column_name ilike '%second%instagram%'),
  'aucun champ « deuxième Instagram » n''existe');

-- L'identifiant est stocké nu : ni arobase, ni adresse
do $$ begin
  begin
    update public.profiles set instagram = '@alix.demo' where id = (select id from auth.users where email = 'demo-pro-a@exemple.test');
    raise exception 'ÉCHEC : une arobase a été acceptée dans l''identifiant Instagram';
  exception when check_violation then
    raise notice 'ok — l''identifiant Instagram est stocké sans arobase';
  end;
  begin
    update public.profiles set instagram = 'https://instagram.com/alix' where id = (select id from auth.users where email = 'demo-pro-a@exemple.test');
    raise exception 'ÉCHEC : une adresse complète a été acceptée comme identifiant';
  exception when check_violation then
    raise notice 'ok — une adresse complète est refusée comme identifiant';
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Scénario 16 : aucun texte n'est tronqué en silence
-- ---------------------------------------------------------------------------
do $$
declare v_id uuid := (select id from auth.users where email = 'demo-pro-a@exemple.test');
begin
  begin
    update public.profiles set headline = repeat('a', 181) where id = v_id;
    raise exception 'ÉCHEC : un texte trop long a été accepté';
  exception when check_violation then
    raise notice 'ok — scénario 16 : un texte trop long est refusé, jamais coupé';
  end;
  update public.profiles set approach = repeat('é', 800) where id = v_id;
  if (select char_length(approach) from public.profiles where id = v_id) <> 800 then
    raise exception 'ÉCHEC : le texte a été tronqué';
  end if;
  raise notice 'ok — scénario 16 : un texte à la limite exacte est conservé entier';
end $$;

-- ---------------------------------------------------------------------------
-- Scénario 14 : jusqu'à huit réseaux supplémentaires
-- ---------------------------------------------------------------------------
do $$
declare v_id uuid := (select id from auth.users where email = 'demo-pro-b@exemple.test');
begin
  for i in 1..8 loop
    insert into public.social_links (profile_id, network, url) values (v_id, 'other', 'https://exemple.fr/' || i);
  end loop;
  raise notice 'ok — scénario 14 : huit réseaux supplémentaires acceptés';
  begin
    insert into public.social_links (profile_id, network, url) values (v_id, 'other', 'https://exemple.fr/9');
    raise exception 'ÉCHEC : un neuvième réseau a été accepté';
  exception when check_violation then
    raise notice 'ok — le neuvième réseau est refusé avec un message clair';
  end;
  delete from public.social_links where profile_id = v_id;
  raise notice 'ok — scénario 14 : les réseaux peuvent être supprimés';
end $$;

-- Une adresse sans protocole n'entre pas en base : elle est normalisée avant.
do $$
declare v_id uuid := (select id from auth.users where email = 'demo-pro-b@exemple.test');
begin
  begin
    insert into public.social_links (profile_id, network, url) values (v_id, 'facebook', 'facebook.com/sans-protocole');
    raise exception 'ÉCHEC : une adresse sans protocole a été acceptée';
  exception when check_violation then
    raise notice 'ok — une adresse sans protocole est refusée, l''application la normalise avant';
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Scénario 15 : les liens enregistrés apparaissent bien pour les autres membres
-- ---------------------------------------------------------------------------
select tests.login(:'pro_b');
select tests.ok((select count(*) from public.social_links where profile_id = :'pro_a') = 2,
  'scénario 15 : un membre voit les deux réseaux enregistrés par une consœur');
select tests.ok((select instagram = 'alix.demo' from public.profiles where id = :'pro_a'),
  'scénario 15 : l''identifiant Instagram est visible dans l''annuaire');
select tests.ok((select count(*) from public.social_links where profile_id = :'pro_hidden') = 0,
  'scénario 10 : les réseaux d''une fiche masquée disparaissent aussi');
-- Il ne peut pas écrire chez les autres
do $$
begin
  begin
    insert into public.social_links (profile_id, network, url)
    values ((select id from public.profiles where first_name = 'Alix'), 'tiktok', 'https://tiktok.com/@pirate');
    raise exception 'ÉCHEC : un membre a pu ajouter un réseau chez quelqu''un d''autre';
  exception when insufficient_privilege then
    raise notice 'ok — impossible d''ajouter un réseau sur la fiche d''une autre personne';
  end;
end $$;
select tests.logout();
select tests.ok((select count(*) from public.social_links where profile_id = :'pro_a') = 2,
  'un membre ne peut pas ajouter un réseau sur la fiche d''une autre personne');

-- ---------------------------------------------------------------------------
-- Cercles : personne accompagnée et candidat
-- ---------------------------------------------------------------------------
select tests.login(:'acc');
select tests.ok((select count(*) from public.social_links where profile_id = :'pro_a') = 2,
  'une personne accompagnée voit les réseaux d''une fiche ouverte à son cercle');
select tests.ok((select count(*) from public.social_links where profile_id = :'pro_b') = 0,
  'scénario 8 : elle ne voit pas les réseaux d''une fiche fermée à son cercle');
select tests.logout();

select tests.login(:'cand');
select tests.ok((select count(*) from public.social_links) = 0,
  'scénario 2 : un candidat ne voit aucun réseau social');
select tests.logout();

select tests.anon();
select tests.ok((select count(*) from public.social_links) = 0,
  'scénario 1 : un visiteur ne voit aucun réseau social');
select tests.logout();

-- ---------------------------------------------------------------------------
-- Scénario 9 : toujours aucune adresse électronique dans l'annuaire
-- ---------------------------------------------------------------------------
select tests.ok(
  not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name in ('profiles', 'social_links') and column_name ilike '%email%'),
  'scénario 9 : ni la fiche ni les réseaux ne stockent d''adresse électronique');

rollback;
