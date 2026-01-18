import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styles from './BuyTicketStep4.module.css'

function formatMoney(value) {
  const n = Number.parseFloat(String(value))
  if (!Number.isFinite(n)) return '581'
  const fixed = n.toFixed(0)
  return fixed
}

export default function BuyTicketStep4() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const from = searchParams.get('from') || '上海(SHA)'
  const to = searchParams.get('to') || '北京(BJS)'
  const depAirport = searchParams.get('depAirport') || '虹桥'
  const arrAirport = searchParams.get('arrAirport') || '首都'
  const depTime = searchParams.get('depTime') || '17:51'
  const arrTime = searchParams.get('arrTime') || '20:19'
  const total = searchParams.get('total') || '581'

  const fromCity = useMemo(() => from.split('(')[0], [from])
  const toCity = useMemo(() => to.split('(')[0], [to])
  const moneyText = useMemo(() => formatMoney(total), [total])

  function goHome() {
    navigate({ pathname: '/' })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandIcon} aria-hidden="true" />
            <span className={styles.brandText}>携程旅行</span>
          </div>

          <div className={styles.steps}>
            <div className={styles.stepDone}>
              <span className={styles.stepDotDone} aria-hidden="true" />
              乘机信息
            </div>
            <div className={styles.stepDone}>
              <span className={styles.stepDotDone} aria-hidden="true" />
              增值服务
            </div>
            <div className={styles.stepDone}>
              <span className={styles.stepDotDone} aria-hidden="true" />
              支付
            </div>
            <div className={styles.stepActive}>
              <span className={styles.stepDotActive} aria-hidden="true">4</span>
              完成
            </div>
          </div>

          <nav className={styles.nav}>
            <span className={styles.navItem}>首页</span>
            <span className={styles.navSep} aria-hidden="true" />
            <span className={styles.user}>
              <span className={styles.userAvatar} aria-hidden="true" />
              dev
            </span>
            <span className={styles.navSep} aria-hidden="true" />
            <span className={styles.navItem}>我的订单</span>
            <span className={styles.navSep} aria-hidden="true" />
            <span className={styles.navItem}>联系客服</span>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>订单信息</div>
          <div className={styles.price}>¥{moneyText}</div>
          <div className={styles.route}>
            {fromCity} → {toCity}
          </div>

          <div className={styles.timesRow}>
            <div className={styles.timeCol}>
              <div className={styles.time}>{depTime}</div>
              <div className={styles.airport}>{depAirport}</div>
            </div>
            <div className={styles.arrow} aria-hidden="true">→</div>
            <div className={styles.timeCol}>
              <div className={styles.time}>{arrTime}</div>
              <div className={styles.airport}>{arrAirport}</div>
            </div>
          </div>

          <div className={styles.personLine}>乘机人：姚欣奕 身份证 430802 2005 1018 1212</div>
          <div className={styles.personLine}>联系人：(+86)15874450027</div>

          <div className={styles.list}>
            <div className={styles.row}>
              <div className={styles.item}>成人套餐</div>
              <div className={styles.qty}>¥463 × 1</div>
            </div>
            <div className={styles.row}>
              <div className={styles.item}>金牌服务包</div>
              <div className={styles.qty}>¥48 × 1</div>
            </div>
            <div className={styles.row}>
              <div className={styles.item}>机建</div>
              <div className={styles.qty}>¥50 × 1</div>
            </div>
            <div className={styles.row}>
              <div className={styles.item}>燃油税</div>
              <div className={styles.qty}>¥20 × 1</div>
            </div>
          </div>

          <div className={styles.gift}>
            <div className={styles.giftHead}>
              <span className={styles.giftBadge}>赠品</span>
              订票礼包
            </div>
            <div className={styles.giftRow}>
              <div className={styles.giftItem}>租车92折优惠券</div>
              <div className={styles.giftFree}>免费</div>
            </div>
            <div className={styles.giftRow}>
              <div className={styles.giftItem}>赠接送机最高8折券</div>
              <div className={styles.giftFree}>免费</div>
            </div>
          </div>
        </div>

        <div className={styles.success}>成功出票</div>
        <button type="button" className={styles.backBtn} onClick={goHome}>
          返回首页
        </button>
      </main>
    </div>
  )
}

