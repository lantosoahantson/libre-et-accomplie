import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, Button, Card, Logo } from '../../components/ui'
import { IconMail } from '../../components/icons'
import { useAuth } from '../../hooks/useAuth'

export default function MagicLinkSentPage() {
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const { signInWithEmail } = useAuth()
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const resend = async () => {
    if (!email) return
    setState('sending')
    setMessage(null)
    try {
      await signInWithEmail(email)
      setState('sent')
      setMessage('Un nouveau lien vient de partir. Pensez à vérifier vos courriers indésirables.')
    } catch (err) {
      setState('error')
      setMessage(err instanceof Error ? err.message : 'Le renvoi a échoué.')
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex justify-center">
        <Logo size="lg" />
      </div>
      <Card className="text-center">
        <IconMail className="mx-auto mb-3 h-12 w-12 text-sage-500" />
        <h1 className="text-3xl">Consultez votre boîte de réception</h1>
        <p className="mt-3 text-ink-soft">
          Un lien de connexion a été envoyé
          {email ? (
            <>
              {' '}
              à <strong className="text-ink">{email}</strong>
            </>
          ) : (
            ''
          )}
          . Ouvrez ce courriel <strong>sur cet appareil</strong> et cliquez sur « Me connecter au
          Cocon ».
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Le lien est valable une heure et ne fonctionne qu’une fois.
        </p>

        {message && (
          <Alert tone={state === 'error' ? 'error' : 'success'} className="mt-5 text-left">
            {message}
          </Alert>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="secondary"
            onClick={resend}
            loading={state === 'sending'}
            disabled={!email}
          >
            Je n’ai rien reçu : renvoyer un lien
          </Button>
          <Link
            to={`/connexion${email ? `?email=${encodeURIComponent(email)}` : ''}`}
            className="text-sm"
          >
            Utiliser une autre adresse
          </Link>
        </div>
      </Card>
    </div>
  )
}
