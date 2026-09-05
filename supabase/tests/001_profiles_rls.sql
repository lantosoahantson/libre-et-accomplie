-- Tests RLS : profils, rôles et statuts (scénarios 1, 2, 3, 7, 8, 9, 10 de la section 19)
\set ON_ERROR_STOP on
begin;

-- Comptes fictifs (courriels manifestement factices)
select tests.new_user('demo-fondatrice1@exemple.test')  as f1 \gset
select tests.new_user('demo-fondatrice2@exemple.test')  as f2 \gset
select tests.new_user('demo-fondatrice3@exemple.test')  as f3 \gset
select tests.new_user('demo-pro-active@exemple.test')   as pro \gset
select tests.new_user('demo-pro-masquee@exemple.test')  as pro_hidden \gset
select tests.new_user('demo-pro-pause@exemple.test')    as pro_paused \gset
select tests.new_user('demo-candidate@exemple.test')    as cand \gset
select tests.new_user('demo-refusee@exemple.test')      as refused \gset
select tests.new_user('demo-suspendue@exemple.test')    as suspended \gset
select tests.new_user('demo-accompagnee@exemple.test', '{"invited_as":"accompanied"}') as acc \gset

-- Le trigger a créé les profils avec le bon rôle de départ
select tests.ok((select count(*) from public.profiles) = 10, 'un profil est créé automatiquement pour chaque compte');
select tests.ok((select role = 'candidate' and status = 'pending' from public.profiles where id = :'cand'), 'un nouveau compte démarre comme candidat en attente');
select tests.ok((select role = 'accompanied' and status = 'invited' from public.profiles where id = :'acc'), 'un compte invité démarre comme personne accompagnée invitée');

-- Désignation des fondatrices (côté serveur uniquement)
select public.designate_founder(:'f1');
select public.designate_founder_by_email('DEMO-Fondatrice2@exemple.test');
select public.designate_founder(:'f3');
select tests.ok((select count(*) from public.founders) = 3, 'trois fondatrices désignées');
select tests.ok((select role = 'founder' and status = 'active' from public.profiles where id = :'f2'), 'la désignation par courriel active le rôle fondatrice');

do $$ begin
  begin
    perform public.designate_founder((select id from auth.users where email = 'demo-pro-active@exemple.test'));
    raise exception 'ÉCHEC : une quatrième fondatrice a pu être ajoutée';
  exception when check_violation then
    raise notice 'ok — impossible d''ajouter une quatrième fondatrice';
  end;
end $$;

