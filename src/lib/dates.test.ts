import { describe, expect, it } from 'vitest'
import {
  formatDateTime,
  formatTime,
  fromParisInputs,
  isUpcoming,
  nextWeekdayAt,
  parisInstant,
  timeAgo,
  toParisInputs,
} from './dates'

describe('Fuseau Europe/Paris — scénario 18 du cahier des charges', () => {
  it('interprète une heure d’été à Paris, soit UTC+2', () => {
    // Le 18 septembre 2026 à 18:00 à Paris correspond à 16:00 UTC.
    expect(parisInstant(2026, 9, 18, 18, 0).toISOString()).toBe('2026-09-18T16:00:00.000Z')
  })

  it('interprète une heure d’hiver à Paris, soit UTC+1', () => {
    expect(parisInstant(2027, 1, 14, 18, 0).toISOString()).toBe('2027-01-14T17:00:00.000Z')
  })

  it('affiche l’heure de Paris quel que soit le fuseau de la machine', () => {
    expect(formatTime('2026-09-18T16:00:00.000Z')).toBe('18:00')
    expect(formatDateTime('2026-09-18T16:00:00.000Z')).toBe('vendredi 18 septembre à 18:00')
  })

  it('trouve le prochain jeudi à 18 heures, toujours dans le futur', () => {
    const from = new Date('2026-09-09T12:00:00.000Z') // un mercredi
    const next = nextWeekdayAt(4, 18, 0, 0, from)
    expect(next.toISOString()).toBe('2026-09-10T16:00:00.000Z')
    expect(formatDateTime(next)).toMatch(/^jeudi 10 septembre à 18:00$/)
    expect(next.getTime()).toBeGreaterThan(from.getTime())
  })

  it('saute au jeudi suivant lorsque l’heure est déjà passée', () => {
    const from = new Date('2026-09-10T17:00:00.000Z') // jeudi 19 h à Paris
    expect(nextWeekdayAt(4, 18, 0, 0, from).toISOString()).toBe('2026-09-17T16:00:00.000Z')
  })

  it('décale de quinze jours pour la récurrence de La Parenthèse', () => {
    const from = new Date('2026-09-09T12:00:00.000Z')
    expect(nextWeekdayAt(4, 18, 0, 1, from).toISOString()).toBe('2026-09-17T16:00:00.000Z')
  })
})

describe('Repères de temps', () => {
  const now = new Date('2026-09-09T12:00:00.000Z')
  it('exprime l’ancienneté en français', () => {
    expect(timeAgo(new Date('2026-09-09T11:30:00.000Z'), now)).toBe('il y a 30 min')
    expect(timeAgo(new Date('2026-09-09T08:00:00.000Z'), now)).toBe('il y a 4 h')
    expect(timeAgo(new Date('2026-09-08T12:00:00.000Z'), now)).toBe('hier')
    expect(timeAgo(new Date('2026-09-06T12:00:00.000Z'), now)).toBe('il y a 3 jours')
    expect(timeAgo(new Date('2026-08-26T12:00:00.000Z'), now)).toBe('il y a 2 semaines')
  })
  it('distingue ce qui est à venir', () => {
    expect(isUpcoming('2026-09-10T12:00:00.000Z', now)).toBe(true)
    expect(isUpcoming('2026-09-08T12:00:00.000Z', now)).toBe(false)
  })
})

describe('Champs de formulaire d’un événement', () => {
  it('découpe puis recompose une date sans dérive', () => {
    const iso = '2026-09-18T16:00:00.000Z'
    const inputs = toParisInputs(iso)
    expect(inputs).toEqual({ date: '2026-09-18', time: '18:00' })
    expect(fromParisInputs(inputs.date, inputs.time)?.toISOString()).toBe(iso)
  })

  it('interprète la saisie en heure de Paris, été comme hiver', () => {
    expect(fromParisInputs('2026-09-18', '18:00')?.toISOString()).toBe('2026-09-18T16:00:00.000Z')
    expect(fromParisInputs('2027-01-14', '18:00')?.toISOString()).toBe('2027-01-14T17:00:00.000Z')
  })

  it('refuse une saisie incomplète', () => {
    expect(fromParisInputs('', '18:00')).toBeNull()
    expect(fromParisInputs('2026-09-18', '')).toBeNull()
  })
})
