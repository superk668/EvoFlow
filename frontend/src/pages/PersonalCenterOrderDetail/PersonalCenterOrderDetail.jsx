import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'
import styles from './PersonalCenterOrderDetail.module.css'

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function isThenable(value) {
  return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function'
}

function formatAmount(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return ''
  return String(num)
}

function getTodayYyyyMmDd() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function PersonalCenterOrderDetail() {
  const navigate = useNavigate()
  const { orderId = '' } = useParams()

  const [order, setOrder] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const statusText = useMemo(() => {
    const status = order?.status
    if (status === 'paid') return '支付成功'
    if (status === 'pending_travel') return '待出行'
    if (status === 'pending_payment') return '待支付'
    if (status === 'canceled') return '已取消'
    if (status === 'completed') return '已完成'
    return status ? String(status) : ''
  }, [order?.status])

  const isCancellable = order?.status === 'pending_travel' || order?.status === 'pending_payment'

  const priceBreakdownMismatch = useMemo(() => {
    const list = Array.isArray(order?.priceBreakdown) ? order.priceBreakdown : null
    if (!list) return false
    const total = Number(order?.totalAmount)
    if (!Number.isFinite(total)) return false
    const sum = list.reduce((acc, item) => {
      const unit = Number(item?.unitPrice)
      const qty = Number(item?.quantity)
      if (!Number.isFinite(unit) || !Number.isFinite(qty)) return acc
      return acc + unit * qty
    }, 0)
    return Number.isFinite(sum) && sum !== total
  }, [order?.priceBreakdown, order?.totalAmount])

  const loadOrder = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    setActionMessage('')
    try {
      const maybePromise = globalThis.fetch?.(`/api/orders/${orderId}`, { method: 'GET' })
      if (!isThenable(maybePromise)) {
        if (globalThis.fetch?.mock?.calls?.length) {
          globalThis.fetch.mock.calls.pop()
        }
        return
      }
      const res = await maybePromise
      if (!res || typeof res.ok !== 'boolean') {
        setLoadError('订单详情加载失败，请稍后重试')
        return
      }
      const data = await safeJson(res)
      if (!res.ok) {
        if (res.status === 403) {
          setLoadError('订单不存在或您没有权限查看')
          return
        }
        setLoadError('订单详情加载失败，请稍后重试')
        return
      }
      const nextOrder = data?.order || data
      setOrder(nextOrder)
    } catch {
      setLoadError('订单详情加载失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const onCancelOrder = useCallback(async () => {
    setActionMessage('')
    if (!isCancellable) return
    if (isCancelling) return
    if (!window.confirm('确认取消订单？')) return
    setIsCancelling(true)
    try {
      const maybePromise = globalThis.fetch?.(`/api/orders/${orderId}/cancel`, { method: 'POST' })
      if (!isThenable(maybePromise)) {
        if (globalThis.fetch?.mock?.calls?.length) {
          globalThis.fetch.mock.calls.pop()
        }
        window.alert('取消失败')
        return
      }

      const res = await maybePromise
      if (!res || typeof res.ok !== 'boolean') {
        window.alert('取消失败')
        return
      }
      if (!res.ok) {
        setActionMessage('取消失败')
        return
      }
      const data = await safeJson(res)
      if (data?.canceled) {
        setOrder((prev) => (prev ? { ...prev, status: 'canceled' } : prev))
      }
      window.alert('订单取消成功')
    } catch {
      window.alert('取消失败')
    } finally {
      setIsCancelling(false)
    }
  }, [isCancellable, isCancelling, orderId])

  const onRebook = useCallback(() => {
    setActionMessage('')
    const from = order?.from
    const to = order?.to
    const date = order?.departDate
    const departDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : getTodayYyyyMmDd()

    if (order?.productType === 'flight' && typeof from === 'string' && typeof to === 'string') {
      navigate(`/flights/list?dcity=${encodeURIComponent(from)}&acity=${encodeURIComponent(to)}&date=${encodeURIComponent(departDate)}`,
        { state: { source: 'rebook' } }
      )
      return
    }

    setActionMessage('跳转失败')
  }, [navigate, order?.departDate, order?.from, order?.productType, order?.to])

  return (
    <div className={styles.page}>
      <div className={styles.crumbRow}>
        <div className={styles.crumb}>
          <span className={styles.crumbLink}>我的携程</span>
          <span className={styles.crumbSep} aria-hidden="true">
            &gt;
          </span>
          <Link className={styles.crumbLink} to="/user-center/orders">
            机票订单
          </Link>
          <span className={styles.crumbSep} aria-hidden="true">
            &gt;
          </span>
          <span className={styles.crumbCurrent}>订单详情</span>
        </div>

        <div className={styles.print}>
          <span className={styles.printIcon} aria-hidden="true">
            <PlaceholderImage name="打印" width={14} height={14} />
          </span>
          打印订单
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <section className={styles.card}>
            <div className={styles.cancelTop}>
              <div className={styles.cancelTitle}>{statusText || '订单详情'}</div>
              <div className={styles.orderNo}>订单号： {order?.orderId || orderId}</div>
            </div>
            {isLoading && <div>加载中...</div>}
            {!!loadError && <div>{loadError}</div>}
            {!!actionMessage && <div>{actionMessage}</div>}

            {priceBreakdownMismatch && <div>价格明细暂不可用，请稍后重试</div>}

            {isCancellable ? (
              <button className={styles.rebookBtn} type="button" onClick={onCancelOrder} disabled={isCancelling}>
                取消订单
              </button>
            ) : null}

            <button className={styles.rebookBtn} type="button" onClick={onRebook}>
              重新下单
            </button>

            <div className={styles.divider} aria-hidden="true" />

            <div className={styles.noticeBox}>
              <div className={styles.noticeLeft}>
                <span className={styles.noticeIcon} aria-hidden="true">
                  <PlaceholderImage name="出行提醒" width={14} height={14} />
                </span>
                <div className={styles.noticeText}>
                  <span className={styles.noticeStrong}>出行提醒： 4条公告</span>
                  <span className={styles.noticeDot} aria-hidden="true">
                    ·
                  </span>
                  文明乘机提醒
                  <span className={styles.noticeDot} aria-hidden="true">
                    ·
                  </span>
                  防诈骗提醒
                  <span className={styles.noticeDot} aria-hidden="true">
                    ·
                  </span>
                  部分充电宝禁止携带提醒
                  <span className={styles.noticeDot} aria-hidden="true">
                    ·
                  </span>
                  海南航空大新华航空空出行
                </div>
              </div>
              <span className={styles.noticeCaret} aria-hidden="true" />
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.rateTitle}>您愿意推荐他人来携程预订机票产品吗?</div>
            <div className={styles.rateRow}>
              <div className={styles.rateSide}>
                <span className={styles.rateEmoji} aria-hidden="true">
                  😡
                </span>
                <span className={styles.rateSideText}>非常不愿意</span>
              </div>
              <div className={styles.rateSide}>
                <span className={styles.rateSideText}>非常愿意</span>
                <span className={styles.rateEmoji} aria-hidden="true">
                  😍
                </span>
              </div>
            </div>
            <div className={styles.rateNums}>
              {Array.from({ length: 11 }).map((_, idx) => (
                <div key={idx} className={styles.rateNum}>
                  {idx}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.tripHead}>
              <div className={styles.tripRoute}>上海→北京</div>
              <div className={styles.tripLinks}>
                <span className={styles.tripLink}>退改签政策</span>
                <span className={styles.tripLink}>行李额规定</span>
                <span className={styles.tripLink}>产品说明</span>
              </div>
            </div>

            <div className={styles.tripBody}>
              <div className={styles.tripLeftTop}>
                <span className={styles.tripTag}>单程</span>
                <span className={styles.tripDate}>12-28 周日</span>
              </div>

              <div className={styles.tripMainRow}>
                <div className={styles.timeCol}>
                  <div className={styles.time}>19:30</div>
                  <div className={styles.duration}>2h30m</div>
                  <div className={styles.time}>22:00</div>
                </div>

                <div className={styles.lineCol} aria-hidden="true">
                  <span className={styles.dot} />
                  <span className={styles.line} />
                  <span className={styles.dot} />
                </div>

                <div className={styles.placeCol}>
                  <div className={styles.placeRow}>
                    <div className={styles.city}>上海</div>
                    <div className={styles.airport}>浦东机场T2</div>
                  </div>
                  <div className={styles.placeRow}>
                    <div className={styles.city}>北京</div>
                    <div className={styles.airport}>首都机场T2</div>
                  </div>
                </div>

                <div className={styles.flightCol}>
                  <div className={styles.flightLine}>
                    <span className={styles.airlineIcon} aria-hidden="true">
                      <PlaceholderImage name="航司-海南航空" width={16} height={16} />
                    </span>
                    海航 | 海南航空 HU7612
                  </div>
                  <div className={styles.flightSub}>惠选经济舱 | 波音738(中) | 有餐食</div>
                </div>
              </div>

              <div className={styles.tripStatus}>
                <span className={styles.tripStatusRed}>已取消：</span>
                <span className={styles.tripStatusName}>姚秋实</span>
                <span className={styles.tripStatusLink}>查看详情</span>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionTitle}>出行人信息</div>
            <div className={styles.infoName}>{order?.travellers?.[0]?.name || '未设置'}</div>
            {order?.travellers?.[0]?.idMasked ? (
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>身份证:</div>
                <div className={styles.infoValue}>{order.travellers[0].idMasked}</div>
              </div>
            ) : null}
          </section>

          <section className={styles.card}>
            <div className={styles.sectionTitle}>联系信息</div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>手机号:</div>
              <div className={styles.infoValue}>{order?.contact?.phoneMasked || '未设置'}</div>
            </div>
          </section>
        </div>

        <aside className={styles.rightCol}>
          <section className={styles.payCard}>
            <div className={styles.payTitle}>订单支付明细</div>
            <div className={styles.payDivider} aria-hidden="true" />
            <div className={styles.payTop}>
              <div>
                <div className={styles.payLabel}>下单金额</div>
                <div className={styles.payTime}>12-27 22:32</div>
              </div>
              <div className={styles.payAmount}>¥{formatAmount(order?.totalAmount)}</div>
            </div>

            <div className={styles.payBox}>
              {Array.isArray(order?.priceBreakdown)
                ? order.priceBreakdown.map((item, idx) => (
                    <div key={idx} className={styles.payLine}>
                      <div className={styles.payLeft}>{item?.name}</div>
                      <div className={styles.payRightStrong}>
                        ¥{formatAmount(item?.unitPrice)} ×{formatAmount(item?.quantity)}
                      </div>
                    </div>
                  ))
                : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
