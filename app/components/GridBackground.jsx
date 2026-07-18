export default function GridBackground({ size = 200, opacity = 0.08, className = '' }) {
  const id = `grid-${Math.random().toString(36).slice(2, 8)}`
  return (
    <svg
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <line x1={size} y1="0" x2={size} y2={size} stroke="#fff" strokeWidth="1" opacity={opacity} />
          <line x1="0" y1={size} x2={size} y2={size} stroke="#fff" strokeWidth="1" opacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
