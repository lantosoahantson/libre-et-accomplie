import { Link } from 'react-router-dom'
import { Alert, ButtonLink, Card, PageHeader } from '../../components/ui'
import { IconCalendar, IconExternal, IconFeed } from '../../components/icons'
import { useAuth } from '../../hooks/useAuth'
import { useSettings } from '../../hooks/useSettings'
import { accessOf } from '../../lib/roles'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Douce nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bel après-midi'
  return 'Bonsoir'
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { text } = useSettings()
  const whatsapp = text('whatsapp_link')
  const facebook = text('facebook_link')
  const intention = text('intention_phrase', 'Notre refuge de co-création au rythme du corps.')
  const access = accessOf(profile)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accueil"
        title={`${greeting()}${profile?.first_name ? `, ${profile.first_name}` : ''}`}
        intro={<span className="font-serif italic">« {intention} »</span>}
      />

      {!profile?.first_name && (
        <Alert tone="info" title="Bienvenue dans le Cocon">
          Prenez un instant pour <Link to="/app/profil">indiquer votre prénom</Link> : il
          personnalisera votre accueil.
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 text-sage-500">
            <IconCalendar className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-wider">Prochaine Parenthèse</p>
          </div>
          <h2 className="mt-2 text-2xl">À venir</h2>
          <p className="mt-1 text-ink-soft">
            La date, l’heure, le thème et le lien de connexion s’afficheront ici dès que le
            calendrier sera en place (étape 3).
          </p>
          <ButtonLink to="/app/calendrier" variant="secondary" className="mt-4">
            Voir le calendrier
          </ButtonLink>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-sage-500">
            <IconFeed className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-wider">Fil du Cocon</p>
          </div>
          <h2 className="mt-2 text-2xl">Dernières publications</h2>
          <p className="mt-1 text-ink-soft">
            Le Fil arrive à l’étape 2 : partages, questions, petits pas et demandes de soutien.
          </p>
          <ButtonLink to="/app/fil" variant="secondary" className="mt-4">
            Ouvrir le Fil
          </ButtonLink>
        </Card>
      </div>

      {(whatsapp || facebook) && (
        <Card>
          <h2 className="text-xl">Canaux légers</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Pour les annonces importantes, les rappels et les liens rapides.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {whatsapp && (
              <ButtonLink to={whatsapp} external variant="secondary">
                Groupe WhatsApp <IconExternal className="h-4 w-4" />
              </ButtonLink>
            )}
            {facebook && (
              <ButtonLink to={facebook} external variant="ghost">
                Facebook (transition) <IconExternal className="h-4 w-4" />
              </ButtonLink>
            )}
          </div>
        </Card>
      )}

      {access === 'accompanied' && (
        <Alert tone="info">
          Vous accédez aux contenus éducatifs, ressources, ateliers et fiches ouverts à votre
          cercle. Aucun démarchage n’est toléré dans le Cocon.
        </Alert>
      )}
    </div>
  )
}
