# Le Cocon — La Parenthèse des Invisibles

Application web communautaire privée (responsive, installable comme PWA) pour une communauté
de professionnel·les de l'accompagnement et du bien-être.

> « Notre refuge de co-création au rythme du corps. »

## Architecture

| Couche | Choix |
| --- | --- |
| Interface | React 19 + TypeScript, Vite, Tailwind CSS v4, React Router |
| Authentification | Supabase Auth — lien magique par courriel (PKCE) |
| Base de données | Supabase PostgreSQL, schéma versionné dans `supabase/migrations/` |
| Sécurité | Row Level Security (RLS) sur chaque table, fonctions `security definer` pour les opérations sensibles |
| PWA | `vite-plugin-pwa` (installable, mise à jour automatique, aucune donnée privée en cache) |
| Hébergement prévu | Vercel (front) + Supabase (base, auth, stockage) |

Le fichier `AVANCEMENT.md` suit l'état de chaque étape et les décisions en attente des trois fondatrices.

## Mettre en ligne sur Vercel

Le dépôt contient `vercel.json` : Vercel détecte Vite, construit avec `npm run build`
et sert `dist/`. Toutes les adresses internes sont renvoyées vers `index.html`, donc
`/connexion`, `/app` ou `/auth/callback` fonctionnent même en accès direct ou après un rafraîchissement.

1. Sur vercel.com, connectez-vous avec GitHub, puis **Add New… → Project** et importez ce dépôt.
2. **Settings → Git → Production Branch** : indiquez la branche de travail en cours.
3. **Settings → Environment Variables** : ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
   `VITE_SITE_URL` est inutile en ligne : l'application utilise automatiquement l'adresse du site.
4. **Deployments → Redeploy** après tout ajout de variable.

Sans ces variables, les pages publiques s'affichent normalement et la connexion indique clairement
que la base n'est pas encore reliée.

## Démarrer sur votre ordinateur

Prérequis : Node.js (LTS) et Git.

```bash
npm install
cp .env.example .env.local     # puis remplissez .env.local (voir ci-dessous)
npm run dev                    # ouvre http://localhost:5173
```

### Fichier `.env.local` (jamais publié)

| Variable | Où la trouver dans Supabase |
| --- | --- |
| `VITE_SUPABASE_URL` | Project Settings → API → « Project URL » |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → clé « anon public » (ou « Publishable key ») |
| `VITE_SITE_URL` | `http://localhost:5173` en local ; l'adresse Vercel en production |

Seule la clé **publique** est utilisée par l'application. La clé `service_role` ne doit jamais
apparaître dans ce projet ni dans une conversation.

## Commandes utiles

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Version de production (`dist/`) |
| `npm run test` | Tests unitaires et tests des gardes de routes (Vitest) |
| `npm run test:rls` | Tests des règles d'accès de la base sur un PostgreSQL local jetable |
| `npm run test:all` | Typage + lint + tous les tests |
| `npx supabase@latest login` | Connecte la CLI à votre compte, ouvre le navigateur |
| `npx supabase@latest link --project-ref <ref>` | Relie le dossier à votre projet Supabase, mot de passe demandé dans le terminal |
| `npm run db:push` | Applique les migrations à votre base Supabase |

## Mettre le prototype en service

Dans cet ordre. Chaque étape est manuelle et se fait dans votre navigateur.

### 1. Créer les tables dans Supabase

Tableau de bord Supabase → **SQL Editor → New query**. Exécutez d'abord
`scripts/verifier-avant-migration.sql` pour voir ce que contient déjà la base : les
migrations n'ajoutent que des tables et des colonnes, elles n'en suppriment aucune.

Puis collez et exécutez, dans l'ordre, le contenu de chaque fichier de
`supabase/migrations/` :

1. `20260904000001_fondations.sql` — rôles, statuts, profils, fondatrices, paramètres
2. `20260909000001_profil_et_reseaux.sql` — fiche « Mon Univers » et réseaux sociaux
3. `20260909000002_contenus_communaute.sql` — publications, projets, ressources, agenda

La Supabase CLI fait la même chose en une commande (`npm run db:push`) pour qui
préfère le terminal.

### 2. Renseigner les variables d'environnement

| Variable | Où la trouver | Où la mettre |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → « Project URL » | Vercel → Settings → Environment Variables, et `.env.local` en local |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → clé « anon public » ou « Publishable key » | idem |
| `VITE_SITE_URL` | facultatif | inutile sur Vercel : l'application utilise l'adresse du site |

Seule la clé **publique** est utilisée. La clé `service_role` ne doit jamais figurer
dans ce dépôt, dans Vercel, ni dans une conversation. Après tout ajout de variable
dans Vercel, relancez un déploiement pour qu'elle soit prise en compte.

### 3. Déclarer les adresses de redirection dans Supabase

Supabase → **Authentication → URL Configuration** :

- **Site URL** : l'adresse de production, par exemple `https://libre-et-accomplie.vercel.app`
- **Redirect URLs** : ajoutez ces trois lignes

```
https://libre-et-accomplie.vercel.app/**
http://localhost:5173/**
http://127.0.0.1:5173/**
```

Sans cela, le lien magique reçu par courriel renvoie vers une page d'erreur.

### 4. Modèle de courriel en français

Supabase → **Authentication → Emails → Templates → Magic Link**. Objet :
« Votre lien de connexion au Cocon ». Contenu : celui de
`supabase/templates/magic_link.html`.

### 5. Désigner les trois fondatrices

Chaque fondatrice se connecte une première fois avec son adresse. Puis, dans le
**SQL Editor**, exécutez `scripts/designer-fondatrices.sql` après y avoir mis les
trois adresses. Chacune complète ensuite sa fiche depuis « Mon Univers ».

## Sécurité et confidentialité

- Toute règle d'accès est appliquée par une politique RLS dans la base (`supabase/migrations/`),
  jamais seulement à l'écran. Les tests `supabase/tests/*.sql` vérifient qu'un rôle ne voit pas ce
  qu'il ne doit pas voir.
- La table `profiles` ne contient aucune adresse électronique ; l'application ne peut pas lire
  `auth.users`.
- `.env`, `.env.local` et tout fichier de secrets sont exclus de Git (`.gitignore`).
