import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Card, Field, Input, Logo } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { isValidEmail } from '../../lib/auth-messages'
import { isSupabaseConfigured } from '../../lib/supabase'

export default function LoginPage() {
  const { signInWithEmail, error: authError } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const expired = params.get('raison') === 'expire'
  const next = params.get('next')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSendError(null)
    if (!isValidEmail(email)) {
      setFieldError('Saisissez une adresse électronique complète, par exemple prenom@exemple.fr.')
      return
    }
    setFieldError(null)
    setSending(true)
    try {
      if (next) sessionStorage.setItem('cocon:next', next)
      await signInWithEmail(email)
      navigate(`/connexion/envoye?email=${encodeURIComponent(email.trim().toLowerCase())}`)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'La demande a échoué. Réessayez.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex justify-center">
        <Logo size="lg" />
      </div>
      <Card>
        <h1 className="text-3xl">Se connecter</h1>
        <p className="mt-2 text-ink-soft">
          Indiquez votre adresse électronique : nous vous envoyons un lien de connexion personnel.
          Pas de mot de passe à retenir.
        </p>
        {expired && (
          <Alert tone="warning" className="mt-4" title="Lien expiré ou déjà utilisé">
            Demandez simplement un nouveau lien ci-dessous.
          </Alert>
        )}
        {authError && (
          <Alert tone="error" className="mt-4">
            {authError}
          </Alert>
        )}
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <Field
            id="email"
            label="Adresse électronique"
            error={fieldError ?? undefined}
            hint="Elle sert uniquement à vous connecter et n’apparaît jamais dans l’annuaire."
          >
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              error={Boolean(fieldError)}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldError) setFieldError(null)
              }}
              placeholder="prenom@exemple.fr"
            />
          </Field>
          {sendError && <Alert tone="error">{sendError}</Alert>}
          <Button
            type="submit"
            className="w-full"
            loading={sending}
            disabled={!isSupabaseConfigured}
          >
            {sending ? 'Envoi du lien…' : 'Recevoir mon lien de connexion'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-ink-muted">
          Première visite ? La même adresse crée votre accès. Vous pourrez ensuite compléter votre{' '}
          <Link to="/nous-rejoindre">candidature</Link>.
        </p>
      </Card>
    </div>
  )
}
