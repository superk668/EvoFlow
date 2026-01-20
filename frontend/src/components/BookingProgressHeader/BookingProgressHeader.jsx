import styles from './BookingProgressHeader.module.css'
import { useEffect, useMemo, useState } from 'react'

const stages = [
  { value: 1, label: '乘机信息' },
  { value: 2, label: '增值服务' },
  { value: 3, label: '支付' },
  { value: 4, label: '完成' },
]

export default function BookingProgressHeader() {
  const [stage, setStage] = useState(1)

  const stageFromStorage = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('bookingStage')
      const num = Number(raw)
      return Number.isFinite(num) && num >= 1 && num <= 4 ? Math.trunc(num) : null
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (stageFromStorage) {
      setStage(stageFromStorage)
      let p = null
      try {
        p = globalThis.fetch?.('/api/booking/draft', { method: 'GET' })
      } catch {
        p = null
      }

      if (p && typeof p.then === 'function') {
        p.then(async (res) => {
          try {
            const data = await res.json()
            const next = Number(data?.bookingStage)
            if (Number.isFinite(next) && next >= 1 && next <= 4) {
              setStage(Math.trunc(next))
              try {
                sessionStorage.setItem('bookingStage', String(Math.trunc(next)))
              } catch {
                null
              }
            }
          } catch {
            null
          }
        }).catch(() => null)
      }
    }
  }, [stageFromStorage])

  return (
    <div className={styles.wrap} role="navigation" aria-label="购票进度">
      <div className={styles.inner}>
        {stages.map((s) => (
          <div key={s.value} className={s.value === stage ? styles.itemActive : styles.item}>
            <span className={styles.no}>{s.value}</span>
            <span className={`${styles.label} ${s.value === stage ? 'itemActive' : ''}`.trim()}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
