import { useMemo, useState, type FormEvent } from 'react'
import {
  Alert,
  Button,
  Card,
  CharCount,
  ExternalLink,
  Field,
  Input,
  PageHeader,
  Spinner,
  Textarea,
} from '../../components/ui'
import { EmptySpace } from '../../components/EmptySpace'
import { useAuth } from '../../hooks/useAuth'
import { useMembers } from '../../hooks/useDirectory'
import { useEvents } from '../../hooks/useContent'
import { formatDateTime, fromParisInputs, isUpcoming, toParisInputs } from '../../lib/dates'
import { isFounder } from '../../lib/roles'
import type { CocoonEvent } from '../../lib/content'

const MAX_TITLE = 140
const MAX_DESCRIPTION = 1000

type Draft = {
  title: string
  date: string
  time: string
  duration_min: string
  host_name: string
  location: string
  description: string
}

const emptyDraft: Draft = {
  title: '',
  date: '',
  time: '18:00',
  duration_min: '90',
  host_name: '',
  location: '',
  description: '',
}

function EventForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Draft
  submitLabel: string
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>(initial ?? emptyDraft)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFailure(null)
    const next: Record<string, string> = {}

    if (!draft.title.trim()) next.title = 'Donnez un titre à cet événement.'
    else if (draft.title.length > MAX_TITLE)
      next.title = `Ce titre fait ${draft.title.length} caractères, la limite est de ${MAX_TITLE}.`

    const starts = fromParisInputs(draft.date, draft.time)
    if (!draft.date) next.date = 'Indiquez la date.'
    else if (!starts) next.date = 'Cette date ou cette heure n’est pas valide.'

    const duration = Number(draft.duration_min)
    if (!Number.isFinite(duration) || duration < 5 || duration > 1440)
      next.duration_min = 'Indiquez une durée entre 5 et 1440 minutes.'

    if (draft.description.length > MAX_DESCRIPTION)
      next.description = `Ce texte fait ${draft.description.length} caractères, la limite est de ${MAX_DESCRIPTION}.`

    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      await onSubmit({
        title: draft.title.trim(),
        description: draft.description.trim(),
        host_name: draft.host_name.trim(),
        starts_at: starts!.toISOString(),
        duration_min: duration,
        location: draft.location.trim(),
      })
    } catch (err) {
      setFailure(err instanceof Error ? err.message : "L'enregistrement a échoué.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id="title" label="Titre" error={errors.title}>
        <Input
          id="title"
          value={draft.title}
          error={Boolean(errors.title)}
          placeholder="La Parenthèse, un atelier, un café…"
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <div className="mt-1 flex justify-end">
          <CharCount value={draft.title} max={MAX_TITLE} />
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="date" label="Date" error={errors.date}>
          <Input
            id="date"
            type="date"
            value={draft.date}
            error={Boolean(errors.date)}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
        </Field>
        <Field id="time" label="Heure (Paris)">
          <Input
            id="time"
            type="time"
            value={draft.time}
            onChange={(e) => setDraft({ ...draft, time: e.target.value })}
          />
        </Field>
        <Field id="duration" label="Durée (minutes)" error={errors.duration_min}>
          <Input
            id="duration"
            type="number"
            inputMode="numeric"
            min={5}
            max={1440}
            value={draft.duration_min}
            error={Boolean(errors.duration_min)}
            onChange={(e) => setDraft({ ...draft, duration_min: e.target.value })}
          />
        </Field>
      </div>

      <Field id="host" label="Animatrice" optional hint="Si ce n’est pas vous qui animez.">
        <Input
          id="host"
          value={draft.host_name}
          onChange={(e) => setDraft({ ...draft, host_name: e.target.value })}
        />
      </Field>

      <Field id="location" label="Lien de visio ou lieu" optional>
        <Input
          id="location"
          value={draft.location}
          placeholder="https://visio.exemple.fr/… ou Nantes, salle à préciser"
          onChange={(e) => setDraft({ ...draft, location: e.target.value })}
        />
      </Field>

      <Field id="description" label="Courte description" optional error={errors.description}>
        <Textarea
          id="description"
          className="min-h-20"
          value={draft.description}
          error={Boolean(errors.description)}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
        <div className="mt-1 flex justify-end">
          <CharCount value={draft.description} max={MAX_DESCRIPTION} />
        </div>
      </Field>

      {failure && <Alert tone="error">{failure}</Alert>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  )
}

export function EventCard({
  event,
  api,
  compact = false,
}: {
  event: CocoonEvent
  api: ReturnType<typeof useEvents>
  compact?: boolean
}) {
  const { profile } = useAuth()
  const { nameOf } = useMembers()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const mine = event.organizer_id === profile?.id
  const canModerate = mine || isFounder(profile)
  const going = api.isAttending(event.id)
  const attendees = api.attendeesOf(event.id).length
  const isLink = /^https?:\/\//i.test(event.location)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setFailure(null)
    try {
      await fn()
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Action impossible.')
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    const inputs = toParisInputs(event.starts_at)
    return (
      <Card as="article">
        <h2 className="mb-4 text-xl">Modifier l’événement</h2>
        <EventForm
          initial={{
            title: event.title,
            date: inputs.date,
            time: inputs.time,
            duration_min: String(event.duration_min),
            host_name: event.host_name,
            location: event.location,
            description: event.description,
          }}
          submitLabel="Enregistrer"
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            await api.updateEvent(event.id, values)
            setEditing(false)
          }}
        />
      </Card>
    )
  }

  return (
    <Card as="article" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-semibold text-forest-600">{formatDateTime(event.starts_at)}</span>
        <span className="text-sm text-ink-muted">heure de Paris · {event.duration_min} min</span>
      </div>

      <div>
        <h2 className={compact ? 'text-lg' : 'text-xl'}>{event.title}</h2>
        {event.description && (
          <p className="mt-1 whitespace-pre-line text-ink-soft">{event.description}</p>
        )}
      </div>

      <p className="text-sm text-ink-muted">
        Proposé par {nameOf(event.organizer_id)}
        {event.host_name && ` · animé par ${event.host_name}`}
        {attendees > 0 && ` · ${attendees} participante${attendees > 1 ? 's' : ''}`}
      </p>

      {failure && <Alert tone="error">{failure}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sand pt-3">
        {event.location ? (
          isLink ? (
            going || mine ? (
              <ExternalLink href={event.location}>Rejoindre</ExternalLink>
            ) : (
              <span className="text-sm text-ink-muted">
                Le lien s’affiche quand vous participez.
              </span>
            )
          ) : (
            <span className="text-sm text-ink-soft">{event.location}</span>
          )
        ) : (
          <span className="text-sm text-ink-muted">Lieu à préciser</span>
        )}

        <Button
          variant={going ? 'secondary' : 'primary'}
          className="!min-h-10 !px-4"
          disabled={busy}
          aria-pressed={going}
          onClick={() => run(() => api.toggleAttendance(event.id))}
        >
          {going ? 'Je participe' : 'Je participe ?'}
        </Button>
      </div>

      {canModerate && (
        <div className="flex flex-wrap gap-2 border-t border-sand pt-3">
          {mine && (
            <Button variant="ghost" className="!min-h-10 !px-4" onClick={() => setEditing(true)}>
              Modifier
            </Button>
          )}
          <Button
            variant="ghost"
            className="!min-h-10 !px-4 !text-danger-600"
            disabled={busy}
            onClick={() => {
              if (window.confirm('Supprimer cet événement ?'))
                void run(() => api.deleteEvent(event.id))
            }}
          >
            Supprimer
          </Button>
        </div>
      )}
    </Card>
  )
}

