import { createBrowserRouter, Navigate } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
import { RedirectIfAuthenticated, RequireAuth, RequireZone } from './components/RouteGuard'
import HomePage from './pages/public/HomePage'
import JoinPage from './pages/public/JoinPage'
import CharterPage from './pages/public/CharterPage'
import PrivacyPage from './pages/public/PrivacyPage'
import LoginPage from './pages/auth/LoginPage'
import MagicLinkSentPage from './pages/auth/MagicLinkSentPage'
import AuthCallbackPage from './pages/auth/AuthCallbackPage'
import LinkExpiredPage from './pages/auth/LinkExpiredPage'
import DashboardPage from './pages/app/DashboardPage'
import CandidateSpacePage from './pages/app/CandidateSpacePage'
import InvitationPage from './pages/app/InvitationPage'
import RestrictedPage from './pages/app/RestrictedPage'
import ProfilePage from './pages/app/ProfilePage'
import SettingsPage from './pages/app/SettingsPage'
import GovernancePage from './pages/app/GovernancePage'
import ComingSoonPage from './pages/app/ComingSoonPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfileShell from './layouts/ProfileShell'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/nous-rejoindre', element: <JoinPage /> },
      { path: '/charte', element: <CharterPage /> },
      { path: '/confidentialite', element: <PrivacyPage /> },
      {
        path: '/connexion',
        element: (
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        ),
      },
      { path: '/connexion/envoye', element: <MagicLinkSentPage /> },
      { path: '/connexion/lien-expire', element: <LinkExpiredPage /> },
    ],
  },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  {
    // Tout ce qui suit exige une session valide.
    element: <RequireAuth />,
    children: [
      {
        // Espaces sans accès au Cocon : candidat·e, invité·e, accès restreint.
        // Le profil (prénom) reste modifiable par tout compte connecté.
        element: <RequireZone zone="candidate" />,
        children: [{ path: '/app/candidature', element: <CandidateSpacePage /> }],
      },
      {
        element: <RequireZone zone="invited" />,
        children: [{ path: '/app/invitation', element: <InvitationPage /> }],
      },
      {
        element: <RequireZone zone="blocked" />,
        children: [{ path: '/app/acces-restreint', element: <RestrictedPage /> }],
      },
      {
        // Le Cocon : membres actifs (professionnel·les, personnes accompagnées, fondatrices).
        element: <RequireZone zone="cocon" />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/app', element: <DashboardPage /> },
              {
                path: '/app/calendrier',
                element: (
                  <ComingSoonPage
                    eyebrow="Calendrier"
                    title="Calendrier partagé"
                    intro="Visios de La Parenthèse, ateliers, rencontres et lives, en heure de Paris."
                    step={3}
                    icon="🗓"
                  />
                ),
              },
              {
                path: '/app/outils',
                element: (
                  <ComingSoonPage
                    eyebrow="Boîte à Outils"
                    title="La Boîte à Outils du Cocon"
                    intro="Documents, liens utiles, supports d’ateliers, replays et synthèses."
                    step={3}
                    icon="🧰"
                  />
                ),
              },
              { path: '/app/parametres', element: <SettingsPage /> },
              {
                // Contenus réservés au cercle professionnel.
                element: <RequireZone zone="professional" />,
                children: [
                  {
                    path: '/app/fil',
                    element: (
                      <ComingSoonPage
                        eyebrow="Fil du Cocon"
                        title="Le Fil du Cocon"
                        intro="Partages, questions, petits pas, demandes de soutien, projets à tester."
                        step={2}
                        icon="🌿"
                      />
                    ),
                  },
                  {
                    path: '/app/projets',
                    element: (
                      <ComingSoonPage
                        eyebrow="Projets & Synergies"
                        title="Le Labo des Projets et les Synergies"
                        intro="Présenter un projet avant son lancement, chercher des complémentarités."
                        step={3}
                        icon="🌱"
                      />
                    ),
                  },
                  {
                    path: '/app/talents',
                    element: (
                      <ComingSoonPage
                        eyebrow="Cercle des Talents"
                        title="Le Cercle des Talents"
                        intro="L’annuaire privé des membres et leurs univers."
                        step={2}
                        icon="🤝"
                      />
                    ),
                  },
                ],
              },
              {
                element: <RequireZone zone="founder" />,
                children: [{ path: '/app/gouvernance', element: <GovernancePage /> }],
              },
            ],
          },
        ],
      },
      // Fiche « Mon Univers » : accessible à tout compte connecté (un·e candidat·e peut indiquer son prénom).
      {
        element: <ProfileShell />,
        children: [{ path: '/app/profil', element: <ProfilePage /> }],
      },
    ],
  },
  { path: '/app/*', element: <Navigate to="/app" replace /> },
  { path: '*', element: <NotFoundPage /> },
])
