-- =============================================================================
-- À exécuter AVANT d'appliquer les migrations, dans Supabase → SQL Editor.
--
-- Ce script ne modifie rien. Il affiche ce que contient déjà votre base, afin
-- que vous puissiez vérifier qu'aucune donnée réelle ne risque d'être touchée.
--
-- Les migrations du Cocon ne font qu'AJOUTER des tables et des colonnes.
-- Aucune d'elles ne supprime ni ne vide une table existante.
-- =============================================================================

-- Tables déjà présentes dans le schéma public
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- Nombre de lignes dans les tables du Cocon, si elles existent déjà
select 'profiles' as table_name, count(*) from public.profiles
union all select 'social_links', count(*) from public.social_links
union all select 'posts', count(*) from public.posts
union all select 'projects', count(*) from public.projects
union all select 'resources', count(*) from public.resources
union all select 'events', count(*) from public.events;
-- Si une de ces tables n'existe pas encore, la ligne correspondante renverra une
-- erreur : c'est normal, cela signifie simplement que la migration n'a pas encore
-- été appliquée.
