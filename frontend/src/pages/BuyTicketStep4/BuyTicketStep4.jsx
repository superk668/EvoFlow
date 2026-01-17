import { Link } from 'react-router-dom'
import styles from './BuyTicketStep4.module.css'

export default function BuyTicketStep4() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.title}>订单信息</div>
        <div className={styles.amount}>¥581</div>

        <div className={styles.route}>上海 → 北京</div>

        <div className={styles.timeRow}>
          <div className={styles.timeBlock}>
            <div className={styles.timeMain}>17:51</div>
            <div className={styles.timeSub}>虹桥</div>
          </div>
          <div className={styles.timeMid} aria-hidden="true">
            →
          </div>
          <div className={styles.timeBlock}>
            <div className={styles.timeMain}>20:19</div>
            <div className={styles.timeSub}>首都</div>
          </div>
        </div>

        <div className={styles.peopleLine}>
          乘机人：姚庆安，身份证 430802 2005 1018 1212
        </div>
        <div className={styles.peopleLine}>联系人：（+86)15874450027</div>

        <div className={styles.list}>
          <div className={styles.row}>
            <div className={styles.rowLeft}>成人套餐</div>
            <div className={styles.rowRight}>¥463 × 1</div>
          </div>
          <div className={styles.row}>
            <div className={styles.rowLeft}>金牌服务包</div>
            <div className={styles.rowRight}>¥48 × 1</div>
          </div>
          <div className={styles.row}>
            <div className={styles.rowLeft}>机建</div>
            <div className={styles.rowRight}>¥50 × 1</div>
          </div>
          <div className={styles.row}>
            <div className={styles.rowLeft}>燃油税</div>
            <div className={styles.rowRight}>¥20 × 1</div>
          </div>

          <div className={styles.giftHead}>
            <span className={styles.giftBadge}>赠品</span>
            订单即享
          </div>
          <div className={styles.giftRow}>
            <div className={styles.giftLeft}>租车92折优惠券</div>
            <div className={styles.giftRight}>免费</div>
          </div>
          <div className={styles.giftRow}>
            <div className={styles.giftLeft}>赠接送机最高8折券</div>
            <div className={styles.giftRight}>免费</div>
          </div>
        </div>
      </div>

      <div className={styles.success}>成功出票</div>
      <Link className={styles.homeBtn} to="/">
        返回首页
      </Link>
    </div>
  )
}

