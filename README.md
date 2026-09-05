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

## Créer les tables sans terminal

Dans le tableau de bord Supabase → **SQL Editor → New query**, collez le contenu de
`supabase/migrations/20260904000001_fondations.sql` puis cliquez sur **Run**. Aucune installation
n'est nécessaire. La CLI reste utilisable pour qui préfère le terminal.

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

## Désigner les trois fondatrices

Les fondatrices sont désignées **côté serveur uniquement**, par identifiant de compte : leur adresse
électronique n'apparaît jamais dans l'application.

1. Chaque fondatrice se connecte une première fois à l'application (lien magique).
2. Dans le tableau de bord Supabase → **SQL Editor**, exécutez le contenu de
   `scripts/designer-fondatrices.sql` en remplaçant les adresses.

## Sécurité et confidentialité

- Toute règle d'accès est appliquée par une politique RLS dans la base (`supabase/migrations/`),
  jamais seulement à l'écran. Les tests `supabase/tests/*.sql` vérifient qu'un rôle ne voit pas ce
  qu'il ne doit pas voir.
- La table `profiles` ne contient aucune adresse électronique ; l'application ne peut pas lire
  `auth.users`.
- `.env`, `.env.local` et tout fichier de secrets sont exclus de Git (`.gitignore`).
