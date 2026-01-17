import { Link } from 'react-router-dom'
import styles from './PersonalCenterSideBar.module.css'

export default function PersonalCenterSideBar({ active = 'profile' }) {
  const isCommonInfo = active === 'commonTravellers'

  return (
    <aside className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.item}>我的携程首页</div>
        <Link className={[styles.item, active === 'orders' ? styles.active : ''].join(' ')} to="/user-center/orders">
          订单
        </Link>
        <div className={styles.item}>我的消息</div>
        <div className={styles.item}>
          钱包
          <span className={styles.caretDown} aria-hidden="true" />
        </div>
        <div className={styles.item}>礼品卡</div>
        <div className={styles.item}>优惠券</div>
        <div className={styles.item}>积分</div>
        <div className={styles.item}>我的收藏</div>
        <Link className={[styles.item, isCommonInfo ? styles.groupActive : ''].join(' ')} to="/user-center/common-info">
          常用信息
          <span className={isCommonInfo ? styles.caretUpBlue : styles.caretDown} aria-hidden="true" />
        </Link>
        {isCommonInfo ? (
          <div className={styles.subList}>
            <Link className={[styles.subItem, styles.subActive].join(' ')} to="/user-center/common-info/travelers">
              常用旅客信息
            </Link>
            <div className={styles.subItem}>常用联系人</div>
            <div className={styles.subItem}>常用报销凭证</div>
            <div className={styles.subItem}>常用地址</div>
          </div>
        ) : null}

        <div className={[styles.item, styles.groupHead, active === 'profile' ? styles.groupActive : ''].join(' ')}>
          个人中心
          <span className={active === 'profile' ? styles.caretUpBlue : styles.caretDown} aria-hidden="true" />
        </div>
        {active === 'profile' ? (
          <div className={styles.subList}>
            <Link className={[styles.subItem, styles.subActive].join(' ')} to="/user-center/my-info">
              我的信息
            </Link>
            <div className={styles.subItem}>绑定和关联</div>
            <div className={styles.subItem}>账户安全</div>
            <div className={styles.subItem}>我的社区主页</div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
