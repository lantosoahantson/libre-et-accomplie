import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Alert,
  Button,
  Card,
  CharCount,
  ExternalLink,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '../../components/ui'
import { TagEditor } from '../../components/TagEditor'
import { MemberUniverse } from '../../components/MemberUniverse'
import { useAuth } from '../../hooks/useAuth'
import type { DirectoryMember } from '../../hooks/useDirectory'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase'
import { PRESENCE_LABELS, type PresenceMode } from '../../lib/content'
import {
  MAX_OTHER_SOCIAL_LINKS,
  NETWORK_LABELS,
  guessNetwork,
  instagramUrl,
  normalizeUrl,
  parseInstagram,
  type SocialLink,
  type SocialNetwork,
} from '../../lib/social'

/* Limites annoncées à l'écran. Aucun texte n'est jamais coupé en silence. */
const LIMITS = {
  first_name: 60,
  last_name: 60,
  headline: 180,
  activity: 120,
  approach: 800,
  audience: 160,
  location: 80,
  current_project: 400,
  website: 300,
  label: 40,
} as const

const MAX_SKILLS = 20

interface FormState {
  firstName: string
  lastName: string
  headline: string
  activity: string
  approach: string
  skills: string[]
  contributionTopics: string[]
  audience: string
  location: string
  presence: PresenceMode
  currentProject: string
  website: string
  instagram: string
  socialLinks: SocialLink[]
}

type Errors = Partial<Record<keyof FormState | `link-${string}`, string>>

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  headline: '',
  activity: '',
  approach: '',
  skills: [],
  contributionTopics: [],
  audience: '',
  location: '',
  presence: 'les-deux',
  currentProject: '',
  website: '',
  instagram: '',
  socialLinks: [],
}

export default function ProfilePage() {
  const { profile } = useAuth()
  return <ProfileForm key={profile?.id ?? 'aucun'} />
}

