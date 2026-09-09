# Avancement — Le Cocon

Suivi lisible de la construction, mis à jour à la fin de chaque étape.

## Étape 0 — Préparation de l'environnement ✅ (côté projet)

**Terminé**
- Projet Vite + React + TypeScript + Tailwind CSS v4 + PWA initialisé.
- Dépôt Git : `.gitignore` exclut `.env`, `.env.local` et tout fichier de secrets **avant** le premier commit.
- `.env.example` avec les noms de variables et des valeurs factices.
- Supabase CLI installée dans le projet (`npx supabase …`), `supabase/config.toml` configuré en local
  (URL du site `http://localhost:5173`, modèles de courriels en français).

**Reste à faire par vous (une seule fois, sur votre ordinateur)** — voir « Vos actions » plus bas.

## Étape 1 — Fondations ✅ construit et testé

**Terminé**
- Design system : palette (sauge, forêt, crème, beige, rose poudré, ocre), typographies Lora (titres) et
  Nunito Sans (textes), composants de base (boutons, cartes, champs, alertes, compteur de caractères).
- Pages publiques : accueil, « Nous rejoindre », charte publique (version de travail), confidentialité.
- Authentification par lien magique : connexion, confirmation d'envoi, renvoi d'un lien, lien expiré,
  déconnexion, messages d'erreur en français, aucun écran de chargement sans issue (délai de secours).
- Base de données (migration `20260904000001_fondations.sql`) : rôles, statuts, `profiles` (sans adresse
  électronique), `founders` (trois maximum, désignées par identifiant), `app_settings`, triggers de
  protection, fonctions RLS, politiques RLS complètes.
- Navigation responsive : latérale sur ordinateur, barre inférieure à cinq entrées sur mobile.
- Pages protégées inaccessibles par URL directe (redirection selon rôle et statut).
- Espace candidat, espace « invitation », page d'accès restreint, accueil membre, fiche minimale
  « Mon Univers » (prénom, nom d'usage), paramètres (pause, masquage, déconnexion), vue fondatrices (lecture).

**Testé**
- 27 tests automatisés Vitest (rôles/statuts, messages d'erreur, gardes de routes par URL directe).
- 60 assertions RLS sur PostgreSQL (visiteur, candidat, refusé, suspendu, professionnel, en pause,
  masqué, personne accompagnée, fondatrice) : scénarios 1, 2, 3, 7, 8, 9, 10 de la section 19.
- Contrôle visuel automatisé (ordinateur 1280 px et mobile 390 px) de toutes les pages et parcours.
- Build de production sans erreur, PWA générée.

**Non encore vérifié (nécessite votre projet Supabase)**
- Réception réelle du courriel de lien magique et connexion de bout en bout.

## Prototype pilote ✅ construit et vérifié

Objectif : un espace presque vierge mais réellement fonctionnel, dans lequel les trois
fondatrices se connectent et publient de vrais contenus.

**Retiré**
- Tous les contenus fictifs : six profils, huit publications, cinq projets, huit ressources,
  quatre événements.
- Le mode démonstration : bandeau, sélecteur de rôle, stockage dans le navigateur, entrée
  depuis la page de connexion. Les fichiers `demo-data.ts`, `useDemo.tsx` et `DemoNotice.tsx`
  n'existent plus.

**Ajouté**
- Six tables partagées dans Supabase : `posts`, `post_comments`, `post_supports`, `projects`,
  `resources`, `events`, `event_attendees`, avec leurs règles d'accès. Chacun gère ses propres
  contenus, les fondatrices administrent l'ensemble, personne d'autre ne voit rien.
- Les cinq espaces créent, modifient et suppriment réellement : publications avec catégories,
  commentaires et soutien ; projets avec type de demande et clôture ; ressources par lien externe ;
  événements avec date, heure de Paris, animatrice, lien, et participation.
- Des états vides accueillants, chacun avec un bouton pour inaugurer l'espace.
- `scripts/verifier-avant-migration.sql` pour contrôler la base avant toute migration.

**Vérifié**
- 55 tests automatisés, 106 vérifications de règles d'accès en base, 53 contrôles de bout en bout
  dans un navigateur contre une vraie base PostgreSQL avec PostgREST et de vraies règles d'accès.

## Ce qui reste à faire côté Supabase et Vercel
Voir la section « Mettre le prototype en service » du README : appliquer les trois migrations,
renseigner les deux variables d'environnement, déclarer les adresses de redirection, coller le
modèle de courriel, puis désigner les trois fondatrices.

## Ce qui n'est pas construit, volontairement
Cercle des personnes accompagnées, candidatures publiques, votes des fondatrices, charte
versionnée, notifications, messagerie privée, signalements, paiements, annuaire public,
téléversement de vidéos. L'architecture les laisse possibles plus tard.

## Décisions en attente des trois fondatrices
- Formulation finale de la vision et de la phrase d'intention (paramètre `intention_phrase`).
- Sens précis du mot « Invisibles ».
- Texte final de la charte (version de travail dans `src/lib/charter.ts`).
- Ouverture éventuelle d'une partie publique de l'annuaire (`public_directory_enabled`, désactivé).
- Ouverture complète du cercle des personnes accompagnées (`accompanied_circle_enabled`, désactivé).
- Durée de conservation des replays (`replay_retention_days`, non fixée).
- Modalités de consentement aux enregistrements, procédure de recours après modération,
  durée de conservation de certaines données, petites offres payantes, collaborations commerciales,
  commissions : non construites, à trancher ensemble.

## Choix techniques signalés
- Une personne en pause reste membre ; sa fiche est masquée automatiquement.
- Le Fil et Projets & Synergies restent réservés au cercle professionnel ; le Cercle des Talents,
  la Boîte à outils et l'Agenda sont ouverts à tous les membres.
- Les fondatrices sont désignées par SQL côté serveur : l'application ne peut pas accorder ce rôle.
- Les ressources et les replays sont référencés par un lien externe, sans hébergement de fichier.
