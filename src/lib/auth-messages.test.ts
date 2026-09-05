import { describe, expect, it } from 'vitest'
import { friendlyAuthError, isValidEmail, parseAuthErrorFromUrl } from './auth-messages'

describe('parseAuthErrorFromUrl', () => {
  it('détecte un lien expiré dans le fragment', () => {
    const r = parseAuthErrorFromUrl(
      'http://localhost:5173/auth/callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
    )
    expect(r?.expired).toBe(true)
    expect(r?.message).toMatch(/expiré/)
  })
  it('détecte une erreur dans la query', () => {
    const r = parseAuthErrorFromUrl(
      'http://localhost:5173/auth/callback?error=server_error&error_code=unexpected_failure',
    )
    expect(r).not.toBeNull()
    expect(r?.expired).toBe(false)
  })
  it('renvoie null sans erreur', () => {
    expect(parseAuthErrorFromUrl('http://localhost:5173/auth/callback?code=abc')).toBeNull()
  })
})

describe('friendlyAuthError', () => {
  it('traduit la limite d’envoi', () => {
    expect(
      friendlyAuthError(
        new Error('For security purposes, you can only request this after 60 seconds.'),
      ),
    ).toMatch(/Patientez/)
  })
  it('traduit une panne réseau', () => {
    expect(friendlyAuthError(new Error('Failed to fetch'))).toMatch(/connexion Internet/)
  })
  it('ne divulgue jamais le message brut inconnu', () => {
    expect(friendlyAuthError(new Error('secret internal detail'))).not.toMatch(/secret/)
  })
})

describe('isValidEmail', () => {
  it('accepte une adresse correcte et refuse le reste', () => {
    expect(isValidEmail('camille@exemple.fr')).toBe(true)
    expect(isValidEmail('  camille@exemple.fr ')).toBe(true)
    expect(isValidEmail('camille')).toBe(false)
    expect(isValidEmail('camille@exemple')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})
