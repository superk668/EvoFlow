import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import styles from './Orders.module.css'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'

const STORAGE_KEY = 'evoflow_orders'
const PAGE_SIZE = 10

function readStoredOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    throw new Error('parse_failed')
  }
}

function normalizeOrder(raw) {
  if (!raw || typeof raw !== 'object') return null
  const orderId = String(raw.orderId ?? raw.id ?? '').trim()
  if (!orderId) return null

  const productType = String(raw.productType ?? 'flight').trim() || 'flight'
  const status = String(raw.status ?? '').trim() || 'pending_payment'
  const createdAt = String(raw.createdAt ?? '').trim()
  const departAt = String(raw.departAt ?? raw.details?.departAt ?? '').trim()
  const totalAmount = Number(raw.totalAmount ?? raw.amount ?? 0)

  const detailsRaw = raw.details && typeof raw.details === 'object' ? raw.details : null
  const flightId = String(detailsRaw?.flightId ?? '').trim()
  const airline = String(detailsRaw?.airline ?? '').trim()
  const cabin = String(detailsRaw?.cabin ?? '').trim()
  const departDate = String(detailsRaw?.departDate ?? '').trim()
  const depTime = String(detailsRaw?.depTime ?? '').trim()
  const arrTime = String(detailsRaw?.arrTime ?? '').trim()
  const depAirport = String(detailsRaw?.depAirport ?? '').trim()
  const arrAirport = String(detailsRaw?.arrAirport ?? '').trim()
  const routeRaw = detailsRaw?.route && typeof detailsRaw.route === 'object' ? detailsRaw.route : null
  const passengerRaw = detailsRaw?.passenger && typeof detailsRaw.passenger === 'object' ? detailsRaw.passenger : null
  const contactRaw = detailsRaw?.contact && typeof detailsRaw.contact === 'object' ? detailsRaw.contact : null
  const priceItemsRaw = Array.isArray(detailsRaw?.priceItems) ? detailsRaw.priceItems : null

  return {
    orderId,
    productType,
    status,
    createdAt,
    departAt,
    totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
    details: {
      flightId: flightId || null,
      airline: airline || null,
      cabin: cabin || null,
      departDate: departDate || null,
      depTime: depTime || null,
      arrTime: arrTime || null,
      depAirport: depAirport || null,
      arrAirport: arrAirport || null,
      route: routeRaw,
      passenger: passengerRaw,
      contact: contactRaw,
      priceItems: priceItemsRaw,
    },
  }
}

function formatMoney(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return `¥${n}`
}

function safeText(value) {
  const s = String(value ?? '').trim()
  return s ? s : '—'
}

