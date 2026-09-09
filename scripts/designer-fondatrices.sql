-- =============================================================================
-- LE COCON — Désigner les trois fondatrices
--
-- À exécuter dans le tableau de bord Supabase → SQL Editor.
-- Jamais depuis l'application : ce rôle ne peut pas être accordé par l'interface.
--
-- PRÉALABLE : chaque fondatrice doit s'être connectée UNE FOIS à l'application
-- avec son adresse électronique (lien magique). Cela crée son compte.
-- L'adresse sert uniquement à retrouver ce compte ; elle n'apparaît jamais
-- dans l'annuaire ni nulle part dans l'application.
-- =============================================================================

-- ÉTAPE 1 — Remplacez les trois adresses ci-dessous, puis cliquez sur « Run ».
select public.designate_founder_by_email('adresse-fondatrice-1@exemple.fr');
select public.designate_founder_by_email('adresse-fondatrice-2@exemple.fr');
select public.designate_founder_by_email('adresse-fondatrice-3@exemple.fr');

-- ÉTAPE 2 — Vérification. Vous devez voir trois lignes, rôle « founder », statut « active ».
select f.user_id, p.role, p.status, p.first_name, p.last_name
from public.founders f
join public.profiles p on p.id = f.user_id;

-- -----------------------------------------------------------------------------
-- FACULTATIF — Préremplir prénom et Instagram
--
-- Chaque fondatrice peut le faire elle-même depuis « Mon Univers », ce qui est
-- plus simple et évite toute erreur d'attribution. Si vous préférez le faire ici,
-- décommentez et complétez. L'identifiant Instagram s'écrit SANS arobase.
--
-- Les trois comptes communiqués sont : libre_et_accomplie, lea.naturodigest,
-- essentiellement_gt. À vous d'associer chacun à la bonne adresse.
-- -----------------------------------------------------------------------------

-- update public.profiles set first_name = 'Prénom', last_name = 'Nom d''affichage',
--        instagram = 'libre_et_accomplie'
--  where id = (select id from auth.users where lower(email) = lower('adresse-fondatrice-1@exemple.fr'));

-- update public.profiles set first_name = 'Prénom', last_name = 'Nom d''affichage',
--        instagram = 'lea.naturodigest'
--  where id = (select id from auth.users where lower(email) = lower('adresse-fondatrice-2@exemple.fr'));

-- update public.profiles set first_name = 'Prénom', last_name = 'Nom d''affichage',
--        instagram = 'essentiellement_gt'
--  where id = (select id from auth.users where lower(email) = lower('adresse-fondatrice-3@exemple.fr'));

-- -----------------------------------------------------------------------------
-- Retirer une désignation faite par erreur :
-- select public.revoke_founder('<identifiant uuid affiché à l''étape 2>');
-- -----------------------------------------------------------------------------
