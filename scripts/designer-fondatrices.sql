-- À exécuter dans le tableau de bord Supabase → SQL Editor (jamais depuis l'application).
-- Chaque fondatrice doit s'être connectée une première fois à l'application.
-- Remplacez les trois adresses, puis cliquez sur « Run ».
-- L'adresse sert uniquement à retrouver le compte : elle n'est jamais affichée dans l'application.

select public.designate_founder_by_email('fondatrice-1@exemple.fr');
select public.designate_founder_by_email('fondatrice-2@exemple.fr');
select public.designate_founder_by_email('fondatrice-3@exemple.fr');

-- Vérification (identifiants uniquement) :
select f.user_id, f.designated_at, p.role, p.status, p.first_name
from public.founders f
join public.profiles p on p.id = f.user_id;

-- Pour retirer une désignation par erreur :
-- select public.revoke_founder('<identifiant uuid>');
