import { EmptyState, PageHeader } from '../../components/ui'

export default function ComingSoonPage({
  eyebrow,
  title,
  intro,
  step,
  icon,
}: {
  eyebrow: string
  title: string
  intro: string
  step: 2 | 3 | 4
  icon: string
}) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} intro={intro} />
      <EmptyState icon={icon} title="Cet espace se prépare">
        Il sera construit à l’étape {step}. Rien ne presse : le Cocon se tisse à son rythme.
      </EmptyState>
    </div>
  )
}
