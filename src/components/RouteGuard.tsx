import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { canAccessZone, homeRouteFor, type Zone } from '../lib/roles'
import { Alert, Button, Logo, Spinner } from './ui'

/** Écran plein de chargement, avec sortie de secours : jamais de spinner infini. */
export function LoadingScreen({ label = 'Ouverture du Cocon…' }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo size="lg" />
      <Spinner size="lg" label={label} />
    </div>
  )
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <Logo size="lg" />
      <Alert tone="error" title="Un problème est survenu" className="max-w-md">
        {message}
      </Alert>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  )
}

/** Exige une session. Sinon, renvoie vers la page de connexion en mémorisant la destination. */
export function RequireAuth() {
  const { loading, error, session, retry } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen />
  if (error && !session) return <ErrorScreen message={error} onRetry={retry} />
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/connexion?next=${next}`} replace />
  }
  return <Outlet />
}

/**
 * Exige un niveau d'accès précis. Si le profil ne l'a pas, on le renvoie vers
 * sa page d'atterrissage (espace candidat, invitation, accès restreint, accueil).
 * La saisie directe d'une URL protégée aboutit donc toujours à une redirection.
 */
export function RequireZone({ zone }: { zone: Zone }) {
  const { loading, profile, error, retry } = useAuth()
  if (loading) return <LoadingScreen />
  if (!profile) {
    if (error) return <ErrorScreen message={error} onRetry={retry} />
    return <LoadingScreen label="Préparation de votre espace…" />
  }
  if (!canAccessZone(profile, zone)) return <Navigate to={homeRouteFor(profile)} replace />
  return <Outlet />
}

/** Si déjà connecté·e, une page d'authentification renvoie vers l'espace adapté. */
export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { loading, session, profile } = useAuth()
  if (loading) return <LoadingScreen />
  if (session && profile) return <Navigate to={homeRouteFor(profile)} replace />
  return <>{children}</>
}
