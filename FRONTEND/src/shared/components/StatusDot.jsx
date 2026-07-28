export default function StatusDot({ isOnline, size = 8, className = '' }) {
  return (
    <span
      className={`status-dot ${className}`}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: isOnline ? 'var(--color-online)' : 'var(--color-offline)',
        flexShrink: 0,
      }}
    />
  )
}