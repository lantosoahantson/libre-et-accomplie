import { describe, expect, it } from 'vitest'
import {
  MAX_OTHER_SOCIAL_LINKS,
  guessNetwork,
  instagramDisplay,
  instagramUrl,
  normalizeUrl,
  parseInstagram,
  shortUrl,
  socialLinkLabel,
} from './social'

describe('Instagram — scénarios 12 et 13 du cahier des charges', () => {
  it('accepte @identifiant et en fait un lien valide', () => {
    const { handle, error } = parseInstagram('@le.cocon')
    expect(error).toBeNull()
    expect(handle).toBe('le.cocon')
    expect(instagramUrl(handle)).toBe('https://instagram.com/le.cocon')
  })

  it('accepte une adresse sans https:// et la normalise', () => {
    expect(parseInstagram('instagram.com/le.cocon').handle).toBe('le.cocon')
    expect(parseInstagram('www.instagram.com/le.cocon/').handle).toBe('le.cocon')
    expect(instagramUrl(parseInstagram('instagram.com/le.cocon').handle)).toBe(
      'https://instagram.com/le.cocon',
    )
  })

  it('accepte une adresse complète, avec paramètres ou barre finale', () => {
    expect(parseInstagram('https://www.instagram.com/le.cocon/?hl=fr').handle).toBe('le.cocon')
    expect(parseInstagram('https://instagr.am/le_cocon').handle).toBe('le_cocon')
  })

  it('accepte un identifiant nu et ignore les espaces autour', () => {
    expect(parseInstagram('  le_cocon  ').handle).toBe('le_cocon')
  })

  it('ne renvoie rien pour une saisie vide, sans erreur', () => {
    expect(parseInstagram('')).toEqual({ handle: null, error: null })
    expect(parseInstagram('   ')).toEqual({ handle: null, error: null })
  })

  it('explique clairement une saisie invalide au lieu de la couper', () => {
    expect(parseInstagram('@nom invalide!').error).toMatch(/pas valide/)
    expect(parseInstagram('https://facebook.com/quelquun').error).toMatch(/Instagram/)
    expect(parseInstagram('@' + 'a'.repeat(31)).error).toMatch(/pas valide/)
  })

  it('affiche l’identifiant avec une seule arobase', () => {
    expect(instagramDisplay('le.cocon')).toBe('@le.cocon')
    expect(instagramDisplay('@le.cocon')).toBe('@le.cocon')
    expect(instagramDisplay('')).toBeNull()
  })
})

describe('Adresses des autres réseaux et du site', () => {
  it('ajoute le protocole manquant', () => {
    expect(normalizeUrl('monsite.fr').url).toBe('https://monsite.fr')
    expect(normalizeUrl('www.monsite.fr/a-propos').url).toBe('https://www.monsite.fr/a-propos')
  })

  it('conserve une adresse déjà complète', () => {
    expect(normalizeUrl('https://threads.net/@le.cocon').url).toBe('https://threads.net/@le.cocon')
  })

  it('refuse une adresse incomplète avec un message compréhensible', () => {
    expect(normalizeUrl('bonjour').error).toMatch(/incomplète/)
  })

  it('refuse les adresses dangereuses', () => {
    expect(normalizeUrl('javascript:alert(1)').error).toMatch(/pas autorisé/)
  })

  it('devine le réseau à partir de l’adresse', () => {
    expect(guessNetwork('https://www.linkedin.com/in/quelquun')).toBe('linkedin')
    expect(guessNetwork('threads.net/@le.cocon')).toBe('threads')
    expect(guessNetwork('facebook.com/lecocon')).toBe('facebook')
    expect(guessNetwork('tiktok.com/@lecocon')).toBe('tiktok')
    expect(guessNetwork('youtu.be/abc')).toBe('youtube')
    expect(guessNetwork('pinterest.fr/lecocon')).toBe('pinterest')
    expect(guessNetwork('exemple.fr')).toBe('other')
  })

  it('affiche un libellé lisible et une adresse raccourcie', () => {
    expect(socialLinkLabel({ network: 'threads', label: '' })).toBe('Threads')
    expect(socialLinkLabel({ network: 'other', label: 'Mon podcast' })).toBe('Mon podcast')
    expect(shortUrl('https://www.monsite.fr/')).toBe('monsite.fr')
  })

  it('autorise huit liens supplémentaires', () => {
    expect(MAX_OTHER_SOCIAL_LINKS).toBe(8)
  })
})
