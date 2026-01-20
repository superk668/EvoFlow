import styles from './SideNav.module.css'

const items = [
  { label: '酒店' },
  { label: '机票', active: true },
  { label: '火车票' },
  { label: '门票·活动' },
  { label: '汽车·船票' },
  { label: '用车' },
  { label: 'AI行程' },
  { label: '攻略·景点' },
  { label: '旅游' },
  { label: '企业商旅' },
  { label: '送关' },
]

export default function SideNav() {
  return (
    <aside className={styles.aside}>
      <div className={styles.menuIcon} aria-hidden />
      <div className={styles.items}>
        {items.map((it) => (
          <div key={it.label} className={it.active ? styles.itemActive : styles.item}>
            <div className={styles.itemIcon} aria-hidden />
            <div className={styles.itemLabel}>{it.label}</div>
          </div>
        ))}
      </div>
    </aside>
  )
}

