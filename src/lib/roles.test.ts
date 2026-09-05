import { describe, expect, it } from 'vitest'
import { accessOf, canAccessZone, canEnterCocon, homeRouteFor, isProfessionalCircle } from './roles'
import type { MemberRole, MemberStatus } from './database.types'

const p = (role: MemberRole, status: MemberStatus) => ({ role, status })

describe('accessOf — rôle × statut', () => {
  it('un visiteur non connecté est un visiteur', () => {
    expect(accessOf(null)).toBe('visitor')
    expect(accessOf(undefined)).toBe('visitor')
  })
  it('un candidat en attente reste candidat', () => {
    expect(accessOf(p('candidate', 'pending'))).toBe('candidate')
    expect(canEnterCocon(p('candidate', 'pending'))).toBe(false)
  })
  it('une candidature refusée, un compte suspendu ou sorti est bloqué', () => {
    expect(accessOf(p('candidate', 'refused'))).toBe('blocked')
    expect(accessOf(p('professional', 'suspended'))).toBe('blocked')
    expect(accessOf(p('professional', 'left'))).toBe('blocked')
    expect(accessOf(p('founder', 'suspended'))).toBe('blocked')
  })
  it('un professionnel actif ou en pause entre dans le Cocon', () => {
    expect(accessOf(p('professional', 'active'))).toBe('professional')
    expect(accessOf(p('professional', 'paused'))).toBe('professional')
    expect(canEnterCocon(p('professional', 'paused'))).toBe(true)
  })
  it('une personne accompagnée entre mais pas dans le cercle professionnel', () => {
    expect(accessOf(p('accompanied', 'active'))).toBe('accompanied')
    expect(canEnterCocon(p('accompanied', 'active'))).toBe(true)
    expect(isProfessionalCircle(p('accompanied', 'active'))).toBe(false)
    expect(canAccessZone(p('accompanied', 'active'), 'professional')).toBe(false)
    expect(canAccessZone(p('accompanied', 'active'), 'founder')).toBe(false)
  })
  it('une personne invitée doit d’abord activer son compte', () => {
    expect(accessOf(p('accompanied', 'invited'))).toBe('invited')
    expect(canEnterCocon(p('accompanied', 'invited'))).toBe(false)
  })
  it('une fondatrice accède à tout', () => {
    expect(accessOf(p('founder', 'active'))).toBe('founder')
    expect(canAccessZone(p('founder', 'active'), 'founder')).toBe(true)
    expect(canAccessZone(p('founder', 'active'), 'professional')).toBe(true)
    expect(canAccessZone(p('founder', 'active'), 'cocon')).toBe(true)
  })
  it('un professionnel n’accède pas à la gouvernance', () => {
    expect(canAccessZone(p('professional', 'active'), 'founder')).toBe(false)
  })
})

describe('homeRouteFor — redirection après connexion', () => {
  it('redirige chaque situation vers la bonne page', () => {
    expect(homeRouteFor(null)).toBe('/connexion')
    expect(homeRouteFor(p('candidate', 'pending'))).toBe('/app/candidature')
    expect(homeRouteFor(p('accompanied', 'invited'))).toBe('/app/invitation')
    expect(homeRouteFor(p('candidate', 'refused'))).toBe('/app/acces-restreint')
    expect(homeRouteFor(p('professional', 'suspended'))).toBe('/app/acces-restreint')
    expect(homeRouteFor(p('professional', 'active'))).toBe('/app')
    expect(homeRouteFor(p('accompanied', 'active'))).toBe('/app')
    expect(homeRouteFor(p('founder', 'active'))).toBe('/app')
  })
})
