import styles from './LeftSidebar.module.css'

const items = [
  { key: 'hotel', label: '酒店' },
  { key: 'flight', label: '机票' },
  { key: 'train', label: '火车票' },
  { key: 'vacation', label: '旅游' },
  { key: 'ticket', label: '门票·活动' },
  { key: 'car', label: '用车·租车' },
  { key: 'bus', label: '汽车·船票' },
  { key: 'guide', label: '攻略·景点' },
  { key: 'shopping', label: '全球购' },
  { key: 'insurance', label: '保险' },
  { key: 'vip', label: '会员' },
]

export default function LeftSidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.group}>
        {items.map((it) => (
          <a
            key={it.key}
            className={it.key === 'flight' ? styles.itemActive : styles.item}
            href="#/"
          >
            <span className={styles.icon} aria-hidden="true" />
            <span className={styles.label}>{it.label}</span>
          </a>
        ))}
      </div>
    </aside>
  )
}