function ProfileForm() {
  const { profile, updateProfile } = useAuth()

  const initial = useMemo<FormState>(() => {
    if (!profile) return emptyForm
    return {
      firstName: profile.first_name,
      lastName: profile.last_name,
      headline: profile.headline ?? '',
      activity: profile.activity ?? '',
      approach: profile.approach ?? '',
      skills: profile.skills ?? [],
      contributionTopics: profile.contribution_topics ?? [],
      audience: profile.audience ?? '',
      location: profile.location ?? '',
      presence: profile.presence ?? 'les-deux',
      currentProject: profile.current_project ?? '',
      website: profile.website ?? '',
      instagram: profile.instagram ?? '',
      socialLinks: [],
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)

  // Chargement des liens existants lorsque la base est reliée.
  useEffect(() => {
    if (!isSupabaseConfigured || !profile?.id) return
    let cancelled = false
    getSupabase()
      .from('social_links')
      .select('id, network, label, url, position')
      .eq('profile_id', profile.id)
      .order('position')
      .then(({ data }) => {
        if (cancelled || !data) return
        setForm((f) => ({
          ...f,
          socialLinks: data.map((r) => ({
            id: String(r.id),
            network: r.network as SocialNetwork,
            label: r.label ?? '',
            url: r.url,
          })),
        }))
      })
    return () => {
      cancelled = true
    }
  }, [profile?.id])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const addLink = () => {
    if (form.socialLinks.length >= MAX_OTHER_SOCIAL_LINKS) return
    set('socialLinks', [
      ...form.socialLinks,
      { id: `nouveau-${Date.now()}`, network: 'threads', label: '', url: '' },
    ])
  }

  const updateLink = (id: string, patch: Partial<SocialLink>) => {
    setSaved(false)
    setErrors((e) => ({ ...e, [`link-${id}`]: undefined }))
    setForm((f) => ({
      ...f,
      socialLinks: f.socialLinks.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }))
  }

  const removeLink = (id: string) => {
    setSaved(false)
    setForm((f) => ({ ...f, socialLinks: f.socialLinks.filter((l) => l.id !== id) }))
  }

  /** Valide tout le formulaire et renvoie les valeurs normalisées. */
  const validate = (): { values: FormState; errors: Errors } => {
    const next: Errors = {}
    const tooLong = (key: keyof typeof LIMITS, value: string) =>
      value.length > LIMITS[key]
        ? `Ce texte fait ${value.length} caractères, la limite est de ${LIMITS[key]}. Raccourcissez-le : rien ne sera coupé automatiquement.`
        : undefined

    if (!form.firstName.trim()) next.firstName = 'Indiquez au moins un prénom ou un nom d’usage.'
    for (const key of ['firstName', 'lastName'] as const) {
      const limitKey = key === 'firstName' ? 'first_name' : 'last_name'
      const msg = tooLong(limitKey, form[key])
      if (msg) next[key] = msg
    }
    for (const key of [
      'headline',
      'activity',
      'approach',
      'audience',
      'location',
      'currentProject',
    ] as const) {
      const limitKey = key === 'currentProject' ? 'current_project' : key
      const msg = tooLong(limitKey as keyof typeof LIMITS, form[key])
      if (msg) next[key] = msg
    }

    const values: FormState = { ...form }

    const instagram = parseInstagram(form.instagram)
    if (instagram.error) next.instagram = instagram.error
    else values.instagram = instagram.handle ?? ''

    const website = normalizeUrl(form.website)
    if (website.error) next.website = website.error
    else values.website = website.url ?? ''

    values.socialLinks = form.socialLinks.map((link) => {
      if (!link.url.trim()) {
        next[`link-${link.id}`] = 'Indiquez l’adresse du profil, ou retirez cette ligne.'
        return link
      }
      const normalized = normalizeUrl(link.url)
      if (normalized.error) {
        next[`link-${link.id}`] = normalized.error
        return link
      }
      if (link.label.length > LIMITS.label) {
        next[`link-${link.id}`] = `Le libellé fait ${LIMITS.label} caractères au plus.`
        return link
      }
      return { ...link, url: normalized.url ?? link.url }
    })

    return { values, errors: next }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setGlobalError(null)
    setSaved(false)

    const { values, errors: found } = validate()
    setErrors(found)
    if (Object.values(found).some(Boolean)) {
      // Les saisies restent intactes : rien n'est effacé ni tronqué.
      return
    }

    setSaving(true)
    try {
      await updateProfile({
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        headline: values.headline,
        activity: values.activity,
        approach: values.approach,
        skills: values.skills,
        contribution_topics: values.contributionTopics,
        audience: values.audience,
        location: values.location,
        presence: values.presence,
        current_project: values.currentProject,
        website: values.website,
        instagram: values.instagram,
      })
      if (profile?.id) {
        const supabase = getSupabase()
        await supabase.from('social_links').delete().eq('profile_id', profile.id)
        if (values.socialLinks.length) {
          const { error: insertError } = await supabase.from('social_links').insert(
            values.socialLinks.map((l, index) => ({
              profile_id: profile.id,
              network: l.network,
              label: l.label.trim(),
              url: l.url,
              position: index,
            })),
          )
          if (insertError) throw insertError
        }
      }
      setForm(values)
      setSaved(true)
    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? err.message
          : 'L’enregistrement a échoué. Vos saisies sont conservées : réessayez dans un instant.',
      )
    } finally {
      setSaving(false)
    }
  }

  const previewMember: DirectoryMember = {
    id: profile?.id ?? 'apercu',
    role: profile?.role ?? 'professional',
    firstName: form.firstName || 'Votre prénom',
    lastName: form.lastName,
    headline: form.headline,
    activity: form.activity,
    approach: form.approach,
    skills: form.skills,
    contributionTopics: form.contributionTopics,
    audience: form.audience,
    location: form.location,
    presence: form.presence,
    currentProject: form.currentProject,
    website: normalizeUrl(form.website).url,
    instagram: parseInstagram(form.instagram).handle,
    socialLinks: form.socialLinks.filter((l) => l.url.trim()),
    hidden: false,
  }

  const instagramPreview = instagramUrl(parseInstagram(form.instagram).handle)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Mon Univers"
        title="Ma fiche"
        intro="Vous choisissez ce que vous montrez. Tous les champs sont facultatifs, sauf votre prénom. Votre adresse électronique de connexion n’apparaît jamais dans l’annuaire."
        actions={
          <Button variant="secondary" onClick={() => setPreview((p) => !p)}>
            {preview ? 'Revenir au formulaire' : 'Voir ma fiche'}
          </Button>
        }
      />

      {preview ? (
        <div className="space-y-4">
          <Alert tone="info">Voici votre fiche telle que les autres membres la voient.</Alert>
          <MemberUniverse member={previewMember} />
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-6">
          {/* Identité */}
          <Card className="space-y-5">
            <h2 className="text-xl">Qui êtes-vous ?</h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="firstName" label="Prénom" error={errors.firstName}>
                <Input
                  id="firstName"
                  value={form.firstName}
                  error={Boolean(errors.firstName)}
                  autoComplete="given-name"
                  onChange={(e) => set('firstName', e.target.value)}
                />
                <div className="mt-1 flex justify-end">
                  <CharCount value={form.firstName} max={LIMITS.first_name} />
                </div>
              </Field>

              <Field id="lastName" label="Nom d’usage" optional error={errors.lastName}>
                <Input
                  id="lastName"
                  value={form.lastName}
                  error={Boolean(errors.lastName)}
                  autoComplete="family-name"
                  onChange={(e) => set('lastName', e.target.value)}
                />
                <div className="mt-1 flex justify-end">
                  <CharCount value={form.lastName} max={LIMITS.last_name} />
                </div>
              </Field>
            </div>

            <Field
              id="headline"
              label="Phrase de présentation"
              optional
              error={errors.headline}
              hint="Une phrase qui vous ressemble, plutôt qu’un slogan."
            >
              <Textarea
                id="headline"
                className="min-h-20"
                value={form.headline}
                error={Boolean(errors.headline)}
                onChange={(e) => set('headline', e.target.value)}
              />
              <div className="mt-1 flex justify-end">
                <CharCount value={form.headline} max={LIMITS.headline} />
              </div>
            </Field>

            <Field id="activity" label="Activité ou projet actuel" optional error={errors.activity}>
              <Input
                id="activity"
                value={form.activity}
                error={Boolean(errors.activity)}
                placeholder="Sophrologue, en construction de projet…"
                onChange={(e) => set('activity', e.target.value)}
              />
              <div className="mt-1 flex justify-end">
                <CharCount value={form.activity} max={LIMITS.activity} />
              </div>
            </Field>

            <Field
              id="approach"
              label="Votre approche, votre univers"
              optional
              error={errors.approach}
            >
              <Textarea
                id="approach"
                value={form.approach}
                error={Boolean(errors.approach)}
                onChange={(e) => set('approach', e.target.value)}
              />
              <div className="mt-1 flex justify-end">
                <CharCount value={form.approach} max={LIMITS.approach} />
              </div>
            </Field>
          </Card>

          {/* Compétences */}
          <Card className="space-y-5">
            <h2 className="text-xl">Ce que vous savez faire</h2>

            <Field
              id="skills"
              label="Compétences et savoir-faire"
              optional
              hint="Y compris en dehors de votre activité principale."
            >
              <TagEditor
                id="skills"
                items={form.skills}
                onChange={(items) => set('skills', items)}
                max={MAX_SKILLS}
                placeholder="Une compétence, puis Entrée"
              />
            </Field>

            <Field
              id="topics"
              label="Sujets sur lesquels vous pouvez contribuer"
              optional
              hint="Ce sur quoi une autre personne peut vous solliciter."
            >
              <TagEditor
                id="topics"
                items={form.contributionTopics}
                onChange={(items) => set('contributionTopics', items)}
                max={MAX_SKILLS}
                placeholder="Un sujet, puis Entrée"
              />
            </Field>

            <Field id="audience" label="Public accompagné" optional error={errors.audience}>
              <Input
                id="audience"
                value={form.audience}
                error={Boolean(errors.audience)}
                onChange={(e) => set('audience', e.target.value)}
              />
              <div className="mt-1 flex justify-end">
                <CharCount value={form.audience} max={LIMITS.audience} />
              </div>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="location" label="Localisation" optional error={errors.location}>
                <Input
                  id="location"
                  value={form.location}
                  error={Boolean(errors.location)}
                  placeholder="Nantes, Lyon…"
                  onChange={(e) => set('location', e.target.value)}
                />
                <div className="mt-1 flex justify-end">
                  <CharCount value={form.location} max={LIMITS.location} />
                </div>
              </Field>

              <Field id="presence" label="Vous exercez">
                <Select
                  id="presence"
                  value={form.presence}
                  onChange={(e) => set('presence', e.target.value as PresenceMode)}
                >
                  {(Object.keys(PRESENCE_LABELS) as PresenceMode[]).map((key) => (
                    <option key={key} value={key}>
                      {PRESENCE_LABELS[key]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              id="currentProject"
              label="Projet du moment"
              optional
              error={errors.currentProject}
            >
              <Textarea
                id="currentProject"
                className="min-h-20"
                value={form.currentProject}
                error={Boolean(errors.currentProject)}
                onChange={(e) => set('currentProject', e.target.value)}
              />
              <div className="mt-1 flex justify-end">
                <CharCount value={form.currentProject} max={LIMITS.current_project} />
              </div>
            </Field>
          </Card>

          {/* Réseaux */}
          <Card className="space-y-5">
            <div>
              <h2 className="text-xl">Où vous retrouver</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Un seul compte Instagram, et jusqu’à {MAX_OTHER_SOCIAL_LINKS} autres réseaux si vous
                le souhaitez.
              </p>
            </div>

            <Field
              id="website"
              label="Site Internet ou lien principal"
              optional
              error={errors.website}
            >
              <Input
                id="website"
                value={form.website}
                error={Boolean(errors.website)}
                placeholder="monsite.fr"
                inputMode="url"
                onChange={(e) => set('website', e.target.value)}
              />
            </Field>

            <Field
              id="instagram"
              label="Instagram principal"
              optional
              error={errors.instagram}
              hint="Écrivez @moncompte, instagram.com/moncompte ou l’adresse complète : le lien est reconstruit tout seul."
            >
              <Input
                id="instagram"
                value={form.instagram}
                error={Boolean(errors.instagram)}
                placeholder="@moncompte"
                onChange={(e) => set('instagram', e.target.value)}
              />
              {instagramPreview && (
                <p className="mt-2 text-sm text-ink-muted">
                  Lien enregistré :{' '}
                  <ExternalLink href={instagramPreview}>{instagramPreview}</ExternalLink>
                </p>
              )}
            </Field>

            <div>
              <p className="label">Autres réseaux sociaux</p>
              {form.socialLinks.length === 0 && (
                <p className="mb-3 text-sm text-ink-muted">Aucun autre réseau pour l’instant.</p>
              )}

              <ul className="space-y-3">
                {form.socialLinks.map((link) => (
                  <li key={link.id} className="rounded-xl border border-sand bg-cream p-4">
                    <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                      <div>
                        <label htmlFor={`network-${link.id}`} className="sr-only">
                          Type de réseau
                        </label>
                        <Select
                          id={`network-${link.id}`}
                          value={link.network}
                          onChange={(e) =>
                            updateLink(link.id, { network: e.target.value as SocialNetwork })
                          }
                        >
                          {(Object.keys(NETWORK_LABELS) as SocialNetwork[]).map((key) => (
                            <option key={key} value={key}>
                              {NETWORK_LABELS[key]}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label htmlFor={`url-${link.id}`} className="sr-only">
                          Adresse du profil
                        </label>
                        <Input
                          id={`url-${link.id}`}
                          value={link.url}
                          inputMode="url"
                          error={Boolean(errors[`link-${link.id}`])}
                          placeholder="threads.net/@moncompte"
                          onChange={(e) => {
                            const url = e.target.value
                            updateLink(link.id, {
                              url,
                              network:
                                link.network === 'threads' && url
                                  ? guessNetwork(url)
                                  : link.network,
                            })
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                      <div>
                        <label htmlFor={`label-${link.id}`} className="sr-only">
                          Libellé personnalisé
                        </label>
                        <Input
                          id={`label-${link.id}`}
                          value={link.label}
                          placeholder="Libellé personnalisé (facultatif)"
                          onChange={(e) => updateLink(link.id, { label: e.target.value })}
                        />
                      </div>
                      <Button variant="danger" onClick={() => removeLink(link.id)}>
                        Retirer
                      </Button>
                    </div>

                    {errors[`link-${link.id}`] && (
                      <p className="mt-2 text-sm font-medium text-danger-600" role="alert">
                        {errors[`link-${link.id}`]}
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={addLink}
                  disabled={form.socialLinks.length >= MAX_OTHER_SOCIAL_LINKS}
                >
                  Ajouter un réseau
                </Button>
                <span className="text-sm text-ink-muted">
                  {form.socialLinks.length} / {MAX_OTHER_SOCIAL_LINKS}
                </span>
              </div>
            </div>
          </Card>

          {globalError && <Alert tone="error">{globalError}</Alert>}
          {Object.values(errors).some(Boolean) && (
            <Alert tone="error" title="Quelques champs demandent une correction">
              Vos saisies sont conservées. Corrigez les champs signalés en rouge, puis enregistrez
              de nouveau.
            </Alert>
          )}
          {saved && <Alert tone="success">Votre fiche est bien enregistrée.</Alert>}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer ma fiche'}
            </Button>
            <Button variant="ghost" onClick={() => setPreview(true)}>
              Voir le résultat
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
