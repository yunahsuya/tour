export function LinkList({ links }) {
  if (!links?.length) return null
  return (
    <ul className="trip-links" onClick={(e) => e.stopPropagation()}>
      {links.map((l) => (
        <li key={l.href}>
          <a href={l.href} target="_blank" rel="noreferrer noopener">
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