export default function Orders() {
  const { auth } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const tab = searchParams.get('tab') || 'all'
  const productType = searchParams.get('productType') || 'all'
  const pageRaw = searchParams.get('page') || '1'
  const page = Number(pageRaw)
  const clampedPage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1

  const [orders, setOrders] = useState([])
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [cancelingId, setCancelingId] = useState('')
  const [reloadSeq, setReloadSeq] = useState(0)
  const [serverTotal, setServerTotal] = useState(null)

  const localMatchedCount = useMemo(() => {
    let list
    try {
      list = readStoredOrders()
    } catch {
      return 0
    }
    const normalized = list.map(normalizeOrder).filter(Boolean)
    return normalized.filter((o) => {
      const matchProduct = productType === 'all' ? true : o.productType === productType
      const matchTab =
        tab === 'all'
          ? true
          : tab === 'pending_travel'
            ? o.status === 'pending_travel'
            : tab === 'pending_payment'
              ? o.status === 'pending_payment'
              : tab === 'pending_review'
                ? o.status === 'pending_review'
                : o.status === tab
      return matchProduct && matchTab
    }).length
  }, [productType, tab])

  const maxPage = useMemo(() => {
    const total = Number.isFinite(Number(serverTotal)) ? Number(serverTotal) : localMatchedCount
    return Math.max(1, Math.ceil(total / PAGE_SIZE))
  }, [localMatchedCount, serverTotal])

  useEffect(() => {
    if (!Number.isFinite(page) || page < 1) {
      const next = new URLSearchParams(searchParams)
      next.set('page', '1')
      navigate({ pathname: location.pathname, search: `?${next.toString()}` }, { replace: true })
      return
    }
    if (clampedPage > maxPage) {
      let fallbackMaxPage = 1
      try {
        const list = readStoredOrders()
        const normalized = list.map(normalizeOrder).filter(Boolean)
        const matched = normalized.filter((o) => {
          const matchProduct = productType === 'all' ? true : o.productType === productType
          const matchTab =
            tab === 'all'
              ? true
              : tab === 'pending_travel'
                ? o.status === 'pending_travel'
                : tab === 'pending_payment'
                  ? o.status === 'pending_payment'
                  : tab === 'pending_review'
                    ? o.status === 'pending_review'
                    : o.status === tab
          return matchProduct && matchTab
        }).length
        fallbackMaxPage = Math.max(1, Math.ceil(matched / PAGE_SIZE))
      } catch {
        fallbackMaxPage = 1
      }
      const nextMaxPage = Math.max(maxPage, fallbackMaxPage)
      const next = new URLSearchParams(searchParams)
      next.set('page', String(nextMaxPage))
      navigate({ pathname: location.pathname, search: `?${next.toString()}` }, { replace: true })
    }
  }, [clampedPage, location.pathname, maxPage, navigate, page, productType, searchParams, tab])

  useEffect(() => {
    let alive = true

    async function run() {
      setLoadError('')
      setNotice('')
      setIsLoading(true)
      setServerTotal(null)
      const qs = new URLSearchParams({
        tab,
        productType,
        page: String(clampedPage > maxPage ? maxPage : clampedPage),
        pageSize: String(PAGE_SIZE),
      })

      let timeoutId
      let didTimeout = false
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          const err = new Error('timeout')
          err.name = 'TimeoutError'
          reject(err)
        }, 8000)
      })

      try {
        const resp = await Promise.race([
          fetch(`/api/orders?${qs.toString()}`, {
            headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {},
          }),
          timeoutPromise,
        ])

        if (!alive) return
        if (!resp.ok) {
          if (resp.status === 429) setLoadError('请求过于频繁，请稍后再试')
          else if (resp.status === 503) setLoadError('系统繁忙，请稍后重试')
          else setLoadError('订单加载失败，请稍后重试')
          return
        }
        const data = await resp.json()
        if (!alive) return
        const total = Number(data?.total)
        if (Number.isFinite(total) && total >= 0) setServerTotal(total)
        const list = Array.isArray(data?.orders) ? data.orders : []
        const normalized = list.map(normalizeOrder).filter(Boolean)
        normalized.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        setOrders(normalized)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
        } catch {
          void 0
        }
      } catch (e) {
        if (!alive) return
        const isTimeout = String(e?.name || '') === 'TimeoutError' || /timeout/i.test(String(e?.message || ''))
        if (isTimeout) {
          didTimeout = true
          flushSync(() => {
            if (alive) {
              setLoadError('系统繁忙，请稍后重试')
              setIsLoading(false)
            }
          })
          return
        }
        setLoadError('订单加载失败，请稍后重试')
      } finally {
        clearTimeout(timeoutId)
        if (alive && !didTimeout) setIsLoading(false)
      }
    }

    void run()
    return () => {
      alive = false
    }
  }, [auth?.token, clampedPage, maxPage, productType, tab, location.pathname, reloadSeq])

  function setQuery(next) {
    const qp = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([k, v]) => {
      if (v == null) qp.delete(k)
      else qp.set(k, String(v))
    })
    navigate({ pathname: location.pathname, search: `?${qp.toString()}` })
  }

  function pickTab(nextTab) {
    setQuery({ tab: nextTab, page: 1 })
  }

  function pickProductType(nextProductType) {
    setQuery({ productType: nextProductType, page: 1 })
  }

  function retry() {
    setReloadSeq((v) => v + 1)
    setLoadError('')
    setNotice('')
    setIsLoading(false)
    setQuery({ tab, productType, page: clampedPage })
  }

  async function downloadAllOrders() {
    setNotice('')
    try {
      const resp = await fetch('/api/orders/export/txt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        body: JSON.stringify({ orderIds: [] }),
      })
      if (!resp.ok) {
        setNotice('下载失败')
        return
      }
      const data = await resp.json().catch(() => null)
      const filename = String(data?.filename ?? 'orders.txt')
      const content = String(data?.content ?? '')

      const canDownload =
        typeof window !== 'undefined' &&
        typeof window.URL !== 'undefined' &&
        typeof window.URL.createObjectURL === 'function' &&
        typeof document !== 'undefined'
      if (!canDownload) return

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setNotice('下载失败')
    }
  }

  async function cancelOrder(orderId) {
    setNotice('')
    setLoadError('')
    if (!window.confirm('确认取消该订单？')) return
    setCancelingId(orderId)
    try {
      const resp = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        body: JSON.stringify({ status: 'canceled' }),
      })
      if (!resp.ok) {
        setNotice('取消失败')
        return
      }
      setOrders((prev) => {
        const next = prev
          .map((o) => (o.orderId === orderId ? { ...o, status: 'canceled' } : o))
          .filter((o) => (tab === 'all' ? true : o.status === tab))
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          void 0
        }
        return next
      })
    } catch {
      setNotice('取消失败')
    } finally {
      setCancelingId('')
    }
  }

  function goPay(orderId) {
    const qp = new URLSearchParams()
    qp.set('orderId', String(orderId))
    const search = qp.toString()
    navigate({ pathname: '/buy-ticket/step3', search: search ? `?${search}` : '' })
  }

  const showPager = maxPage > 1

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PersonalLeftBar activeKey="orders" />
        <div className={styles.main}>
          <div className={styles.notice}>
            <div className={styles.noticeIcon} aria-hidden="true" />
            <div className={styles.noticeText}>
              您可以在线查看近一年订单，如需查找更久之前的订单，请至携程app或致电95010；您也可以使用右边下载功能下载历史所有订单
            </div>
            <button type="button" className={styles.noticeDownload} onClick={downloadAllOrders}>
              <span className={styles.noticeDownloadIcon} aria-hidden="true" />
              下载历史所有订单
            </button>
          </div>

          <div className={styles.tabs} role="tablist" aria-label="订单分类">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'all'}
              className={tab === 'all' ? styles.tabActive : styles.tab}
              onClick={() => pickTab('all')}
            >
              全部订单
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'pending_travel'}
              className={tab === 'pending_travel' ? styles.tabActive : styles.tab}
              onClick={() => pickTab('pending_travel')}
            >
              未出行
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'pending_payment'}
              className={tab === 'pending_payment' ? styles.tabActive : styles.tab}
              onClick={() => pickTab('pending_payment')}
            >
              待支付
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'pending_review'}
              className={tab === 'pending_review' ? styles.tabActive : styles.tab}
              onClick={() => pickTab('pending_review')}
            >
              待点评
            </button>
            <div className={styles.tabsLine} aria-hidden="true" />
          </div>

          <div className={styles.filterBar}>
            <label className={styles.filterLabel} htmlFor="orderProductType">
              订单类型
            </label>
            <div className={styles.select}>
              <select
                id="orderProductType"
                aria-label="订单类型"
                value={productType}
                onChange={(e) => pickProductType(e.target.value)}
              >
                <option value="all">全部订单</option>
                <option value="flight">机票</option>
              </select>
              <div className={styles.selectCaret} aria-hidden="true" />
            </div>
            <div className={styles.more}>
              更多筛选条件
              <div className={styles.moreCaret} aria-hidden="true" />
            </div>
          </div>

          <div className={styles.listWrap}>
            {loadError ? (
              <div>
                <div>{loadError}</div>
                <button type="button" onClick={retry}>
                  重试
                </button>
              </div>
            ) : null}
            {notice ? <div>{notice}</div> : null}
            {isLoading ? <div>加载中</div> : null}
            {!isLoading && !loadError && orders.length === 0 ? <div>您还没有相关订单哦</div> : null}

            {!loadError && orders.length > 0
              ? orders.map((o) => {
                  const route = o.details?.route
                  const passenger = o.details?.passenger
                  const routeText =
                    route && route.fromCity && route.toCity
                      ? `${String(route.fromCity).trim()}→${String(route.toCity).trim()}`
                      : '—'
                  const canPay = o.status === 'pending_payment'
                  const canCancel = o.status !== 'canceled'

                  return (
                    <div key={o.orderId} className={styles.orderCard}>
                      <div className={styles.orderHead}>
                        <div className={styles.orderLeftHead}>
                          <div className={styles.checkbox} aria-hidden="true" />
                          <div className={styles.orderNoLabel}>订单号：</div>
                          <Link className={styles.orderNoLink} to={`/user-center/orders/${o.orderId}`}>
                            {o.orderId}
                          </Link>
                        </div>
                        <div className={styles.orderRightHead}>
                          <div className={styles.orderStatus}>{o.status === 'canceled' ? '已取消' : '正常'}</div>
                          <div className={styles.orderPrice}>{formatMoney(o.totalAmount)}</div>
                        </div>
                      </div>
                      <Link className={styles.orderBodyLink} to={`/user-center/orders/${o.orderId}`}>
                        <div className={styles.orderBody}>
                          <div className={styles.orderTitle}>{routeText}</div>
                          <div className={styles.orderMeta}>出发日期</div>
                          <div className={styles.orderMeta}>{safeText(o.departAt)}</div>
                          <div className={styles.orderMeta}>{safeText(passenger?.name)}</div>
                        </div>
                      </Link>
                      <div>
                        {canPay ? (
                          <button type="button" onClick={() => goPay(o.orderId)}>
                            去支付
                          </button>
                        ) : null}
                        {canCancel ? (
                          <button
                            type="button"
                            onClick={() => cancelOrder(o.orderId)}
                            disabled={cancelingId === o.orderId}
                          >
                            取消订单
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              : null}
          </div>

          {showPager ? (
            <div aria-label="分页">
              <button type="button" onClick={() => setQuery({ page: clampedPage - 1 })} disabled={clampedPage <= 1}>
                上一页
              </button>
              <span>
                第 {clampedPage} / {maxPage} 页
              </span>
              <button
                type="button"
                onClick={() => setQuery({ page: clampedPage + 1 })}
                disabled={clampedPage >= maxPage}
              >
                下一页
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
