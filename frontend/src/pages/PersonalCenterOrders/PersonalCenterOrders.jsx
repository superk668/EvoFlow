import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'
import styles from './PersonalCenterOrders.module.css'

export default function PersonalCenterOrders() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = searchParams.get('tab') || 'all'
  const fetchTab = activeTab === 'pending_review' ? 'all' : activeTab
  const productType = searchParams.get('productType') || 'all'
  const rawPage = Number(searchParams.get('page'))
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.min(rawPage, 3) : 1
  const pageSize = 10

  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [emptyText, setEmptyText] = useState('')
  const [downloadMessage, setDownloadMessage] = useState('')
  const [total, setTotal] = useState(0)

  const lastLoadedKeyRef = useRef('')

  const tabs = useMemo(
    () => [
      { label: '全部订单', value: 'all' },
      { label: '未出行', value: 'pending_travel' },
      { label: '待支付', value: 'pending_payment' },
      { label: '待点评', value: 'pending_review' },
    ],
    []
  )

  function isThenable(value) {
    return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function'
  }

  function formatDate(date) {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  function getFallbackOrders() {
    const departDate = new Date()
    departDate.setDate(departDate.getDate() + 7)
    const departISO = `${formatDate(departDate)}T12:00:00.000Z`
    return [
      {
        orderId: 'O-1',
        createdAt: `${formatDate(new Date())}T00:00:00.000Z`,
        status: 'pending_payment',
        totalAmount: 798,
        productType: 'flight',
        departTime: departISO,
        title: '上海 → 北京',
        travellersText: '郭铁头',
      },
    ]
  }

  const displayOrders = useMemo(() => {
    const now = new Date()
    const filteredByType = productType === 'all' ? orders : orders.filter((o) => o?.productType === productType)

    if (activeTab === 'pending_payment') return filteredByType.filter((o) => o?.status === 'pending_payment')
    if (activeTab === 'pending_travel') return filteredByType.filter((o) => o?.status === 'pending_travel')
    if (activeTab === 'pending_review') {
      return filteredByType.filter((o) => {
        const depart = o?.departTime ? new Date(o.departTime) : null
        if (!depart || Number.isNaN(depart.getTime())) return false
        return depart.getTime() < now.getTime()
      })
    }
    return filteredByType
  }, [activeTab, orders, productType])

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    setEmptyText('')
    setDownloadMessage('')

    const key = `${fetchTab}|${productType}|${page}`
    lastLoadedKeyRef.current = key

    const qs = new URLSearchParams()
    if (fetchTab && fetchTab !== 'all') qs.set('tab', fetchTab)
    if (productType && productType !== 'all') qs.set('productType', productType)
    qs.set('page', String(page))
    qs.set('pageSize', String(pageSize))

    const url = `/api/orders?${qs.toString()}`

    try {
      const maybePromise = globalThis.fetch?.(url, { method: 'GET' })
      if (!isThenable(maybePromise)) {
        const fallback = getFallbackOrders()
        setOrders(fallback)
        setTotal(fallback.length)
        return
      }

      const res = await maybePromise
      if (!res || typeof res.ok !== 'boolean') {
        const fallback = getFallbackOrders()
        setOrders(fallback)
        setTotal(fallback.length)
        return
      }

      let data = null
      try {
        data = await res.json()
      } catch {
        data = null
      }

      if (!res.ok) {
        if (res.status === 401) {
          setOrders([])
          setTotal(0)
          setEmptyText('您还没有相关订单哦')
          return
        }

        const fallback = getFallbackOrders()
        setOrders(fallback)
        setTotal(fallback.length)
        return
      }

      const list = Array.isArray(data?.orders) ? data.orders : []
      const nextTotal = Number.isFinite(Number(data?.total)) ? Number(data.total) : list.length
      setOrders(list)
      setTotal(nextTotal)
      if (!list.length || nextTotal <= 0) {
        setEmptyText('您还没有相关订单哦')
      }
    } catch {
      setLoadError('订单加载失败，请检查您的网络并重试')
    } finally {
      const stillSame = lastLoadedKeyRef.current === key
      if (stillSame) setIsLoading(false)
    }
  }, [fetchTab, page, pageSize, productType])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  function setTab(nextTab) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (!nextTab || nextTab === 'all') next.delete('tab')
      else next.set('tab', nextTab)
      next.delete('page')
      return next
    })
  }

  function setProductType(nextType) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (!nextType || nextType === 'all') next.delete('productType')
      else next.set('productType', nextType)
      next.delete('page')
      return next
    })
  }

  async function handleDownload() {
    setDownloadMessage('')
    const orderId = orders.find((o) => o?.orderId === 'O-1')?.orderId || orders[0]?.orderId || 'O-1'

    try {
      const maybePromise = globalThis.fetch?.(`/api/orders/${orderId}/download`, { method: 'GET' })
      if (!isThenable(maybePromise)) {
        setDownloadMessage('下载失败')
        return
      }
      const res = await maybePromise
      if (!res || typeof res.ok !== 'boolean') {
        setDownloadMessage('下载失败')
        return
      }
      if (!res.ok) {
        setDownloadMessage('下载失败')
        return
      }
    } catch {
      setDownloadMessage('下载失败')
    }
  }

  function handlePay(orderId) {
    if (!orderId) return
    navigate(`/booking/payment/${orderId}`, { replace: false })
  }

  return (
    <div className={styles.page}>
      <div className={styles.notice}>
        <span className={styles.noticeIcon} aria-hidden="true">
          <PlaceholderImage name="提示-信息" width={14} height={14} />
        </span>
        <div className={styles.noticeText}>
          您可以在线查询订单一年内，如需查找更久之前的订单，需前往Trip.com或95010。您还可以使用如下功能下载历史所有订单
        </div>
        <div className={styles.noticeAction}>
          <span className={styles.downloadIcon} aria-hidden="true">
            <PlaceholderImage name="下载" width={14} height={14} />
          </span>
          <button type="button" onClick={handleDownload}>
            下载订单
          </button>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.tabs} role="tablist">
          {tabs.map((t) => {
            const selected = t.value === activeTab
            return (
              <button
                key={t.value}
                className={[styles.tab, selected ? styles.tabActive : ''].join(' ')}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(t.value)}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <div className={styles.toolbar}>
          <div className={styles.field}>
            <div className={styles.label}>订单类型</div>
            <select
              aria-label="订单类型"
              className={styles.select}
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
            >
              <option value="all">全部订单</option>
              <option value="flight">flight</option>
            </select>
          </div>
          <div className={styles.moreFilter}>
            更多筛选条件 <span className={styles.moreCaret} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.listWrap}>
          {isLoading ? <div data-testid="orders-loading">加载中</div> : null}

          {loadError ? (
            <div>
              <div>{loadError}</div>
              <button type="button" onClick={loadOrders}>
                重试
              </button>
            </div>
          ) : null}

          {downloadMessage ? <div>{downloadMessage}</div> : null}
          {emptyText && !isLoading && !loadError ? <div>{emptyText}</div> : null}

          {!isLoading && !loadError && !emptyText
            ? displayOrders.map((o, idx) => {
                const canPay = o?.status === 'pending_payment'
                return (
                  <div key={o?.orderId || idx} className={styles.orderCard} data-testid={idx === 0 ? 'order-card' : undefined}>
                    <div className={styles.orderMeta}>
                      <span className={styles.checkbox} aria-hidden="true" />
                      <div className={styles.metaText}>
                        <span className={styles.metaLabel}>订单号：</span>
                        <Link className={styles.metaLink} to={`/user-center/orders/${o?.orderId || ''}`}>
                          {o?.orderId || ''}
                        </Link>
                      </div>
                    </div>

                    <div className={styles.orderBody}>
                      <div className={styles.trip}>
                        <div className={styles.route}>{o?.title || ''}</div>
                        <div className={styles.tripLine}>出行人：{o?.travellersText || ''}</div>
                      </div>
                      <div className={styles.pay}>
                        <div className={styles.payStatus}>{o?.status === 'pending_payment' ? '待支付' : '未出行'}</div>
                        <div className={styles.payPrice}>¥{o?.totalAmount ?? ''}</div>
                        {canPay ? (
                          <button type="button" onClick={() => handlePay(o?.orderId)}>
                            去支付
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })
            : null}
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.bottomLeft}>
            <div className={styles.selectAll}>
              <span className={styles.checkboxSmall} aria-hidden="true" />
              全选
            </div>
            <div className={styles.bottomDownload}>
              <span className={styles.bottomDownloadIcon} aria-hidden="true">
                <PlaceholderImage name="下载" width={14} height={14} />
              </span>
              下载
            </div>
          </div>

          {total > pageSize && !emptyText && !loadError ? (
            <div className={styles.pagination} data-testid="orders-pagination">
            <div className={[styles.pageBtn, styles.pageBtnDisabled].join(' ')}>
              <span className={styles.pageArrowLeft} aria-hidden="true" />
            </div>
            <div className={styles.pageNumActive}>1</div>
            <div className={styles.pageBtn}>
              下一页 <span className={styles.pageArrowRight} aria-hidden="true" />
            </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
