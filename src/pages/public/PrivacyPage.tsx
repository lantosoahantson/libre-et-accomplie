import { Card, PageHeader } from '../../components/ui'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Confidentialité"
        title="Vos informations, vos choix"
        intro="Le Cocon collecte le strict nécessaire et vous laisse la main sur ce que vous partagez."
      />
      <Card className="space-y-5">
        <section>
          <h2 className="text-xl">Ce que nous enregistrons</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
            <li>
              Votre adresse électronique, uniquement pour vous connecter. Elle n’est jamais affichée
              aux autres membres.
            </li>
            <li>Les informations de votre fiche « Mon Univers » que vous choisissez de remplir.</li>
            <li>
              Vos publications, commentaires, inscriptions aux événements et réglages de
              notifications.
            </li>
            <li>La version de la charte que vous avez acceptée et la date de cette acceptation.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl">Ce que nous ne demandons jamais</h2>
          <p className="mt-2 text-ink-soft">
            Aucune donnée médicale, aucun diagnostic, aucune justification liée à la santé, ni le
            nom des personnes que vous accompagnez.
          </p>
        </section>
        <section>
          <h2 className="text-xl">Qui voit quoi</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
            <li>
              Un visiteur non connecté ne voit aucun profil, aucune publication, aucun événement
              interne.
            </li>
            <li>Un·e candidat·e ne voit que sa propre candidature.</li>
            <li>Un·e professionnel·le voit les contenus ouverts à son cercle.</li>
            <li>
              Une personne accompagnée ne voit jamais les contenus réservés aux professionnel·les.
            </li>
            <li>
              Les votes et commentaires internes des fondatrices restent strictement confidentiels.
            </li>
          </ul>
          <p className="mt-2 text-sm text-ink-muted">
            Ces règles sont appliquées directement dans la base de données, pas seulement à l’écran.
          </p>
        </section>
        <section>
          <h2 className="text-xl">Vos droits</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
            <li>Masquer temporairement votre fiche sans supprimer votre compte.</li>
            <li>Mettre vos notifications en pause.</li>
            <li>Demander une copie de vos informations.</li>
            <li>
              Supprimer votre compte ; les fichiers associés sont supprimés lorsque c’est possible.
            </li>
          </ul>
          <p className="mt-2 text-sm text-ink-muted">
            Les durées de conservation de certaines données (notamment les replays) restent à
            définir par les trois fondatrices.
          </p>
        </section>
      </Card>
    </div>
  )
}
