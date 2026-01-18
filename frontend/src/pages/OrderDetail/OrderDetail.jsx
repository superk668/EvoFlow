import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import styles from './OrderDetail.module.css'

const ORDERS_KEY = 'evoflow_orders'

function readOrders() {
  const raw = localStorage.getItem(ORDERS_KEY)
  if (!raw) return []
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) return []
  return parsed
}

function sumPriceBreakdown(list) {
  if (!Array.isArray(list)) return null
  let sum = 0
  for (const it of list) {
    const unit = Number(it?.unitPrice)
    const qty = Number(it?.quantity)
    if (!Number.isFinite(unit) || !Number.isFinite(qty)) return null
    sum += unit * qty
  }
  return sum
}

export default function OrderDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [isCanceling, setIsCanceling] = useState(false)
  const [cancelSuccess, setCancelSuccess] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const order = useMemo(() => {
    try {
      void reloadKey
      const orders = readOrders()
      return orders.find((o) => String(o?.orderId) === String(orderId)) || null
    } catch {
      setError('订单详情加载失败，请稍后重试')
      return null
    }
  }, [orderId, reloadKey])

  const priceMismatch = useMemo(() => {
    if (!order) return false
    const total = Number(order?.totalAmount)
    if (!Number.isFinite(total)) return false
    const sum = sumPriceBreakdown(order?.priceBreakdown)
    if (sum == null) return false
    return sum !== total
  }, [order])

  async function cancelOrder() {
    setCancelError('')
    setCancelSuccess(false)
    const ok = window.confirm('确认取消该订单吗？')
    if (!ok) return

    setIsCanceling(true)
    try {
      const resp = await fetch('/api/user-center/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      if (!resp || resp.status >= 400) {
        setCancelError('取消失败')
        return
      }

      try {
        const list = readOrders()
        const next = list.map((o) => {
          if (String(o?.orderId) !== String(orderId)) return o
          return { ...o, status: 'canceled', canceledAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        })
        localStorage.setItem(ORDERS_KEY, JSON.stringify(next))
      } catch {
        void 0
      }
      setReloadKey((v) => v + 1)
      setCancelSuccess(true)
    } catch {
      setCancelError('取消失败')
    } finally {
      setIsCanceling(false)
    }
  }

  function rebook() {
    const departAt = String(order?.departAt || '')
    const ymd = departAt.slice(0, 10)
    const dcity = order?.fromCity ? String(order.fromCity) : ''
    const acity = order?.toCity ? String(order.toCity) : ''
    const qs = new URLSearchParams()
    if (ymd) qs.set('date', ymd)
    if (dcity) qs.set('dcity', dcity)
    if (acity) qs.set('acity', acity)
    navigate({ pathname: '/flights/list', search: `?${qs.toString()}` })
  }

  if (error) {
    return <div className={styles.page}>{error}</div>
  }

  if (!order) {
    return <div className={styles.page}>订单不存在或您没有权限查看</div>
  }

  const status = String(order?.status || '')
  const showCancel = status === 'pending_payment' || status === 'pending_travel'
  const isCanceled = status === 'canceled' || status === 'cancelled'

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.breadcrumb}>我的订单 &gt; 订单详情</div>

        <Link to="/user-center/orders">返回</Link>

        <div>订单号</div>

        {priceMismatch ? <div>价格明细暂不可用，请稍后重试</div> : null}

        {showCancel && !isCanceled ? (
          <button type="button" disabled={isCanceling} onClick={cancelOrder}>
            取消订单
          </button>
        ) : null}

        {isCanceled ? (
          <button type="button" onClick={rebook}>
            重新下单
          </button>
        ) : null}

        {cancelSuccess ? <div>订单取消成功</div> : null}
        {cancelError ? <div>{cancelError}</div> : null}

        <div className={styles.grid}>
          <div className={styles.left}>
            <div className={styles.statusCard}>
              <div className={styles.statusTop}>
                <div>
                  <div className={styles.statusTitle}>待支付</div>
                  <div className={styles.statusSub}>请在最晚支付时间18:06前支付，完成支付才能锁定价格</div>
                </div>
                <div className={styles.orderNo}>订单号</div>
              </div>

              <div className={styles.statusActions}>
                <Link className={styles.payBtn} to="/buy-ticket/step2">
                  去支付
                </Link>
                <button type="button" className={styles.cancelBtn}>
                  申请取消
                </button>
              </div>

              <div className={styles.remindBar}>
                <div className={styles.remindIcon} aria-hidden="true" />
                <div className={styles.remindStrong}>出行提醒：5条公告</div>
                <div className={styles.remindDot} aria-hidden="true" />
                <div className={styles.remindText}>防诈骗提醒</div>
                <div className={styles.remindDot} aria-hidden="true" />
                <div className={styles.remindText}>海南航空大新华航空出行提醒</div>
                <div className={styles.remindDot} aria-hidden="true" />
                <div className={styles.remindText}>文明乘机提醒</div>
                <div className={styles.remindDot} aria-hidden="true" />
                <div className={styles.remindText}>部分充电宝禁止携带</div>
                <div className={styles.remindCaret} aria-hidden="true" />
              </div>
            </div>

            <div className={styles.flightCard}>
              <div className={styles.flightHead}>
                <div className={styles.flightTitle}>上海→北京</div>
                <a className={styles.flightLink} href="#/">
                  退改签政策
                </a>
                <a className={styles.flightLink} href="#/">
                  行李额规定
                </a>
                <a className={styles.flightLink} href="#/">
                  产品说明
                </a>
              </div>

              <div className={styles.itin}>
                <div className={styles.itinLeft}>
                  <div className={styles.itinTag}>单程</div>
                  <div className={styles.itinDate}>12-28 周日</div>
                </div>

                <div className={styles.timeline}>
                  <div className={styles.trow}>
                    <div className={styles.tTime}>19:30</div>
                    <div className={styles.tLine} aria-hidden="true" />
                    <div className={styles.tPlace}>
                      <div className={styles.tCity}>上海</div>
                      <div className={styles.tStation}>浦东机场T2</div>
                    </div>
                  </div>
                  <div className={styles.tmid}>
                    <div className={styles.tDur}>2h30m</div>
                  </div>
                  <div className={styles.trow}>
                    <div className={styles.tTime}>22:00</div>
                    <div className={styles.tLine} aria-hidden="true" />
                    <div className={styles.tPlace}>
                      <div className={styles.tCity}>北京</div>
                      <div className={styles.tStation}>首都机场T2</div>
                    </div>
                  </div>
                </div>

                <div className={styles.itinRight}>
                  <div className={styles.airlineRow}>
                    <div className={styles.airlineIcon} aria-hidden="true" />
                    <div className={styles.airlineText}>海航｜海南航空 HU7612</div>
                  </div>
                  <div className={styles.airlineSub}>惠选经济舱｜波音738(中)｜有餐食</div>
                </div>
              </div>

              <div className={styles.flightAlert}>
                <div className={styles.alertText}>
                  <span className={styles.alertStrong}>已取消：</span> 姚秋实
                </div>
                <a className={styles.alertLink} href="#/">
                  查看详情
                </a>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>已购 / 赠送服务</div>
              <div className={styles.serviceList}>
                <div className={styles.serviceItem}>
                  <div className={styles.serviceIconShield} aria-hidden="true" />
                  <div className={styles.serviceText}>45元无忧玩乐礼包，精品快线</div>
                  <a className={styles.serviceLink} href="#/">
                    查看详情 &gt;
                  </a>
                </div>
                <div className={styles.serviceItem}>
                  <div className={styles.serviceIconBag} aria-hidden="true" />
                  <div className={styles.serviceText}>金牌服务包</div>
                  <a className={styles.serviceLink} href="#/">
                    详情已退了 &gt;
                  </a>
                </div>
                <div className={styles.serviceItem}>
                  <div className={styles.serviceIconTicket} aria-hidden="true" />
                  <div className={styles.serviceText}>优惠券</div>
                  <a className={styles.serviceLink} href="#/">
                    查看详情 &gt;
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.sectionTitle}>出行人信息</div>
              <div className={styles.infoBody}>
                <div className={styles.infoName}>姚秋实</div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>身份证:</div>
                  <div className={styles.infoValue}>430802**********12</div>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.sectionTitle}>联系信息</div>
              <div className={styles.infoBody}>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>手机号:</div>
                  <div className={styles.infoValue}>+86 158****0027</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.payCard}>
              <div className={styles.payTitle}>订单支付明细</div>
              <div className={styles.payDivider} aria-hidden="true" />

              <div className={styles.payTopRow}>
                <div>
                  <div className={styles.payAmountLabel}>下单金额</div>
                  <div className={styles.payAmountTime}>12-27 22:32</div>
                </div>
                <div className={styles.payAmountValue}>¥798</div>
              </div>

              <div className={styles.payBox}>
                <div className={styles.payLine}>
                  <div className={styles.payLeft}>成人</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoney}>¥750</span>
                    <span className={styles.payCount}>×1人</span>
                  </div>
                </div>
                <div className={styles.payLineMuted}>
                  <div className={styles.payLeft}>机票价（惠选经济舱抢 3.1折）</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoneyMuted}>¥660</span>
                    <span className={styles.payCount}>×1人</span>
                  </div>
                </div>
                <div className={styles.payLineMuted}>
                  <div className={styles.payLeft}>机建</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoneyMuted}>¥50</span>
                    <span className={styles.payCount}>×1人</span>
                  </div>
                </div>
                <div className={styles.payLineMuted}>
                  <div className={styles.payLeft}>燃油</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoneyMuted}>¥40</span>
                    <span className={styles.payCount}>×1人</span>
                  </div>
                </div>

                <div className={styles.payHr} aria-hidden="true" />

                <div className={styles.payLine}>
                  <div className={styles.payLeft}>赠接送机最高8折券</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoney}>¥0</span>
                    <span className={styles.payCount}>×1份</span>
                  </div>
                </div>
                <div className={styles.payLine}>
                  <div className={styles.payLeft}>租车92折优惠券</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoney}>¥0</span>
                    <span className={styles.payCount}>×1份</span>
                  </div>
                </div>
                <div className={styles.payLine}>
                  <div className={styles.payLeft}>金牌服务包</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoney}>¥48</span>
                    <span className={styles.payCount}>×1份</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
