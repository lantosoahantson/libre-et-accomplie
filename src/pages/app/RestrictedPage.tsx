import { useNavigate } from 'react-router-dom'
import { Button, Card, Logo } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'

const messages: Record<string, { title: string; text: string }> = {
  refused: {
    title: 'Votre candidature n’a pas été retenue',
    text: 'Nous vous remercions sincèrement de l’intérêt porté au Cocon. Cet espace ne donne pas accès aux contenus des membres.',
  },
  suspended: {
    title: 'Votre accès est suspendu',
    text: 'Les fondatrices ont temporairement suspendu votre accès. Vous pouvez les contacter par le canal habituel pour en parler.',
  },
  left: {
    title: 'Vous avez quitté le Cocon',
    text: 'Votre compte existe encore mais n’a plus accès aux espaces des membres. Vous pouvez demander la suppression complète de vos données.',
  },
}

export default function RestrictedPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const m = messages[profile?.status ?? ''] ?? {
    title: 'Accès restreint',
    text: 'Votre compte ne donne pas accès à cet espace.',
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex justify-center">
        <Logo size="lg" />
      </div>
      <Card>
        <h1 className="text-3xl">{m.title}</h1>
        <p className="mt-3 text-ink-soft">{m.text}</p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={async () => {
            await signOut()
            navigate('/', { replace: true })
          }}
        >
          Se déconnecter
        </Button>
      </Card>
    </div>
  )
}
