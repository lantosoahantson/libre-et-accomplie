import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { NOT_CONFIGURED_MESSAGE, getSupabase, isSupabaseConfigured, siteUrl } from '../lib/supabase'
import type { Profile } from '../lib/database.types'
import { friendlyAuthError } from '../lib/auth-messages'

interface AuthState {
  /** Chargement initial de la session et du profil. */
  loading: boolean
  /** Erreur bloquante (configuration manquante, serveur injoignable…). */
  error: string | null
  session: Session | null
  profile: Profile | null
  /** Demande un lien de connexion par courriel. */
  signInWithEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<Profile>
  retry: () => void
}

/** Exporté pour les tests : permet d'injecter un état d'authentification simulé. */
export const AuthContext = createContext<AuthState | null>(null)

/** Délai au-delà duquel on cesse d'afficher un écran de chargement muet. */
const LOADING_TIMEOUT_MS = 10_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [attempt, setAttempt] = useState(0)
  const loadingRef = useRef(true)

  const loadProfile = useCallback(async (userId: string | undefined): Promise<Profile | null> => {
    if (!userId) return null
    const supabase = getSupabase()
    const { data, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (selectError) throw selectError
    if (data) return data as Profile
    // Filet de sécurité si le profil n'a pas été créé par le trigger.
    const { data: created, error: rpcError } = await supabase.rpc('ensure_own_profile')
    if (rpcError) throw rpcError
    return created as Profile
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError(NOT_CONFIGURED_MESSAGE)
      setLoading(false)
      loadingRef.current = false
      return
    }

    let cancelled = false
    setLoading(true)
    loadingRef.current = true
    setError(null)

    const timer = window.setTimeout(() => {
      if (!cancelled && loadingRef.current) {
        setError(
          'Le chargement prend trop de temps. Vérifiez votre connexion Internet, puis réessayez.',
        )
        setLoading(false)
        loadingRef.current = false
      }
    }, LOADING_TIMEOUT_MS)

    const supabase = getSupabase()

    const bootstrap = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (cancelled) return
        setSession(data.session)
        const p = await loadProfile(data.session?.user.id)
        if (cancelled) return
        setProfile(p)
      } catch (e) {
        if (!cancelled) setError(friendlyAuthError(e))
      } finally {
        if (!cancelled) {
          setLoading(false)
          loadingRef.current = false
          window.clearTimeout(timer)
        }
      }
    }
    void bootstrap()

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        return
      }
      if (
        newSession?.user &&
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')
      ) {
        // Différé pour ne pas bloquer le gestionnaire d'événements Supabase.
        window.setTimeout(() => {
          loadProfile(newSession.user.id)
            .then((p) => {
              if (!cancelled) setProfile(p)
            })
            .catch((e) => {
              if (!cancelled) setError(friendlyAuthError(e))
            })
        }, 0)
      }
    })

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      sub.subscription.unsubscribe()
    }
  }, [attempt, loadProfile])

  const signInWithEmail = useCallback(async (email: string) => {
    const supabase = getSupabase()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${siteUrl}/auth/callback`, shouldCreateUser: true },
    })
    if (otpError) throw new Error(friendlyAuthError(otpError))
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    const { error: outError } = await supabase.auth.signOut()
    if (outError) throw new Error(friendlyAuthError(outError))
    setSession(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const p = await loadProfile(session?.user.id)
    setProfile(p)
  }, [loadProfile, session])

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!session?.user.id) throw new Error('Vous devez être connecté·e.')
      const supabase = getSupabase()
      const { data, error: updError } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', session.user.id)
        .select('*')
        .single()
      if (updError) {
        throw new Error(
          updError.code === '42501' ||
            /autoris|permission|modifier ces informations/i.test(updError.message)
            ? updError.message.startsWith('Vous') ||
              updError.message.startsWith('Ce ') ||
              updError.message.startsWith("L'")
              ? updError.message
              : "Vous n'êtes pas autorisé·e à faire cette modification."
            : "L'enregistrement a échoué. Vos saisies sont conservées : réessayez dans un instant.",
        )
      }
      setProfile(data as Profile)
      return data as Profile
    },
    [session],
  )

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  const value = useMemo<AuthState>(
    () => ({
      loading,
      error,
      session,
      profile,
      signInWithEmail,
      signOut,
      refreshProfile,
      updateProfile,
      retry,
    }),
    [
      loading,
      error,
      session,
      profile,
      signInWithEmail,
      signOut,
      refreshProfile,
      updateProfile,
      retry,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>.')
  return ctx
}
