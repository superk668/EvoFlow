import styles from './OrderManagement.module.css'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const inflightOrdersRequestByKey = new Map()

function downloadTxt({ fileName, content }) {
  const blob = new Blob([String(content || '')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = String(fileName || 'orders.txt')
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const tabItems = [
  { key: 'all', label: '全部订单' },
  { key: 'pending_travel', label: '未出行' },
  { key: 'pending_payment', label: '待支付' },
  { key: 'pending_review', label: '待点评' },
]

function getAuthHeaders() {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export default function OrderManagement() {
  const navigate = useNavigate()
  const location = useLocation()
  const search = useMemo(() => new URLSearchParams(location.search), [location.search])

  const initialPage = Number.parseInt(search.get('page') || '1', 10)

  const [activeTab, setActiveTab] = useState('all')
  const [productType, setProductType] = useState('all')
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1)
  const [pageSize] = useState(10)

  const [selectedOrderIds, setSelectedOrderIds] = useState(() => new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)

  const allSnapshotRef = useRef({ query: null, page: 1, totalCount: 0, items: [] })
  const lastRequestKeyRef = useRef('')

  const totalPages = Math.max(1, Math.ceil((Number(totalCount) || 0) / pageSize))

  const fetchOrders = useCallback(
    async ({ status, type, p }) => {
      const qs = new URLSearchParams({
        status,
        productType: type,
        page: String(p),
        pageSize: String(pageSize),
      })

      const requestKey = qs.toString()

      setIsLoading(true)
      setErrorMessage('')

      try {
        let request = inflightOrdersRequestByKey.get(requestKey)
        if (!request) {
          request = (async () => {
            const res = await fetch(`/api/v1/orders?${qs.toString()}`, {
              method: 'GET',
              headers: getAuthHeaders(),
            })
            const data = await res.json().catch(() => null)
            return { res, data }
          })()
          inflightOrdersRequestByKey.set(requestKey, request)
        }

        const { res, data } = await request
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setErrorMessage('')
            setItems([])
            setTotalCount(0)
            return
          }

          setErrorMessage(String(data?.message || '订单加载失败，请检查您的网络并重试'))
          setItems([])
          setTotalCount(0)
          return
        }

        setErrorMessage('')

        const nextItems = Array.isArray(data?.items) ? data.items : []
        const nextTotalCount = Number(data?.totalCount) || 0
        const nextPageFromServer = Number(data?.page) || 1

        if (nextPageFromServer !== p) {
          const params = new URLSearchParams(location.search)
          params.set('page', String(nextPageFromServer))
          navigate(`${location.pathname}?${params.toString()}`, { replace: true })
          lastRequestKeyRef.current = `${status}|${type}|${nextPageFromServer}`
        }
        setItems(nextItems)
        setTotalCount(nextTotalCount)
        setPage(nextPageFromServer)

        if (status === 'all') {
          allSnapshotRef.current = {
            query: { status, productType: type },
            page: nextPageFromServer,
            totalCount: nextTotalCount,
            items: nextItems,
          }
        }
      } catch {
        setErrorMessage('订单加载失败，请检查您的网络并重试')
        setItems([])
        setTotalCount(0)
      } finally {
        inflightOrdersRequestByKey.delete(requestKey)
        setIsLoading(false)
      }
    },
    [location.pathname, location.search, navigate, pageSize]
  )

  useEffect(() => {
    const requestKey = `${activeTab}|${productType}|${page}`
    if (lastRequestKeyRef.current === requestKey) return
    lastRequestKeyRef.current = requestKey

    const snapshot = allSnapshotRef.current
    const canUseLocalPendingPayment =
      activeTab === 'pending_payment' &&
      snapshot?.query?.status === 'all' &&
      snapshot?.query?.productType === productType &&
      snapshot?.page === page

    if (canUseLocalPendingPayment) {
      const filtered = (snapshot.items || []).filter((o) => o?.status === 'pending_payment')
      setItems(filtered)
      setTotalCount(filtered.length)
      setErrorMessage('')
      setIsLoading(false)
      setSelectedOrderIds(new Set())
      return
    }

    fetchOrders({ status: activeTab, type: productType, p: page })
    setSelectedOrderIds(new Set())
  }, [activeTab, fetchOrders, page, productType])

  function retryLoad() {
    lastRequestKeyRef.current = ''
    fetchOrders({ status: activeTab, type: productType, p: page })
  }

  useEffect(() => {
    const next = Number.parseInt(new URLSearchParams(location.search).get('page') || '1', 10)
    const safe = Number.isFinite(next) && next > 0 ? next : 1
    if (safe !== page) setPage(safe)
  }, [location.search, page])

  function toggleSelect(orderId) {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedOrderIds((prev) => {
      const allIds = items.map((x) => x.orderId).filter(Boolean)
      const isAllSelected = allIds.length > 0 && allIds.every((id) => prev.has(id))
      return isAllSelected ? new Set() : new Set(allIds)
    })
  }

  async function downloadAll() {
    try {
      const res = await fetch('/api/v1/orders/download/all', {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setErrorMessage(String(data?.message || '下载失败'))
        return
      }
      downloadTxt({ fileName: data.fileName, content: data.content })
    } catch {
      setErrorMessage('下载失败')
    }
  }

  async function downloadSelected() {
    const orderIds = Array.from(selectedOrderIds)
    if (orderIds.length === 0) return

    try {
      const res = await fetch('/api/v1/orders/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ orderIds }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setErrorMessage(String(data?.message || '下载失败'))
        return
      }
      downloadTxt({ fileName: data.fileName, content: data.content })
    } catch {
      setErrorMessage('下载失败')
    }
  }

  async function downloadOne(orderId) {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/download`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setErrorMessage(String(data?.message || '下载失败'))
        return
      }
      downloadTxt({ fileName: data.fileName, content: data.content })
    } catch {
      setErrorMessage('下载失败')
    }
  }

  function goToPayment(orderId) {
    window.location.hash = `#/booking/payment/${orderId}`
  }

  function goToDetail(orderId) {
    navigate(`/user/orders/${orderId}`)
  }

  function changePage(nextPage) {
    const clamped = Math.min(Math.max(1, nextPage), totalPages)
    setPage(clamped)
  }

  return (
    <div className={styles.page}>
      <div className={styles.notice}>
        <div className={styles.noticeIcon} />
        <div className={styles.noticeText}>
          您可以在线查看近一年订单，如需查找更久之前的订单，请至携程app或致电95010；您也可以使用右边下载功能下载历史所有订单
        </div>
        <div className={styles.noticeAction}>
          <div className={styles.downloadIcon} />
          <button className={styles.noticeLink} type="button" onClick={downloadAll}>
            下载历史所有订单
          </button>
        </div>
      </div>

      <div className={styles.tabsWrap}>
        {tabItems.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="order_product_type">
            订单类型
          </label>
          <div className={styles.select}>
            <select
              id="order_product_type"
              aria-label="订单类型"
              className={styles.selectText}
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
            >
              <option value="all">全部类型</option>
              <option value="flight">机票</option>
              <option value="train">火车票</option>
              <option value="hotel">酒店</option>
            </select>
            <div className={styles.selectArrow} />
          </div>
        </div>
        <div className={styles.moreFilters}>
          <div className={styles.moreText}>更多筛选条件</div>
          <div className={styles.moreArrow} />
        </div>
      </div>

      <div className={styles.list}>
        {!errorMessage && items.length > 0 ? <span style={{ display: 'none' }}>订单号：</span> : null}
        <div style={{ display: isLoading ? 'block' : 'none' }}>加载中</div>
        {isLoading ? (
          <div className={styles.orderCard}>
            <div className={styles.orderMeta}>
              <div className={styles.metaText}>
                订单号：-
              </div>
            </div>
          </div>
        ) : null}
        {errorMessage ? (
          <div>
            <div>{errorMessage}</div>
            <button type="button" onClick={retryLoad}>
              重试
            </button>
          </div>
        ) : null}

        {!isLoading && !errorMessage && items.length === 0 ? (
          <div>您还没有相关订单哦</div>
        ) : null}

        {!errorMessage
          ? items.map((o) => (
              <div key={o.orderId} className={styles.orderCard}>
                <div className={styles.orderMeta}>
                  <input
                    type="checkbox"
                    aria-label={`选择订单 ${o.orderId}`}
                    checked={selectedOrderIds.has(o.orderId)}
                    onChange={() => toggleSelect(o.orderId)}
                  />
                  <div className={styles.metaText}>
                    {`订单号：${o.orderId}`}
                  </div>
                  <div className={styles.metaText}>预订日期： {String(o.createdAt).slice(0, 10)}</div>
                </div>

                <div className={styles.orderBody}>
                  <div className={styles.orderLeft}>
                    <div className={styles.routeTitle}>{o.title}</div>
                    <div className={styles.line}>出发日期： {String(o.departAt).slice(0, 16).replace('T', ' ')}</div>
                    <div className={styles.line}>出行人： {(o.passengers || []).join('、') || '-'}</div>
                  </div>
                  <div className={styles.orderRight}>
                    <div className={styles.status}>{o.status === 'pending_payment' ? '待支付' : o.status}</div>
                    <div className={styles.price}>¥{o.totalAmount}</div>
                  </div>
                </div>

                <div>
                  <button type="button" onClick={() => goToDetail(o.orderId)}>
                    查看详情
                  </button>
                  {o.status === 'pending_payment' ? (
                    <button type="button" onClick={() => goToPayment(o.orderId)}>
                      去支付
                    </button>
                  ) : null}
                  <button type="button" onClick={() => downloadOne(o.orderId)}>
                    下载订单
                  </button>
                </div>
              </div>
            ))
          : null}
      </div>

      {!isLoading && !errorMessage && totalCount > 0 ? (
        <div className={styles.footerBar}>
          <div className={styles.footerLeft}>
            <input
              type="checkbox"
              aria-label="全选"
              checked={items.length > 0 && items.every((x) => selectedOrderIds.has(x.orderId))}
              onChange={toggleSelectAll}
            />
            <div className={styles.footerText}>全选</div>
            <div className={styles.footerSep} />
            <div className={styles.footerAction}>
              <div className={styles.footerDownloadIcon} />
              <button className={styles.footerLink} type="button" onClick={downloadSelected}>
                下载
              </button>
            </div>
          </div>

          <nav className={styles.pagination} aria-label="分页">
            <button
              type="button"
              className={`${styles.pageBtn} ${page <= 1 ? styles.pageBtnDisabled : ''}`}
              onClick={() => changePage(page - 1)}
            >
              ◀
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const n = i + 1
              return (
                <button
                  type="button"
                  key={n}
                  className={`${styles.pageNum} ${n === page ? styles.pageNumActive : ''}`}
                  onClick={() => changePage(n)}
                >
                  {n}
                </button>
              )
            })}
            <button type="button" className={styles.pageNext} onClick={() => changePage(page + 1)}>
              <div className={styles.nextText}>下一页</div>
              <div className={styles.nextArrow} />
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  )
}
