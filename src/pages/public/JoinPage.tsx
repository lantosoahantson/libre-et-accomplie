import { Alert, ButtonLink, Card, PageHeader } from '../../components/ui'

export default function JoinPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Nous rejoindre"
        title="Entrer dans le cercle professionnel"
        intro="Le Cocon accueille les professionnel·les de l’accompagnement et du bien-être, ainsi que les personnes encore en réflexion ou en construction de leur projet."
      />

      <Card>
        <h2 className="text-2xl">Le parcours, pas à pas</h2>
        <ol className="mt-4 space-y-4">
          {[
            [
              'Créer votre accès',
              'Vous indiquez votre adresse électronique ; vous recevez un lien de connexion personnel. Aucun mot de passe à retenir.',
            ],
            [
              'Compléter votre candidature',
              'Quelques questions sur votre activité, votre univers et ce que vous venez chercher. Aucune donnée médicale, aucun diagnostic, aucune justification liée à la santé ne vous sera demandée.',
            ],
            [
              'Examen par les trois fondatrices',
              'Chacune donne son avis de façon indépendante. Une réponse vous est adressée dès que l’examen est terminé.',
            ],
            [
              'Accepter la charte, puis créer votre fiche « Mon Univers »',
              'Vous choisissez ce que vous montrez aux autres membres. Votre adresse électronique n’apparaît jamais dans l’annuaire.',
            ],
          ].map(([title, t], i) => (
            <li key={title} className="flex gap-4">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-100 font-serif text-forest-700">
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg">{title}</h3>
                <p className="text-ink-soft">{t}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Alert tone="info" title="Personnes accompagnées">
        Le second cercle, destiné à certaines personnes accompagnées, n’est accessible que sur
        invitation personnelle d’un·e professionnel·le du Cocon. Il n’est pas possible d’y
        candidater directement.
      </Alert>

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink to="/connexion">Commencer : créer mon accès</ButtonLink>
        <ButtonLink to="/charte" variant="secondary">
          Lire la charte
        </ButtonLink>
      </div>
      <p className="text-sm text-ink-muted">
        Le formulaire de candidature sera proposé dans votre espace dès votre première connexion (il
        arrive à l’étape 4 de la construction).
      </p>
    </div>
  )
}
