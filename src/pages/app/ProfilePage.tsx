import { useState, type FormEvent } from 'react'
import { Alert, Button, Card, CharCount, Field, Input, PageHeader } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'

const MAX_NAME = 60

/**
 * Fiche « Mon Univers » — étape 1 : identité de base (prénom, nom d'usage).
 * Les autres champs (présentation, activité, compétences, réseaux…) arrivent à l'étape 2.
 * Règles : compteur de caractères visible, aucune troncature silencieuse,
 * confirmation visuelle d'enregistrement, saisies conservées en cas d'erreur.
 */
export default function ProfilePage() {
  const { profile } = useAuth()
  // La clé force une remise à zéro du formulaire si le compte change.
  return <ProfileForm key={profile?.id ?? 'none'} />
}

function ProfileForm() {
  const { profile, updateProfile } = useAuth()
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ first?: string; last?: string }>({})

  const dirty = firstName !== (profile?.first_name ?? '') || lastName !== (profile?.last_name ?? '')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaved(false)
    setError(null)
    const errs: { first?: string; last?: string } = {}
    if (firstName.trim().length === 0) errs.first = 'Indiquez au moins un prénom ou un nom d’usage.'
    if (firstName.length > MAX_NAME)
      errs.first = `Le prénom dépasse ${MAX_NAME} caractères : raccourcissez-le, rien ne sera coupé automatiquement.`
    if (lastName.length > MAX_NAME)
      errs.last = `Le nom dépasse ${MAX_NAME} caractères : raccourcissez-le, rien ne sera coupé automatiquement.`
    setFieldErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    try {
      await updateProfile({ first_name: firstName.trim(), last_name: lastName.trim() })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'enregistrement a échoué.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Mon Univers"
        title="Ma fiche"
        intro="Pour l’instant, votre identité. Présentation, activité, compétences et réseaux arrivent à l’étape 2."
      />
      <Card>
        <form onSubmit={submit} noValidate className="space-y-5">
          <Field id="first_name" label="Prénom" error={fieldErrors.first}>
            <Input
              id="first_name"
              value={firstName}
              error={Boolean(fieldErrors.first)}
              autoComplete="given-name"
              onChange={(e) => {
                setFirstName(e.target.value)
                setSaved(false)
              }}
            />
            <div className="mt-1 flex justify-end">
              <CharCount value={firstName} max={MAX_NAME} />
            </div>
          </Field>
          <Field
            id="last_name"
            label="Nom d’usage"
            optional
            error={fieldErrors.last}
            hint="Celui que vous souhaitez voir affiché aux autres membres."
          >
            <Input
              id="last_name"
              value={lastName}
              error={Boolean(fieldErrors.last)}
              autoComplete="family-name"
              onChange={(e) => {
                setLastName(e.target.value)
                setSaved(false)
              }}
            />
            <div className="mt-1 flex justify-end">
              <CharCount value={lastName} max={MAX_NAME} />
            </div>
          </Field>

          {error && <Alert tone="error">{error}</Alert>}
          {saved && !dirty && (
            <Alert tone="success">Vos modifications sont bien enregistrées.</Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={saving} disabled={!dirty && !saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            {dirty && !saving && (
              <span className="text-sm text-ink-muted">Modifications non enregistrées</span>
            )}
          </div>
        </form>
      </Card>
      <p className="text-sm text-ink-muted">
        Votre adresse électronique de connexion n’est jamais affichée dans l’annuaire.
      </p>
    </div>
  )
}
