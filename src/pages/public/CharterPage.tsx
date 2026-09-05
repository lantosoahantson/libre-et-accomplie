import { Alert, Card, PageHeader } from '../../components/ui'
import { CHARTER_ITEMS } from '../../lib/charter'

export default function CharterPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Charte"
        title="La charte du Cocon"
        intro="Chaque membre lit et accepte cette charte avant d’entrer dans le Cocon. Elle pourra évoluer ; une modification importante demandera une nouvelle acceptation."
      />
      <Alert tone="warning" title="Version de travail">
        La formulation ci-dessous est une première proposition. Sa version finale reste à valider
        conjointement par les trois fondatrices.
      </Alert>
      <Card>
        <ol className="space-y-5">
          {CHARTER_ITEMS.map((item, i) => (
            <li key={item.title} className="flex gap-4">
              <span className="font-serif text-2xl text-sage-400">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 className="text-lg">{item.title}</h2>
                <p className="text-ink-soft">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
