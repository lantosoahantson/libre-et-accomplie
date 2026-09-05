import { ButtonLink, Logo } from '../components/ui'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo size="lg" />
      <h1 className="text-3xl">Cette page n’existe pas</h1>
      <p className="max-w-md text-ink-soft">
        Le lien est peut-être incomplet. Revenez à l’accueil pour retrouver votre chemin.
      </p>
      <ButtonLink to="/">Retour à l’accueil</ButtonLink>
    </div>
  )
}
