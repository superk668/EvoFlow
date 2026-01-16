import styles from './PlaceholderImage.module.css'

export default function PlaceholderImage({ name, width, height, className }) {
  const style = {
    width,
    height,
  }

  return (
    <svg
      className={[styles.svg, className].filter(Boolean).join(' ')}
      style={style}
      viewBox={`0 0 ${Number(width) || 1} ${Number(height) || 1}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`占位 ${name}`}
    >
      <rect x="0" y="0" width="100%" height="100%" fill="#D9D9D9" />
      <rect
        x="0.5"
        y="0.5"
        width="calc(100% - 1px)"
        height="calc(100% - 1px)"
        fill="none"
        stroke="#B8B8B8"
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className={styles.text}>
        {`占位 ${name}`}
      </text>
    </svg>
  )
}

