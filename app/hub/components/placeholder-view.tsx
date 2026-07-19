import { ArrowRight, type LucideIcon } from 'lucide-react'
import { PageHeader } from './page-header'

export function PlaceholderView({
  eyebrow,
  title,
  description,
  icon: Icon,
  milestone,
}: {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  milestone: string
}) {
  return (
    <div className="hubPage">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <section className="placeholderPanel">
        <div className="placeholderIcon">
          <Icon size={24} aria-hidden="true" />
        </div>
        <p>{milestone}</p>
        <h2>{title} is ready for its next build phase.</h2>
        <span>
          The secure route, permissions and navigation are already in place.
          Product functionality will be added without changing the foundation.
        </span>
        <div className="placeholderRoadmap">
          <span>Foundation</span>
          <ArrowRight size={15} aria-hidden="true" />
          <strong>{title}</strong>
        </div>
      </section>
    </div>
  )
}
