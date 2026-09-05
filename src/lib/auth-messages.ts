/**
 * Traduction des erreurs d'authentification Supabase en messages français
 * compréhensibles. Aucune adresse ni clé n'est jamais incluse dans ces messages.
 */
export interface AuthUrlError {
  code: string
  message: string
  expired: boolean
}

/** Analyse les paramètres d'erreur présents dans l'URL de retour (query ou fragment). */
export function parseAuthErrorFromUrl(href: string): AuthUrlError | null {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }
  const params = new URLSearchParams(url.search)
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
  const code = params.get('error_code') ?? hash.get('error_code') ?? ''
  const error = params.get('error') ?? hash.get('error') ?? ''
  const description = params.get('error_description') ?? hash.get('error_description') ?? ''
  if (!code && !error) return null

  const expired =
    code === 'otp_expired' || /expired|invalid/i.test(description) || /expired|invalid/i.test(code)

  return {
    code: code || error,
    expired,
    message: expired
      ? 'Ce lien de connexion a expiré ou a déjà été utilisé. Demandez simplement un nouveau lien.'
      : "La connexion n'a pas pu être finalisée. Demandez un nouveau lien pour réessayer.",
  }
}

/** Message français pour une erreur renvoyée par l'API d'authentification. */
export function friendlyAuthError(err: unknown): string {
  const raw = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase()
  if (!raw) return 'Une erreur inattendue est survenue. Réessayez dans un instant.'
  if (
    raw.includes('rate limit') ||
    raw.includes('too many') ||
    raw.includes('for security purposes')
  )
    return 'Un lien vient déjà d’être envoyé. Patientez une minute avant d’en demander un nouveau.'
  if (raw.includes('invalid email') || raw.includes('unable to validate email'))
    return 'Cette adresse électronique ne semble pas valide. Vérifiez-la puis réessayez.'
  if (raw.includes('signups not allowed') || (raw.includes('signup') && raw.includes('disabled')))
    return 'Les inscriptions sont fermées pour le moment. Contactez les fondatrices.'
  if (raw.includes('failed to fetch') || raw.includes('network') || raw.includes('load failed'))
    return 'Impossible de joindre le serveur. Vérifiez votre connexion Internet puis réessayez.'
  if (raw.includes('expired') || (raw.includes('invalid') && raw.includes('token')))
    return 'Ce lien de connexion a expiré ou a déjà été utilisé. Demandez un nouveau lien.'
  if (raw.includes('code verifier') || raw.includes('pkce'))
    return 'Ce lien a été ouvert dans un autre navigateur que celui où il a été demandé. Refaites la demande de lien depuis cet appareil.'
  if (raw.includes('pas encore reliée')) return err instanceof Error ? err.message : String(err)
  return 'La connexion a échoué. Réessayez, ou demandez un nouveau lien de connexion.'
}

/** Validation simple d'une adresse électronique côté formulaire. */
export function isValidEmail(value: string): boolean {
  const v = value.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
}
