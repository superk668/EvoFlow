import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styles from './BuyTicketStep4.module.css'

function maskPhone(phone) {
  const p = String(phone).replace(/\s+/g, '')
  if (!p) return ''
  return `${p.slice(0, 3)}****${p.slice(-4)}`
}

function maskId(idNumber) {
  const s = String(idNumber).replace(/\s+/g, '')
  if (!s) return ''
  return `${s.slice(0, 3)}**********${s.slice(-2)}`
}

function readBookingDraft() {
  try {
    const raw = sessionStorage.getItem('bookingDraft')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function readOrders() {
  try {
    const raw = localStorage.getItem('evoflow_orders')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeOrders(next) {
  try {
    localStorage.setItem('evoflow_orders', JSON.stringify(next))
  } catch {
    void 0
  }
}

function formatMoney(value) {
  const n = Number.parseFloat(String(value))
  if (!Number.isFinite(n)) return '581'
  const fixed = n.toFixed(0)
  return fixed
}

export default function BuyTicketStep4() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [updateError, setUpdateError] = useState('')
  const hasUpdatedRef = useRef(false)

  const from = searchParams.get('from') || '上海(SHA)'
  const to = searchParams.get('to') || '北京(BJS)'
  const depAirport = searchParams.get('depAirport') || '虹桥'
  const arrAirport = searchParams.get('arrAirport') || '首都'
  const depTime = searchParams.get('depTime') || '17:51'
  const arrTime = searchParams.get('arrTime') || '20:19'
  const total = searchParams.get('total') || '581'
  const orderId = searchParams.get('orderId') || ''

  const fromCity = useMemo(() => from.split('(')[0], [from])
  const toCity = useMemo(() => to.split('(')[0], [to])
  const moneyText = useMemo(() => formatMoney(total), [total])

  const order = useMemo(() => {
    if (!orderId) return null
    const orders = readOrders()
    return orders.find((o) => String(o?.id ?? '') === String(orderId)) ?? null
  }, [orderId])

  const draft = useMemo(() => readBookingDraft(), [])

  const passengerName = order?.details?.passenger?.name ?? draft?.passenger?.name ?? ''
  const passengerIdType = order?.details?.passenger?.idType ?? draft?.passenger?.idType ?? ''
  const passengerIdMasked =
    order?.details?.passenger?.idNumberMasked ?? (draft?.passenger?.idNumber ? maskId(draft.passenger.idNumber) : '')
  const contactPhoneMasked =
    order?.details?.contact?.phoneNumberMasked ?? (draft?.contact?.phoneNumber ? maskPhone(draft.contact.phoneNumber) : '')

  useEffect(() => {
    if (!orderId) return
    if (hasUpdatedRef.current) return

    const onceKey = `orderStatusUpdated:${String(orderId)}`
    if (sessionStorage.getItem(onceKey) === '1') {
      hasUpdatedRef.current = true
      return
    }

    hasUpdatedRef.current = true
    try {
      sessionStorage.setItem(onceKey, '1')
    } catch {
      void 0
    }

    const nowIso = new Date().toISOString()
    const orders = readOrders()
    const nextOrders = orders.map((o) => {
      if (String(o?.id ?? '') !== String(orderId)) return o
      return { ...o, status: 'pending_travel', updatedAt: nowIso }
    })
    writeOrders(nextOrders)

    fetch(`/api/orders/${orderId}/status`, { method: 'PATCH' })
      .then((resp) => {
        if (!resp.ok) setUpdateError('订单更新失败，稍后查看订单中心')
      })
      .catch(() => {
        setUpdateError('订单更新失败，稍后查看订单中心')
      })
  }, [orderId])

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
            <span>乘机人：</span>
            <span>{passengerName}</span>
            <span> </span>
            <span>{passengerIdType}</span>
            <span> </span>
            <span>{passengerIdMasked}</span>
          </div>
          <div className={styles.personLine}>
            <span>联系人：</span>
            <span>{contactPhoneMasked}</span>
          </div>

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
        {updateError ? <div>{updateError}</div> : null}
        <button type="button" className={styles.backBtn} onClick={goHome}>
          返回首页
        </button>
      </main>
    </div>
  )
}
