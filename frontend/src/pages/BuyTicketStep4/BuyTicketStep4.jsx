import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  readBookingDraft,
  readEvoflowOrders,
  updateOrderStatus,
  writeBookingStage,
} from '../../booking/storage.js'
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

  const [error, setError] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState(() => {
    try {
      return sessionStorage.getItem('createdOrderId')
    } catch {
      return null
    }
  })
  const updatingRef = useRef(false)

  const orderId = searchParams.get('orderId') || ''
  const draft = useMemo(() => {
    try {
      return readBookingDraft()
    } catch {
      return null
    }
  }, [])

  const order = useMemo(() => {
    try {
      const orders = readEvoflowOrders()
      return orders.find((o) => String(o?.orderId) === String(orderId)) || null
    } catch {
      return null
    }
  }, [orderId])

  useEffect(() => {
    try {
      void writeBookingStage(4)
    } catch {
      void 0
    }
  }, [])

  useEffect(() => {
    if (!orderId) return
    if (createdOrderId && String(createdOrderId) === String(orderId)) return
    if (updatingRef.current) return

    updatingRef.current = true

    ;(async () => {
      try {
        await updateOrderStatus(orderId, 'pending_travel')
        try {
          sessionStorage.setItem('createdOrderId', String(orderId))
        } catch {
          void 0
        }
        setCreatedOrderId(String(orderId))
      } catch {
        setError('订单更新失败，稍后查看订单中心')
      } finally {
        updatingRef.current = false
      }
    })()
  }, [createdOrderId, orderId])

  const from = draft?.from || searchParams.get('from') || '上海(SHA)'
  const to = draft?.to || searchParams.get('to') || '北京(BJS)'
  const depAirport = draft?.selectedFlight?.depAirport || searchParams.get('depAirport') || '虹桥'
  const arrAirport = draft?.selectedFlight?.arrAirport || searchParams.get('arrAirport') || '首都'
  const depTime = draft?.selectedFlight?.depTime || searchParams.get('depTime') || '17:51'
  const arrTime = draft?.selectedFlight?.arrTime || searchParams.get('arrTime') || '20:19'
  const total = order?.totalAmount ?? searchParams.get('total') ?? '581'

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
          <div className={styles.personLine}>
            乘机人：{draft?.passenger?.name || '—'} {draft?.passenger?.idType || ''} {draft?.passenger?.idNumber || ''}
          </div>
          <div className={styles.personLine}>联系人：{draft?.contact?.phoneNumber || '—'}</div>

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
        {error ? <div>{error}</div> : null}
        <button type="button" className={styles.backBtn} onClick={goHome}>
          返回首页
        </button>
      </main>
    </div>
  )
}
