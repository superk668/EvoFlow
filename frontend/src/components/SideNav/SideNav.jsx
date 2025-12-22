import styles from './SideNav.module.css'

const NAV_ITEMS = [
  { label: '酒店', active: false },
  { label: '机票', active: true },
  { label: '火车票', active: false },
  { label: '旅游·活动', active: false },
  { label: '门票·活动', active: false },
  { label: '用车·租车', active: false },
  { label: '攻略·景点', active: false },
  { label: '购物·礼品', active: false },
  { label: '礼品卡', active: false },
  { label: '企业差旅', active: false },
  { label: '查余额', active: false },
]

export default function SideNav() {
  return (
    <aside className={styles.nav}>
      <div className={styles.brandMark}>
        <div className={styles.brandDot} />
      </div>
      <nav className={styles.items}>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            className={`${styles.item} ${item.active ? styles.active : ''}`}
          >
            <div className={styles.icon} />
            <div className={styles.text}>{item.label}</div>
          </div>
        ))}
      </nav>
      <div className={styles.bottomIcons}>
        <div className={styles.bottomIcon} />
        <div className={styles.bottomIcon} />
        <div className={styles.bottomIcon} />
      </div>
    </aside>
  )
}

