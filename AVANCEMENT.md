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

## Étape 2 — Cercle professionnel ⏳ à venir
Fiche « Mon Univers » complète, réseaux sociaux flexibles, Cercle des Talents, Fil du Cocon.

## Étape 3 — Vie de la communauté ⏳ à venir
## Étape 4 — Gouvernance ⏳ à venir
## Étape 5 — Fiabilisation et mise en production ⏳ à venir

---

## Vos actions (étape 0, à faire une fois)

1. Dans Supabase → votre projet → **Project Settings → API** : repérez « Project URL » et la clé
   publique « anon public » (ou « Publishable key »).
2. Sur votre ordinateur, copiez `.env.example` en `.env.local` et remplacez les deux valeurs
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Ne montrez jamais ce fichier.
3. Dans le terminal, à la racine du projet : `npx supabase login` (ouvre le navigateur), puis
   `npx supabase link --project-ref <référence>` (la référence est la partie avant `.supabase.co`
   dans l'URL du projet ; le mot de passe de la base est demandé **dans le terminal**).
4. `npm run db:push` pour créer les tables et les règles d'accès dans votre base.
5. Dans Supabase → **Authentication → URL Configuration** : Site URL `http://localhost:5173`,
   Redirect URLs `http://localhost:5173/**`.
6. Dans Supabase → **Authentication → Emails → Templates → Magic Link** : collez le contenu de
   `supabase/templates/magic_link.html`, objet « Votre lien de connexion au Cocon ».
7. `npm run dev`, puis ouvrez http://localhost:5173.

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
- Une personne en pause reste membre (accès conservé), sa fiche est masquée automatiquement.
- Une personne accompagnée voit les fiches professionnelles ouvertes à son cercle et les autres
  personnes accompagnées actives (nécessaire pour les futures publications de son cercle).
- Les fondatrices sont désignées par SQL côté serveur (`scripts/designer-fondatrices.sql`) :
  l'application ne peut pas accorder ce rôle.
