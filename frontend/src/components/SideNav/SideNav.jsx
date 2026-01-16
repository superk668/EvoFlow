import PlaceholderImage from '../PlaceholderImage/PlaceholderImage.jsx'
import styles from './SideNav.module.css'

const navItems = [
  { icon: '酒店', label: '酒店' },
  { icon: '机票', label: '机票', active: true },
  { icon: '国内·国际', label: '国内·国际' },
  { icon: '火车票', label: '火车票' },
  { icon: '门票·活动', label: '门票·活动' },
  { icon: '用车·租车', label: '用车·租车' },
  { icon: '汽车·船票', label: '汽车·船票' },
  { icon: '攻略·景点', label: '攻略·景点' },
  { icon: '美食·购物', label: '美食·购物' },
  { icon: '现金·借钱', label: '现金·借钱' },
  { icon: 'WiFi·电话卡', label: 'WiFi·电话卡' },
  { icon: '行程助手', label: '行程助手' },
  { icon: '商旅服务', label: '商旅服务' },
  { icon: '会员中心', label: '会员中心' },
  { icon: '企业差旅', label: '企业差旅' },
  { icon: '艺术馆', label: '艺术馆', badge: '99+' },
]

export default function SideNav() {
  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <button className={styles.menuBtn} type="button" aria-label="菜单">
          <span className={styles.menuLine} />
          <span className={styles.menuLine} />
          <span className={styles.menuLine} />
        </button>
      </div>

      <div className={styles.list}>
        {navItems.map((item) => (
          <div key={item.label} className={[styles.item, item.active ? styles.active : ''].join(' ')}>
            <div className={styles.icon}>
              <PlaceholderImage name={`侧栏-${item.icon}`} width={26} height={26} />
            </div>
            <div className={styles.labelRow}>
              <div className={styles.label}>{item.label}</div>
              {item.badge ? <div className={styles.badge}>{item.badge}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

