import { useMemo, useState, type FormEvent } from 'react'
import {
  Alert,
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
import { usePosts } from '../../hooks/useContent'
import { timeAgo } from '../../lib/dates'
import { isFounder } from '../../lib/roles'
import {
  POST_CATEGORIES,
  POST_CATEGORY_LABELS,
  POST_CATEGORY_TONE,
  type Post,
  type PostCategory,
} from '../../lib/content'

const MAX_TITLE = 120
const MAX_BODY = 4000

type Filter = PostCategory | 'tout'
type Draft = { category: PostCategory; title: string; body: string }

function PostForm({
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
  const [draft, setDraft] = useState<Draft>(initial ?? { category: 'partage', title: '', body: '' })
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFailure(null)
    const next: { title?: string; body?: string } = {}
    if (draft.title.length > MAX_TITLE)
      next.title = `Ce titre fait ${draft.title.length} caractères, la limite est de ${MAX_TITLE}. Raccourcissez-le : rien ne sera coupé automatiquement.`
    if (!draft.body.trim()) next.body = 'Écrivez au moins quelques mots.'
    else if (draft.body.length > MAX_BODY)
      next.body = `Ce texte fait ${draft.body.length} caractères, la limite est de ${MAX_BODY}.`
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      await onSubmit({ ...draft, title: draft.title.trim(), body: draft.body.trim() })
    } catch (err) {
      setFailure(err instanceof Error ? err.message : "L'enregistrement a échoué.")
    } finally {
      setSaving(false)
    }
  }

  const hint = POST_CATEGORIES.find((c) => c.value === draft.category)?.hint

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id="category" label="De quoi s’agit-il ?" hint={hint}>
        <Select
          id="category"
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value as PostCategory })}
        >
          {POST_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="title" label="Titre" optional error={errors.title}>
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

      <Field id="body" label="Votre texte" error={errors.body}>
        <Textarea
          id="body"
          value={draft.body}
          error={Boolean(errors.body)}
          placeholder="Prenez le temps qu’il vous faut."
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        />
        <div className="mt-1 flex justify-end">
          <CharCount value={draft.body} max={MAX_BODY} />
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

function PostCard({ post, feed }: { post: Post; feed: ReturnType<typeof usePosts> }) {
  const { profile } = useAuth()
  const { nameOf } = useMembers()
  const [editing, setEditing] = useState(false)
  const [openComments, setOpenComments] = useState(false)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const mine = post.author_id === profile?.id
  const canModerate = mine || isFounder(profile)
  const comments = feed.commentsOf(post.id)
  const supports = feed.supportsOf(post.id).length
  const supported = feed.isSupportedByMe(post.id)

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
        <h2 className="mb-4 text-xl">Modifier ma publication</h2>
        <PostForm
          initial={{ category: post.category, title: post.title, body: post.body }}
          submitLabel="Enregistrer"
          onCancel={() => setEditing(false)}
          onSubmit={async (draft) => {
            await feed.updatePost(post.id, draft)
            setEditing(false)
          }}
        />
      </Card>
    )
  }

  return (
    <Card as="article" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AuthorLine
          name={nameOf(post.author_id)}
          memberId={post.author_id}
          meta={timeAgo(post.created_at)}
        />
        <span
          className={`rounded-full px-3 py-0.5 text-sm font-semibold ${POST_CATEGORY_TONE[post.category]}`}
        >
          {POST_CATEGORY_LABELS[post.category]}
        </span>
      </div>

      <div>
        {post.title && <h2 className="text-xl">{post.title}</h2>}
        <p className="mt-1 whitespace-pre-line text-ink-soft">{post.body}</p>
      </div>

      {failure && <Alert tone="error">{failure}</Alert>}

      <div className="flex flex-wrap items-center gap-2 border-t border-sand pt-3">
        <Button
          variant={supported ? 'secondary' : 'ghost'}
          className="!min-h-10 !px-4"
          disabled={busy}
          aria-pressed={supported}
          onClick={() => run(() => feed.toggleSupport(post.id))}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill={supported ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              d="M12 20s-7-4.5-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5c0 5-7 9.5-7 9.5z"
              strokeLinejoin="round"
            />
          </svg>
          {supported ? 'Soutien envoyé' : 'Envoyer du soutien'}
          {supports > 0 && <span className="text-ink-muted">· {supports}</span>}
        </Button>

        <Button
          variant="ghost"
          className="!min-h-10 !px-4"
          onClick={() => setOpenComments((o) => !o)}
          aria-expanded={openComments}
        >
          {comments.length === 0
            ? 'Répondre'
            : `${comments.length} réponse${comments.length > 1 ? 's' : ''}`}
        </Button>

        {mine && (
          <Button variant="ghost" className="!min-h-10 !px-4" onClick={() => setEditing(true)}>
            Modifier
          </Button>
        )}
        {canModerate && (
          <Button
            variant="ghost"
            className="!min-h-10 !px-4 !text-danger-600"
            disabled={busy}
            onClick={() => {
              if (window.confirm('Supprimer cette publication ? Cette action est définitive.')) {
                void run(() => feed.deletePost(post.id))
              }
            }}
          >
            Supprimer
          </Button>
        )}
      </div>

      {openComments && (
        <div className="space-y-4 rounded-xl bg-sage-50 p-4">
          {comments.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Aucune réponse pour le moment. La vôtre sera la première.
            </p>
          ) : (
            <ul className="space-y-4">
              {comments.map((c) => (
                <li key={c.id} className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <AuthorLine
                      name={nameOf(c.author_id)}
                      memberId={c.author_id}
                      meta={timeAgo(c.created_at)}
                    />
                    {(c.author_id === profile?.id || isFounder(profile)) && (
                      <button
                        type="button"
                        className="min-h-9 px-2 text-sm text-danger-600 underline underline-offset-4"
                        onClick={() => run(() => feed.deleteComment(c.id))}
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                  <p className="pl-12 text-ink-soft">{c.body}</p>
                </li>
              ))}
            </ul>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!comment.trim()) return
              await run(async () => {
                await feed.addComment(post.id, comment.trim())
                setComment('')
              })
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <label htmlFor={`comment-${post.id}`} className="sr-only">
              Votre réponse
            </label>
            <Input
              id={`comment-${post.id}`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Une réponse, même courte…"
            />
            <Button type="submit" variant="secondary" disabled={!comment.trim() || busy}>
              Répondre
            </Button>
          </form>
        </div>
      )}
    </Card>
  )
}

export default function FeedPage() {
  const feed = usePosts()
  const [filter, setFilter] = useState<Filter>('tout')
  const [composing, setComposing] = useState(false)

  const counts = useMemo(() => {
    const map: Record<string, number> = { tout: feed.posts.length }
    for (const p of feed.posts) map[p.category] = (map[p.category] ?? 0) + 1
    return map
  }, [feed.posts])

  const filtered = useMemo(
    () => (filter === 'tout' ? feed.posts : feed.posts.filter((p) => p.category === filter)),
    [feed.posts, filter],
  )

  const options = [
    { value: 'tout' as const, label: 'Tout', count: counts.tout },
    ...POST_CATEGORIES.filter((c) => counts[c.value]).map((c) => ({
      value: c.value,
      label: c.label,
      count: counts[c.value],
    })),
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Fil du Cocon"
        title="Le Fil du Cocon"
        intro="Les échanges de la communauté. Les petites victoires et les besoins de soutien ont leur place ici, sans classement."
        actions={
          !composing ? <Button onClick={() => setComposing(true)}>Publier</Button> : undefined
        }
      />

      {feed.error && (
        <Alert tone="error" className="mb-5">
          {feed.error}
        </Alert>
      )}

      {composing && (
        <Card className="mb-6">
          <h2 className="mb-4 text-xl">Publier dans le Fil</h2>
          <PostForm
            submitLabel="Publier"
            onCancel={() => setComposing(false)}
            onSubmit={async (draft) => {
              await feed.createPost(draft)
              setComposing(false)
              setFilter('tout')
            }}
          />
        </Card>
      )}

      {feed.posts.length > 1 && (
        <div className="mb-6">
          <FilterChips
            options={options}
            value={filter}
            onChange={setFilter}
            label="Filtrer par type de publication"
          />
        </div>
      )}

      {feed.loading ? (
        <div className="py-10 text-center">
          <Spinner label="Chargement du Fil…" />
        </div>
      ) : feed.posts.length === 0 ? (
        <EmptySpace
          icon="🌿"
          title="Le Fil est encore silencieux"
          actionLabel={composing ? undefined : 'Écrire la première publication'}
          onAction={() => setComposing(true)}
        >
          Aucune publication n’a encore été partagée. Vous pouvez inaugurer cet espace par un
          partage, une question, un petit pas ou un besoin de soutien.
        </EmptySpace>
      ) : filtered.length === 0 ? (
        <EmptySpace
          icon="🍃"
          title="Rien dans cette catégorie"
          actionLabel="Voir tout le Fil"
          onAction={() => setFilter('tout')}
        >
          Personne n’a encore publié ici.
        </EmptySpace>
      ) : (
        <div className="space-y-4">
          {filter === 'soutien' && (
            <Alert tone="info">
              Les personnes qui publient ici traversent un moment plus difficile. Une réponse courte
              et sincère vaut mieux qu’un conseil.
            </Alert>
          )}
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} feed={feed} />
          ))}
        </div>
      )}
    </div>
  )
}
