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
import FeedPage from './pages/app/FeedPage'
import ProjectsPage from './pages/app/ProjectsPage'
import TalentsPage, { MemberPage } from './pages/app/TalentsPage'
import ToolboxPage from './pages/app/ToolboxPage'
import AgendaPage from './pages/app/AgendaPage'
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
              // Ouverts à tous les membres du Cocon, y compris le cercle des
              // personnes accompagnées : ce que chacun voit reste filtré par les
              // règles d'accès de la base.
              { path: '/app/agenda', element: <AgendaPage /> },
              { path: '/app/calendrier', element: <Navigate to="/app/agenda" replace /> },
              { path: '/app/outils', element: <ToolboxPage /> },
              { path: '/app/talents', element: <TalentsPage /> },
              { path: '/app/talents/:memberId', element: <MemberPage /> },
              { path: '/app/parametres', element: <SettingsPage /> },
              {
                // Réservé au cercle professionnel.
                element: <RequireZone zone="professional" />,
                children: [
                  { path: '/app/fil', element: <FeedPage /> },
                  { path: '/app/projets', element: <ProjectsPage /> },
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
