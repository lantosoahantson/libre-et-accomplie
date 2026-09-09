import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Alert,
  Badge,
  Button,
  Card,
  CharCount,
  Field,
  FilterChips,
  Input,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from '../../components/ui'
import { AuthorLine } from '../../components/AuthorLine'
import { EmptySpace } from '../../components/EmptySpace'
import { useAuth } from '../../hooks/useAuth'
import { useMembers } from '../../hooks/useDirectory'
import { useProjects } from '../../hooks/useContent'
import { timeAgo } from '../../lib/dates'
import { isFounder } from '../../lib/roles'
import {
  PROJECT_KINDS,
  PROJECT_KIND_LABELS,
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectKind,
} from '../../lib/content'

const MAX_TITLE = 120
const MAX_SUMMARY = 2000
const MAX_HELP = 500

type Draft = { kind: ProjectKind; title: string; summary: string; help_wanted: string }

function ProjectForm({
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
    initial ?? { kind: 'avis', title: '', summary: '', help_wanted: '' },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFailure(null)
    const next: Record<string, string> = {}
    if (!draft.title.trim()) next.title = 'Donnez un titre à votre projet.'
    else if (draft.title.length > MAX_TITLE)
      next.title = `Ce titre fait ${draft.title.length} caractères, la limite est de ${MAX_TITLE}.`
    if (draft.summary.length > MAX_SUMMARY)
      next.summary = `Ce texte fait ${draft.summary.length} caractères, la limite est de ${MAX_SUMMARY}.`
    if (draft.help_wanted.length > MAX_HELP)
      next.help_wanted = `Ce texte fait ${draft.help_wanted.length} caractères, la limite est de ${MAX_HELP}.`
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      await onSubmit({
        ...draft,
        title: draft.title.trim(),
        summary: draft.summary.trim(),
        help_wanted: draft.help_wanted.trim(),
      })
    } catch (err) {
      setFailure(err instanceof Error ? err.message : "L'enregistrement a échoué.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id="kind" label="Que cherchez-vous ?">
        <Select
          id="kind"
          value={draft.kind}
          onChange={(e) => setDraft({ ...draft, kind: e.target.value as ProjectKind })}
        >
          {PROJECT_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="title" label="Titre du projet" error={errors.title}>
        <Input
          id="title"
          value={draft.title}
          error={Boolean(errors.title)}
          placeholder="Un atelier, une offre, une idée…"
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <div className="mt-1 flex justify-end">
          <CharCount value={draft.title} max={MAX_TITLE} />
        </div>
      </Field>

      <Field id="summary" label="De quoi s’agit-il ?" optional error={errors.summary}>
        <Textarea
          id="summary"
          value={draft.summary}
          error={Boolean(errors.summary)}
          onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
        />
        <div className="mt-1 flex justify-end">
          <CharCount value={draft.summary} max={MAX_SUMMARY} />
        </div>
      </Field>

      <Field id="help" label="Ce que vous attendez du Cocon" optional error={errors.help_wanted}>
        <Textarea
          id="help"
          className="min-h-20"
          value={draft.help_wanted}
          error={Boolean(errors.help_wanted)}
          placeholder="Un regard, un test, une compétence précise…"
          onChange={(e) => setDraft({ ...draft, help_wanted: e.target.value })}
        />
        <div className="mt-1 flex justify-end">
          <CharCount value={draft.help_wanted} max={MAX_HELP} />
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

function ProjectCard({ project, api }: { project: Project; api: ReturnType<typeof useProjects> }) {
  const { profile } = useAuth()
  const { nameOf } = useMembers()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const mine = project.author_id === profile?.id
  const canModerate = mine || isFounder(profile)

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
    return (
      <Card as="article">
        <h2 className="mb-4 text-xl">Modifier mon projet</h2>
        <ProjectForm
          initial={{
            kind: project.kind,
            title: project.title,
            summary: project.summary,
            help_wanted: project.help_wanted,
          }}
          submitLabel="Enregistrer"
          onCancel={() => setEditing(false)}
          onSubmit={async (draft) => {
            await api.updateProject(project.id, draft)
            setEditing(false)
          }}
        />
      </Card>
    )
  }

  const closed = project.status === 'cloture'

  return (
    <Card as="article" className={`flex flex-col gap-4 ${closed ? 'opacity-75' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="rounded-full bg-sage-50 px-3 py-0.5 text-sm font-semibold text-forest-600">
          {PROJECT_KIND_LABELS[project.kind]}
        </span>
        <Badge tone={closed ? 'neutral' : 'sage'}>{PROJECT_STATUS_LABELS[project.status]}</Badge>
      </div>

      <div>
        <h2 className="text-xl">{project.title}</h2>
        {project.summary && (
          <p className="mt-1 whitespace-pre-line text-ink-soft">{project.summary}</p>
        )}
      </div>

      {project.help_wanted && (
        <div className="rounded-xl bg-sage-50 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-sage-500">
            Ce qui est recherché
          </p>
          <p className="mt-1 whitespace-pre-line text-ink-soft">{project.help_wanted}</p>
        </div>
      )}

      {failure && <Alert tone="error">{failure}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sand pt-3">
        <AuthorLine
          name={nameOf(project.author_id)}
          memberId={project.author_id}
          meta={timeAgo(project.created_at)}
        />
        {!mine && !closed && (
          <Link
            to={`/app/talents/${project.author_id}`}
            className="text-sm font-semibold no-underline text-forest-600"
          >
            Contacter →
          </Link>
        )}
      </div>

      {(mine || canModerate) && (
        <div className="flex flex-wrap gap-2 border-t border-sand pt-3">
          {mine && (
            <>
              <Button variant="ghost" className="!min-h-10 !px-4" onClick={() => setEditing(true)}>
                Modifier
              </Button>
              <Button
                variant="ghost"
                className="!min-h-10 !px-4"
                disabled={busy}
                onClick={() =>
                  run(() =>
                    api.updateProject(project.id, { status: closed ? 'ouvert' : 'cloture' }),
                  )
                }
              >
                {closed ? 'Rouvrir' : 'Clôturer'}
              </Button>
            </>
          )}
          {canModerate && (
            <Button
              variant="ghost"
              className="!min-h-10 !px-4 !text-danger-600"
              disabled={busy}
              onClick={() => {
                if (window.confirm('Supprimer ce projet ? Cette action est définitive.')) {
                  void run(() => api.deleteProject(project.id))
                }
              }}
            >
              Supprimer
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

export default function ProjectsPage() {
  const api = useProjects()
  const [filter, setFilter] = useState<ProjectKind | 'tout'>('tout')
  const [composing, setComposing] = useState(false)

  const counts = useMemo(() => {
    const map: Record<string, number> = { tout: api.projects.length }
    for (const p of api.projects) map[p.kind] = (map[p.kind] ?? 0) + 1
    return map
  }, [api.projects])

  const filtered = useMemo(
    () => (filter === 'tout' ? api.projects : api.projects.filter((p) => p.kind === filter)),
    [api.projects, filter],
  )

  return (
    <div>
      <PageHeader
        eyebrow="Projets & Synergies"
        title="Projets & Synergies"
        intro="Présenter ce que l’on prépare, demander un regard, ou chercher la compétence qui manque."
        actions={
          !composing ? (
            <Button onClick={() => setComposing(true)}>Proposer un projet</Button>
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
          <h2 className="mb-4 text-xl">Proposer un projet</h2>
          <ProjectForm
            submitLabel="Publier mon projet"
            onCancel={() => setComposing(false)}
            onSubmit={async (draft) => {
              await api.createProject(draft)
              setComposing(false)
              setFilter('tout')
            }}
          />
        </Card>
      )}

      {api.projects.length > 1 && (
        <div className="mb-6">
          <FilterChips
            options={[
              { value: 'tout' as const, label: 'Tout', count: counts.tout },
              ...PROJECT_KINDS.filter((k) => counts[k.value]).map((k) => ({
                value: k.value,
                label: k.short,
                count: counts[k.value],
              })),
            ]}
            value={filter}
            onChange={setFilter}
            label="Filtrer les projets"
          />
        </div>
      )}

      {api.loading ? (
        <div className="py-10 text-center">
          <Spinner label="Chargement des projets…" />
        </div>
      ) : api.projects.length === 0 ? (
        <EmptySpace
          icon="🌱"
          title="Aucun projet pour l’instant"
          actionLabel={composing ? undefined : 'Présenter le premier projet'}
          onAction={() => setComposing(true)}
        >
          Aucun projet n’a encore été partagé. Vous pouvez inaugurer cet espace en présentant une
          idée ou un besoin de collaboration.
        </EmptySpace>
      ) : filtered.length === 0 ? (
        <EmptySpace
          icon="🌱"
          title="Rien dans cette catégorie"
          actionLabel="Voir tous les projets"
          onAction={() => setFilter('tout')}
        >
          Aucun projet ne correspond à ce filtre.
        </EmptySpace>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} api={api} />
          ))}
        </div>
      )}

      <p className="mt-8 text-sm text-ink-muted">
        Aucun paiement et aucune commission n’existent dans Le Cocon. Les collaborations se
        construisent directement entre membres.
      </p>
    </div>
  )
}