export default function AgendaPage() {
  const api = useEvents()
  const [composing, setComposing] = useState(false)

  const upcoming = useMemo(() => api.events.filter((e) => isUpcoming(e.starts_at)), [api.events])
  const past = useMemo(
    () =>
      api.events
        .filter((e) => !isUpcoming(e.starts_at))
        .slice()
        .reverse(),
    [api.events],
  )

  return (
    <div>
      <PageHeader
        eyebrow="Agenda"
        title="L’agenda du Cocon"
        intro="Les Parenthèses, les ateliers et les rencontres. Toutes les heures sont données en heure de Paris."
        actions={
          !composing ? (
            <Button onClick={() => setComposing(true)}>Ajouter un événement</Button>
          ) : undefined
        }
      />

      {api.error && (
        <Alert tone="error" className="mb-5">
          {api.error}
        </Alert>
      )}

      {composing && (
        <Card className="mb-6">
          <h2 className="mb-4 text-xl">Ajouter un événement</h2>
          <EventForm
            submitLabel="Ajouter à l’agenda"
            onCancel={() => setComposing(false)}
            onSubmit={async (values) => {
              await api.createEvent(values)
              setComposing(false)
            }}
          />
        </Card>
      )}

      {api.loading ? (
        <div className="py-10 text-center">
          <Spinner label="Chargement de l’agenda…" />
        </div>
      ) : api.events.length === 0 ? (
        <EmptySpace
          icon="🗓"
          title="L’agenda est encore vide"
          actionLabel={composing ? undefined : 'Programmer le premier rendez-vous'}
          onAction={() => setComposing(true)}
        >
          Aucun rendez-vous n’a encore été programmé. Vous pouvez inaugurer cet espace avec une
          visio, un atelier ou une rencontre.
        </EmptySpace>
      ) : (
        <div className="space-y-4">
          {upcoming.length === 0 ? (
            <EmptySpace
              icon="🗓"
              title="Rien à venir pour le moment"
              actionLabel="Programmer un rendez-vous"
              onAction={() => setComposing(true)}
            >
              Les rendez-vous passés restent consultables plus bas.
            </EmptySpace>
          ) : (
            upcoming.map((event) => <EventCard key={event.id} event={event} api={api} />)
          )}

          {past.length > 0 && (
            <section className="pt-4">
              <h2 className="mb-3 text-xl">Déjà passés</h2>
              <div className="space-y-4 opacity-75">
                {past.map((event) => (
                  <EventCard key={event.id} event={event} api={api} compact />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
