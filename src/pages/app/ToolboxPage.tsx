import { useMemo, useState, type FormEvent } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  CharCount,
  ExternalLink,
  Field,
  FilterChips,
  Input,
  PageHeader,
  SearchField,
  Select,
  Spinner,
  Textarea,
} from '../../components/ui'
import { EmptySpace } from '../../components/EmptySpace'
import { useAuth } from '../../hooks/useAuth'
import { useMembers } from '../../hooks/useDirectory'
import { useResources } from '../../hooks/useContent'
import { formatDay } from '../../lib/dates'
import { isFounder } from '../../lib/roles'
import { normalizeUrl } from '../../lib/social'
import { RESOURCE_CATEGORIES, type Resource } from '../../lib/content'

const MAX_TITLE = 140
const MAX_DESCRIPTION = 1000

type Draft = { title: string; description: string; category: string; url: string }

function ResourceForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Draft
  submitLabel: string
  onSubmit: (draft: Draft) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>(
    initial ?? { title: '', description: '', category: 'Outils', url: '' },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFailure(null)
    const next: Record<string, string> = {}
    if (!draft.title.trim()) next.title = 'Donnez un titre à cette ressource.'
    else if (draft.title.length > MAX_TITLE)
      next.title = `Ce titre fait ${draft.title.length} caractères, la limite est de ${MAX_TITLE}.`
    if (draft.description.length > MAX_DESCRIPTION)
      next.description = `Ce texte fait ${draft.description.length} caractères, la limite est de ${MAX_DESCRIPTION}.`

    const link = normalizeUrl(draft.url)
    if (!draft.url.trim()) next.url = 'Indiquez le lien vers la ressource.'
    else if (link.error) next.url = link.error

    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      await onSubmit({
        title: draft.title.trim(),
        description: draft.description.trim(),
        category: draft.category,
        url: link.url ?? draft.url,
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
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <div className="mt-1 flex justify-end">
          <CharCount value={draft.title} max={MAX_TITLE} />
        </div>
      </Field>

      <Field id="category" label="Catégorie">
        <Select
          id="category"
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
        >
          {RESOURCE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        id="url"
        label="Lien"
        error={errors.url}
        hint="Un lien externe suffit : document partagé, replay, formulaire. Rien n’est hébergé ici."
      >
        <Input
          id="url"
          value={draft.url}
          inputMode="url"
          error={Boolean(errors.url)}
          placeholder="docs.exemple.fr/ma-ressource"
          onChange={(e) => setDraft({ ...draft, url: e.target.value })}
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

function ResourceCard({
  resource,
  api,
}: {
  resource: Resource
  api: ReturnType<typeof useResources>
}) {
  const { profile } = useAuth()
  const { nameOf } = useMembers()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const mine = resource.author_id === profile?.id
  const canModerate = mine || isFounder(profile)

  if (editing) {
    return (
      <Card as="article">
        <h2 className="mb-4 text-xl">Modifier la ressource</h2>
        <ResourceForm
          initial={{
            title: resource.title,
            description: resource.description,
            category: resource.category,
            url: resource.url,
          }}
          submitLabel="Enregistrer"
          onCancel={() => setEditing(false)}
          onSubmit={async (draft) => {
            await api.updateResource(resource.id, draft)
            setEditing(false)
          }}
        />
      </Card>
    )
  }

  return (
    <Card as="article" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={resource.category === 'Replays' ? 'ochre' : 'sage'}>{resource.category}</Badge>
        <span className="text-sm text-ink-muted">{formatDay(resource.created_at)}</span>
      </div>

      <div>
        <h2 className="text-lg">{resource.title}</h2>
        {resource.description && (
          <p className="mt-1 whitespace-pre-line text-ink-soft">{resource.description}</p>
        )}
      </div>

      {failure && <Alert tone="error">{failure}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sand pt-3 text-sm">
        <span className="text-ink-muted">Partagée par {nameOf(resource.author_id)}</span>
        <ExternalLink href={resource.url}>Ouvrir</ExternalLink>
      </div>

      {canModerate && (
        <div className="flex flex-wrap gap-2">
          {mine && (
            <Button variant="ghost" className="!min-h-10 !px-4" onClick={() => setEditing(true)}>
              Modifier
            </Button>
          )}
          <Button
            variant="ghost"
            className="!min-h-10 !px-4 !text-danger-600"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm('Retirer cette ressource ?')) return
              setBusy(true)
              setFailure(null)
              try {
                await api.deleteResource(resource.id)
              } catch (err) {
                setFailure(err instanceof Error ? err.message : 'Action impossible.')
              } finally {
                setBusy(false)
              }
            }}
          >
            Retirer
          </Button>
        </div>
      )}
    </Card>
  )
}

export default function ToolboxPage() {
  const api = useResources()
  const [filter, setFilter] = useState<string>('tout')
  const [query, setQuery] = useState('')
  const [composing, setComposing] = useState(false)

  const counts = useMemo(() => {
    const map: Record<string, number> = { tout: api.resources.length }
    for (const r of api.resources) map[r.category] = (map[r.category] ?? 0) + 1
    return map
  }, [api.resources])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return api.resources.filter((r) => {
      if (filter !== 'tout' && r.category !== filter) return false
      if (!q) return true
      return `${r.title} ${r.description} ${r.category}`.toLowerCase().includes(q)
    })
  }, [api.resources, filter, query])

  return (
    <div>
      <PageHeader
        eyebrow="Boîte à outils"
        title="La Boîte à outils"
        intro="Documents, outils, comptes rendus, supports d’ateliers et replays. Une seule bibliothèque, à base de liens."
        actions={
          !composing ? (
            <Button onClick={() => setComposing(true)}>Partager une ressource</Button>
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
          <h2 className="mb-4 text-xl">Partager une ressource</h2>
          <ResourceForm
            submitLabel="Partager"
            onCancel={() => setComposing(false)}
            onSubmit={async (draft) => {
              await api.createResource(draft)
              setComposing(false)
              setFilter('tout')
            }}
          />
        </Card>
      )}

      {api.resources.length > 1 && (
        <div className="mb-6 space-y-4">
          <SearchField
            id="recherche-ressources"
            value={query}
            onChange={setQuery}
            label="Rechercher une ressource"
            placeholder="Rechercher un titre, un thème…"
          />
          <FilterChips
            options={[
              { value: 'tout', label: 'Tout', count: counts.tout },
              ...RESOURCE_CATEGORIES.filter((c) => counts[c]).map((c) => ({
                value: c as string,
                label: c,
                count: counts[c],
              })),
            ]}
            value={filter}
            onChange={setFilter}
            label="Filtrer par catégorie"
          />
        </div>
      )}

      {api.loading ? (
        <div className="py-10 text-center">
          <Spinner label="Chargement des ressources…" />
        </div>
      ) : api.resources.length === 0 ? (
        <EmptySpace
          icon="🧰"
          title="La Boîte à outils est encore vide"
          actionLabel={composing ? undefined : 'Partager la première ressource'}
          onAction={() => setComposing(true)}
        >
          Aucune ressource n’a encore été partagée. Vous pouvez inaugurer cet espace avec un
          document, un lien utile ou le replay d’un atelier.
        </EmptySpace>
      ) : filtered.length === 0 ? (
        <EmptySpace
          icon="🔍"
          title="Aucune ressource ne correspond"
          actionLabel="Tout afficher"
          onAction={() => {
            setFilter('tout')
            setQuery('')
          }}
        >
          Essayez un autre mot, ou retirez le filtre.
        </EmptySpace>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} api={api} />
          ))}
        </div>
      )}

      <p className="mt-8 text-sm text-ink-muted">
        Les replays sont référencés par un lien externe. Les règles de consentement à
        l’enregistrement et la durée de conservation restent à valider par les trois fondatrices.
      </p>
    </div>
  )
}
