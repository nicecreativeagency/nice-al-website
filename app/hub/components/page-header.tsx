export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <header className="hubPageHeader">
      <div>
        <p><span aria-hidden="true" />{eyebrow}</p>
        <h1>{title}</h1>
        <span>{description}</span>
      </div>
      {action ? <div className="hubPageHeaderAction">{action}</div> : null}
    </header>
  )
}