-- Mise en place des statuts (en tant qu'administration serveur)
update public.profiles set role = 'professional', status = 'active', first_name = 'Démo Pro' where id = :'pro';
update public.profiles set role = 'professional', status = 'active', is_hidden = true where id = :'pro_hidden';
update public.profiles set role = 'professional', status = 'paused', visible_to_accompanied = true where id = :'pro_paused';
update public.profiles set status = 'refused' where id = :'refused';
update public.profiles set role = 'professional', status = 'suspended' where id = :'suspended';
update public.profiles set status = 'active' where id = :'acc';
update public.profiles set visible_to_accompanied = true where id = :'pro';

-- ---------------------------------------------------------------------------
-- 1. Un visiteur non connecté ne voit aucune donnée privée
-- ---------------------------------------------------------------------------
select tests.anon();
select tests.ok((select count(*) from public.profiles) = 0, 'scénario 1 : un visiteur ne voit aucun profil');
select tests.ok((select count(*) from public.founders) = 0, 'scénario 1 : un visiteur ne voit pas la table des fondatrices');
select tests.ok((select count(*) from public.app_settings where audience <> 'public') = 0, 'scénario 1 : un visiteur ne voit que les paramètres publics');
select tests.ok((select count(*) from public.app_settings where key = 'intention_phrase') = 1, 'un visiteur voit la phrase d''intention (publique)');
do $$ begin
  begin
    perform public.designate_founder(gen_random_uuid());
    raise exception 'ÉCHEC : un visiteur a pu appeler designate_founder';
  exception when insufficient_privilege then
    raise notice 'ok — designate_founder est inaccessible depuis l''application';
  end;
end $$;
select tests.logout();

-- ---------------------------------------------------------------------------
-- 2 & 3. Un candidat ne voit que lui-même et n'accède pas au Cocon
-- ---------------------------------------------------------------------------
select tests.login(:'cand');
select tests.ok((select count(*) from public.profiles) = 1, 'scénario 2 : un candidat ne voit qu''un seul profil');
select tests.ok((select id = :'cand' from public.profiles), 'scénario 2 : ce profil est le sien');
select tests.ok((select count(*) from public.founders) = 0, 'un candidat ne voit pas les fondatrices');
select tests.ok((select count(*) from public.app_settings where key = 'whatsapp_link') = 0, 'scénario 3 : un candidat ne voit pas le lien WhatsApp réservé aux membres');
select tests.ok(public.is_active_member() = false, 'scénario 3 : un candidat n''est pas membre actif');
-- Il peut modifier son prénom
update public.profiles set first_name = 'Camille Démo' where id = :'cand';
select tests.ok((select first_name = 'Camille Démo' from public.profiles where id = :'cand'), 'un candidat peut modifier son propre prénom');
-- Mais pas son rôle ni son statut
do $$ begin
  begin
    update public.profiles set role = 'professional' where id = auth.uid();
    raise exception 'ÉCHEC : un candidat a pu changer son rôle';
  exception when insufficient_privilege then
    raise notice 'ok — un candidat ne peut pas changer son rôle';
  end;
  begin
    update public.profiles set status = 'active' where id = auth.uid();
    raise exception 'ÉCHEC : un candidat a pu s''activer lui-même';
  exception when insufficient_privilege then
    raise notice 'ok — un candidat ne peut pas s''activer lui-même';
  end;
end $$;
-- Ni le profil d'une autre personne (0 ligne touchée, pas d'erreur)
update public.profiles set first_name = 'PIRATÉ' where id = :'pro';
select tests.logout();
select tests.ok((select first_name = 'Démo Pro' from public.profiles where id = :'pro'), 'un candidat ne peut pas modifier le profil d''un autre membre');

-- Candidature refusée / compte suspendu : aucun accès aux contenus membres
select tests.login(:'refused');
select tests.ok((select count(*) from public.profiles) = 1, 'une candidature refusée ne voit que son propre profil');
select tests.logout();
select tests.login(:'suspended');
select tests.ok((select count(*) from public.profiles) = 1, 'un compte suspendu ne voit que son propre profil');
select tests.ok(public.is_active_member() = false, 'un compte suspendu n''est pas membre actif');
select tests.logout();

-- ---------------------------------------------------------------------------
-- 7, 9, 10. Un professionnel validé accède aux contenus professionnels
-- ---------------------------------------------------------------------------
select tests.login(:'pro');
select tests.ok(public.is_active_professional(), 'scénario 7 : un professionnel validé est reconnu comme tel');
select tests.ok((select count(*) from public.app_settings where key = 'whatsapp_link') = 1, 'scénario 7 : il voit le lien WhatsApp des membres');
select tests.ok((select count(*) from public.app_settings where key = 'replay_retention_days') = 0, 'il ne voit pas les paramètres réservés aux fondatrices');
select tests.ok((select count(*) from public.profiles where id = :'pro_hidden') = 0, 'scénario 10 : un profil masqué disparaît de l''annuaire');
select tests.ok((select count(*) from public.profiles where id = :'pro_paused') = 1, 'un membre en pause reste visible (sauf s''il se masque)');
select tests.ok((select count(*) from public.profiles where id = :'cand') = 0, 'il ne voit pas les candidats');
select tests.ok((select count(*) from public.profiles where id = :'refused') = 0, 'il ne voit pas les candidatures refusées');
select tests.ok((select count(*) from public.profiles where id = :'suspended') = 0, 'il ne voit pas les comptes suspendus');
select tests.ok((select count(*) from public.profiles where id = :'f1') = 1, 'il voit les fondatrices');
select tests.ok((select count(*) from public.founders) = 3, 'il sait qui sont les fondatrices (identifiants uniquement)');
-- Scénario 9 : aucune colonne de courriel n'existe dans profiles
select tests.ok(
  not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name ilike '%email%'),
  'scénario 9 : la table des profils ne contient aucune adresse électronique');
