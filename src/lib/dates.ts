/**
 * Dates et heures du Cocon, toujours exprimées en Europe/Paris.
 * Le fuseau est explicite partout : l'affichage ne dépend jamais du réglage
 * de l'appareil qui consulte l'application.
 */

export const TIMEZONE = 'Europe/Paris'

/** Décalage du fuseau à un instant donné, en millisecondes. */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  const asIfUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second'),
  )
  return asIfUtc - instant.getTime()
}

/**
 * Construit l'instant correspondant à une date et une heure lues à Paris.
 * Gère le passage à l'heure d'été sans dépendance externe.
 */
export function parisInstant(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute)
  const firstGuess = new Date(naive - zoneOffsetMs(new Date(naive), TIMEZONE))
  // Une seconde passe suffit à corriger les cas situés à la bascule horaire.
  return new Date(naive - zoneOffsetMs(firstGuess, TIMEZONE))
}

/** Composantes de la date telle qu'elle est lue à Paris. */
export function parisParts(instant: Date): {
  year: number
  month: number
  day: number
  weekday: number
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(instant)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: weekdays.indexOf(get('weekday')),
  }
}

/**
 * Prochain jour de la semaine à l'heure indiquée, en heure de Paris.
 * `weekday` suit la convention 0 = dimanche, 4 = jeudi.
 */
export function nextWeekdayAt(
  weekday: number,
  hour: number,
  minute = 0,
  weeksAhead = 0,
  from = new Date(),
): Date {
  const today = parisParts(from)
  let delta = (weekday - today.weekday + 7) % 7
  const candidate = parisInstant(today.year, today.month, today.day + delta, hour, minute)
  if (candidate.getTime() <= from.getTime()) delta += 7
  return parisInstant(today.year, today.month, today.day + delta + weeksAhead * 7, hour, minute)
}

/** Décalage en jours à partir d'aujourd'hui, à l'heure indiquée, en heure de Paris. */
export function daysFromNowAt(days: number, hour: number, minute = 0, from = new Date()): Date {
  const today = parisParts(from)
  return parisInstant(today.year, today.month, today.day + days, hour, minute)
}

const dayFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIMEZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const dayShortFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIMEZONE,
  day: 'numeric',
  month: 'short',
})
const timeFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
})

/** « jeudi 18 septembre » */
export function formatDay(value: string | Date): string {
  return dayFormat.format(new Date(value))
}

/** « 18 sept. » */
export function formatDayShort(value: string | Date): string {
  return dayShortFormat.format(new Date(value))
}

/** « 18:00 » */
export function formatTime(value: string | Date): string {
  return timeFormat.format(new Date(value))
}

/** « jeudi 18 septembre à 18:00, heure de Paris » */
export function formatDateTime(value: string | Date): string {
  return `${formatDay(value)} à ${formatTime(value)}`
}

/** Durée écoulée, en français, pour les publications. */
export function timeAgo(value: string | Date, from = new Date()): string {
  const diff = from.getTime() - new Date(value).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  return formatDay(value)
}

/** Vrai si l'instant est encore à venir. */
export function isUpcoming(value: string | Date, from = new Date()): boolean {
  return new Date(value).getTime() >= from.getTime()
}

/** Découpe un instant en champs de formulaire, lus en heure de Paris. */
export function toParisInputs(value: string | Date): { date: string; time: string } {
  const d = new Date(value)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const hour = get('hour') === '24' ? '00' : get('hour')
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${hour}:${get('minute')}` }
}

/** Recompose un instant à partir des champs de formulaire, interprétés à Paris. */
export function fromParisInputs(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const t = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!d || !t) return null
  const instant = parisInstant(Number(d[1]), Number(d[2]), Number(d[3]), Number(t[1]), Number(t[2]))
  return Number.isNaN(instant.getTime()) ? null : instant
}
