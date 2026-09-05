import { ButtonLink, Card } from '../../components/ui'
import { IconLeaf, IconPeople, IconSprout, IconShield } from '../../components/icons'
import { useSettings } from '../../hooks/useSettings'

const values = [
  'Entraide',
  'Sincérité',
  'Confiance',
  'Confidentialité',
  'Respect de l’énergie et du rythme de chacun',
  'Co-création',
  'Complémentarité plutôt que compétition',
  'Liberté de participer ou de faire une pause',
  'Absence de pression commerciale',
]

export default function HomePage() {
  const { text } = useSettings()
  const intention = text('intention_phrase', 'Notre refuge de co-création au rythme du corps.')

  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-sage-500">
            Un espace privé, à notre rythme
          </p>
          <h1 className="text-4xl leading-tight sm:text-5xl">
            Le Cocon
            <span className="mt-2 block text-2xl text-sage-500 sm:text-3xl">
              La Parenthèse des Invisibles
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-soft">« {intention} »</p>
          <p className="mt-4 max-w-xl text-ink-soft">
            Un lieu numérique discret pour les professionnel·les de l’accompagnement et du
            bien-être, et pour les personnes qui construisent leur projet. Pour se connaître,
            s’entraider, partager et avancer, sans obligation de publier ni de participer.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/nous-rejoindre">Nous rejoindre</ButtonLink>
            <ButtonLink to="/connexion" variant="secondary">
              J’ai déjà un compte
            </ButtonLink>
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-sm">
          <div
            className="absolute inset-0 rounded-[45%_55%_50%_50%/55%_45%_55%_45%] bg-sage-100"
            aria-hidden="true"
          />
          <div
            className="absolute inset-6 rounded-[50%_50%_45%_55%/45%_55%_50%_50%] bg-sage-200/70"
            aria-hidden="true"
          />
          <div
            className="absolute inset-14 rounded-[55%_45%_50%_50%/50%_50%_45%_55%] bg-cream-light shadow-soft"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 flex items-center justify-center text-forest-500"
            aria-hidden="true"
          >
            <IconLeaf className="h-16 w-16" />
          </div>
        </div>
      </section>

      <section aria-labelledby="pourquoi">
        <h2 id="pourquoi" className="text-3xl">
          Pourquoi Le Cocon ?
        </h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Rassembler dans un même espace ce qui est aujourd’hui dispersé entre WhatsApp, Facebook,
          les visioconférences et les liens partagés.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: IconPeople,
              title: 'Se connaître',
              text: 'Découvrir l’univers de chaque membre et rompre l’isolement professionnel.',
            },
            {
              icon: IconSprout,
              title: 'Avancer ensemble',
              text: 'Demander un regard extérieur, tester un projet, chercher des complémentarités.',
            },
            {
              icon: IconShield,
              title: 'En confiance',
              text: 'Un cercle privé, sur candidature, où l’on partage sans démarchage ni pression.',
            },
          ].map(({ icon: Icon, title, text: t }) => (
            <Card key={title} as="article">
              <Icon className="mb-3 h-8 w-8 text-sage-500" />
              <h3 className="text-xl">{title}</h3>
              <p className="mt-1 text-ink-soft">{t}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="valeurs" className="rounded-3xl bg-sage-50 px-6 py-10 sm:px-10">
        <h2 id="valeurs" className="text-3xl">
          Nos valeurs
        </h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {values.map((v) => (
            <li
              key={v}
              className="rounded-full bg-cream-light px-4 py-1.5 text-[0.95rem] text-forest-700 shadow-soft"
            >
              {v}
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-2xl text-ink-soft">
          Le Cocon n’est ni un réseau social supplémentaire, ni une marketplace, ni un espace de
          démarchage. Chacun·e avance à son rythme.
        </p>
      </section>

      <section aria-labelledby="fonctionnement">
        <h2 id="fonctionnement" className="text-3xl">
          Comment ça fonctionne ?
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ['Candidature', 'Vous vous présentez en quelques lignes, sans aucune donnée de santé.'],
            [
              'Échange',
              'Les trois fondatrices examinent votre candidature et peuvent échanger avec vous.',
            ],
            ['Charte', 'Vous lisez et acceptez la charte de confidentialité et de respect.'],
            ['Bienvenue', 'Vous créez votre fiche « Mon Univers » et découvrez le Cocon.'],
          ].map(([title, t], i) => (
            <li key={title} className="card">
              <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-ochre-100 font-serif text-ochre-500">
                {i + 1}
              </span>
              <h3 className="text-lg">{title}</h3>
              <p className="mt-1 text-[0.95rem] text-ink-soft">{t}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