do $$ begin
  begin
    perform count(*) from auth.users;
    raise exception 'ÉCHEC : l''application peut lire auth.users';
  exception when insufficient_privilege then
    raise notice 'ok — scénario 9 : l''application ne peut pas lire auth.users (courriels)';
  end;
end $$;
-- Pause et retour
update public.profiles set status = 'paused' where id = auth.uid();
select tests.ok((select status = 'paused' from public.profiles where id = auth.uid()), 'un membre peut se mettre en pause');
update public.profiles set status = 'active' where id = auth.uid();
select tests.ok((select status = 'active' from public.profiles where id = auth.uid()), 'un membre peut reprendre');
do $$ begin
  begin
    update public.profiles set public_directory_consent = true where id = auth.uid();
    raise exception 'ÉCHEC : le consentement annuaire public a été accepté alors que la fonction est désactivée';
  exception when insufficient_privilege then
    raise notice 'ok — l''annuaire public reste désactivé (à valider)';
  end;
end $$;
-- Il ne peut pas modifier les paramètres
update public.app_settings set value = '"https://pirate"' where key = 'whatsapp_link';
select tests.logout();
select tests.ok((select value = '""'::jsonb from public.app_settings where key = 'whatsapp_link'), 'un professionnel ne peut pas modifier les paramètres');

-- ---------------------------------------------------------------------------
-- 8. Une personne accompagnée ne voit aucun contenu réservé aux professionnels
-- ---------------------------------------------------------------------------
select tests.login(:'acc');
select tests.ok(public.is_active_accompanied(), 'la personne accompagnée est reconnue comme telle');
select tests.ok(public.is_active_professional() = false, 'scénario 8 : elle n''est pas professionnelle');
select tests.ok((select count(*) from public.profiles where id = :'pro') = 1, 'elle voit une fiche pro ouverte à son cercle');
select tests.ok((select count(*) from public.profiles where id = :'pro_paused') = 1, 'elle voit une fiche pro en pause ouverte à son cercle');
select tests.ok((select count(*) from public.profiles where id = :'f1') = 0, 'scénario 8 : elle ne voit pas une fiche non ouverte à son cercle');
select tests.ok((select count(*) from public.profiles where id = :'pro_hidden') = 0, 'scénario 8 : elle ne voit pas une fiche masquée');
select tests.ok((select count(*) from public.profiles where id = :'cand') = 0, 'scénario 8 : elle ne voit pas les candidats');
select tests.ok((select count(*) from public.app_settings where audience = 'professionals') = 0, 'scénario 8 : elle ne voit aucun paramètre réservé aux professionnels');
select tests.logout();

-- ---------------------------------------------------------------------------
-- Fondatrices : gouvernance
-- ---------------------------------------------------------------------------
select tests.login(:'f1');
select tests.ok(public.is_founder(), 'la fondatrice est reconnue');
select tests.ok((select count(*) from public.profiles) = 10, 'une fondatrice voit tous les profils');
select tests.ok((select count(*) from public.app_settings where audience = 'founders') > 0, 'une fondatrice voit les paramètres de gouvernance');
update public.profiles set status = 'active', role = 'professional' where id = :'cand';
select tests.ok((select status = 'active' from public.profiles where id = :'cand'), 'une fondatrice peut activer un membre');
update public.app_settings set value = '"https://chat.whatsapp.com/demo"' where key = 'whatsapp_link';
select tests.ok((select value = '"https://chat.whatsapp.com/demo"'::jsonb from public.app_settings where key = 'whatsapp_link'), 'une fondatrice peut modifier un paramètre');
do $$ begin
  begin
    update public.profiles set role = 'professional' where id = auth.uid();
    raise exception 'ÉCHEC : une fondatrice a pu retirer son propre rôle';
  exception when insufficient_privilege then
    raise notice 'ok — une fondatrice ne peut pas retirer son propre rôle par erreur';
  end;
end $$;
select tests.logout();

rollback;
