import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorScreen, LoadingScreen } from '../../components/RouteGuard'
import { useAuth } from '../../hooks/useAuth'
import { friendlyAuthError, parseAuthErrorFromUrl } from '../../lib/auth-messages'
import { homeRouteFor } from '../../lib/roles'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase'

/**
 * Page d'atterrissage du lien de connexion.
 * - lit une éventuelle erreur dans l'URL (lien expiré, déjà utilisé) → page dédiée ;
 * - échange le code PKCE contre une session si besoin ;
 * - attend le profil puis redirige vers l'espace adapté ;
 * - ne reste jamais bloquée : au-delà de 12 s, propose de redemander un lien.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { session, profile, loading } = useAuth()
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    const urlError = parseAuthErrorFromUrl(window.location.href)
    if (urlError) {
      navigate(`/connexion/lien-expire`, { replace: true, state: { message: urlError.message } })
      return
    }
    if (!isSupabaseConfigured) return

    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      getSupabase()
        .auth.exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) setFailure(friendlyAuthError(error))
          else window.history.replaceState({}, '', '/auth/callback')
        })
    }

    const timer = window.setTimeout(() => {
      setFailure(
        (f) =>
          f ??
          'La connexion prend trop de temps. Le lien a peut-être déjà été utilisé : demandez-en un nouveau.',
      )
    }, 12_000)
    return () => window.clearTimeout(timer)
  }, [navigate])

  useEffect(() => {
    if (loading || !session || !profile) return
    const next = sessionStorage.getItem('cocon:next')
    sessionStorage.removeItem('cocon:next')
    navigate(next && next.startsWith('/app') ? next : homeRouteFor(profile), { replace: true })
  }, [loading, session, profile, navigate])

  if (failure) {
    return <ErrorScreen message={failure} onRetry={() => navigate('/connexion?raison=expire')} />
  }
  return <LoadingScreen label="Connexion en cours…" />
}
