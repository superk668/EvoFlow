import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import styles from './Orders.module.css'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'

const ORDERS_KEY = 'evoflow_orders'

function safeLoadOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (!raw) return { orders: [], error: '' }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return { orders: [], error: '' }
    return { orders: parsed, error: '' }
  } catch {
    return { orders: [], error: '订单加载失败，请稍后重试' }
  }
}

function safeWriteOrders(nextOrders) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders))
    return { ok: true, error: '' }
  } catch {
    return { ok: false, error: '订单写入失败，请稍后重试' }
  }
}

function safeParseInt(s) {
  const n = Number.parseInt(String(s || ''), 10)
  return Number.isFinite(n) ? n : null
}

function isFuture(iso) {
  const t = new Date(String(iso || '')).getTime()
  if (!Number.isFinite(t)) return false
  return t > Date.now()
}

export default function Orders() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [{ orders, error }, setLoad] = useState(() => safeLoadOrders())
  const [productOpen, setProductOpen] = useState(false)
  const [cancelingOrderId, setCancelingOrderId] = useState('')
  const [cancelError, setCancelError] = useState('')

  const tab = searchParams.get('tab') || 'all'
  const productType = searchParams.get('productType') || 'all'
  const page = safeParseInt(searchParams.get('page') || '1') || 1

  const filtered = useMemo(() => {
    let list = orders

    if (productType !== 'all') {
      list = list.filter((o) => String(o?.productType) === String(productType))
    }

    if (tab === 'pending_payment') {
      list = list.filter((o) => String(o?.status) === 'pending_payment')
    } else if (tab === 'pending_travel') {
      list = list.filter((o) => String(o?.status) === 'pending_travel' && isFuture(o?.departAt))
    } else if (tab === 'pending_review') {
      list = list.filter((o) => String(o?.status) === 'pending_travel' && !isFuture(o?.departAt))
    }

    return list
  }, [orders, productType, tab])

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const pageList = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => {
    if (page !== safePage) {
      navigate({ pathname: '/user-center/orders' }, { replace: true })
    }
  }, [navigate, page, safePage])

  function updateQuery(next) {
    const copy = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([k, v]) => {
      if (v == null || v === '' || v === 'all') copy.delete(k)
      else copy.set(k, String(v))
    })
    setSearchParams(copy)
  }

  function retry() {
    setLoad(safeLoadOrders())
  }

  function downloadHistory(e) {
    e.preventDefault()
    setCancelError('')
    try {
      const payload = JSON.stringify(orders, null, 2)
      const blob = new Blob([payload], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'orders.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setCancelError('下载失败，请稍后重试')
    }
  }

  async function cancelOrder(orderId) {
    setCancelError('')
    const ok = window.confirm('确认取消该订单吗？')
    if (!ok) return

    setCancelingOrderId(String(orderId))
    try {
      const resp = await fetch('/api/user-center/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      if (!resp || resp.status >= 400) {
        setCancelError('取消失败，请稍后重试')
        return
      }

      setLoad((prev) => {
        const nextOrders = (prev?.orders || []).map((o) => {
          if (String(o?.orderId) !== String(orderId)) return o
          return { ...o, status: 'canceled', canceledAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        })

        const written = safeWriteOrders(nextOrders)
        if (!written.ok) {
          setCancelError('取消失败，请稍后重试')
          return prev
        }
        return { orders: nextOrders, error: '' }
      })
    } catch {
      setCancelError('取消失败，请稍后重试')
    } finally {
      setCancelingOrderId('')
    }
  }


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
            <a className={styles.noticeDownload} href="#/" onClick={downloadHistory}>
              <span className={styles.noticeDownloadIcon} aria-hidden="true" />
              下载历史所有订单
            </a>
          </div>

          <div className={styles.tabs}>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'all'}
              className={tab === 'all' ? styles.tabActive : styles.tab}
              onClick={() => updateQuery({ tab: 'all', page: 1 })}
            >
              全部订单
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'pending_travel'}
              className={tab === 'pending_travel' ? styles.tabActive : styles.tab}
              onClick={() => updateQuery({ tab: 'pending_travel', page: 1 })}
            >
              未出行
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'pending_payment'}
              className={tab === 'pending_payment' ? styles.tabActive : styles.tab}
              onClick={() => updateQuery({ tab: 'pending_payment', page: 1 })}
            >
              待支付
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'pending_review'}
              className={tab === 'pending_review' ? styles.tabActive : styles.tab}
              onClick={() => updateQuery({ tab: 'pending_review', page: 1 })}
            >
              待点评
            </button>
            <div className={styles.tabsLine} aria-hidden="true" />
          </div>

          <div className={styles.filterBar}>
            <button
              type="button"
              className={styles.filterLabel}
              onClick={() => setProductOpen((v) => !v)}
            >
              订单类型
            </button>
            <div className={styles.select} aria-hidden="true">
              <div className={styles.selectText}>{productType === 'all' ? '全部类型' : productType}</div>
              <div className={styles.selectCaret} aria-hidden="true" />
            </div>
            <div className={styles.more}>
              更多筛选条件
              <div className={styles.moreCaret} aria-hidden="true" />
            </div>
          </div>

          {productOpen ? (
            <div role="listbox">
              <button type="button" role="option" onClick={() => updateQuery({ productType: 'all', page: 1 })}>
                全部订单
              </button>
              <button type="button" role="option" onClick={() => updateQuery({ productType: 'flight', page: 1 })}>
                机票
              </button>
              <button type="button" role="option" onClick={() => updateQuery({ productType: 'train', page: 1 })}>
                火车票
              </button>
              <button type="button" role="option" onClick={() => updateQuery({ productType: 'hotel', page: 1 })}>
                酒店
              </button>
            </div>
          ) : null}

          {error ? (
            <div>
              <div>{error}</div>
              <button type="button" onClick={retry}>
                重试
              </button>
            </div>
          ) : null}

          {cancelError ? <div>{cancelError}</div> : null}

          <div className={styles.listWrap}>
            <div className={styles.orderNoLabel}>订单号</div>
            {filtered.length === 0 && !error ? <div>您还没有相关订单哦</div> : null}

            {pageList.map((o) => (
              <div key={String(o?.orderId)} className={styles.orderCard}>
                <div className={styles.orderHead}>
                  <div className={styles.orderLeftHead}>
                    <div className={styles.checkbox} aria-hidden="true" />
                    <div className={styles.orderNoLabel}>订单号：</div>
                    <Link className={styles.orderNoLink} to={`/user-center/orders/${o.orderId}`}>
                      {o.orderId}
                    </Link>
                  </div>
                </div>
                {String(o?.status) === 'pending_payment' ? (
                  <Link to={`/booking/payment/${o.orderId}`}>去支付-{o.orderId}</Link>
                ) : null}

                {String(o?.status) === 'pending_payment' || String(o?.status) === 'pending_travel' ? (
                  <button
                    type="button"
                    disabled={cancelingOrderId === String(o?.orderId)}
                    onClick={() => cancelOrder(o.orderId)}
                  >
                    取消订单
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <div className={styles.bottomBar}>
            <div className={styles.bottomLeft}>
              <div className={styles.checkWrap}>
                <div className={styles.checkbox} aria-hidden="true" />
                <div className={styles.bottomText}>全选</div>
              </div>
              <a className={styles.downloadLink} href="#/">
                <span className={styles.noticeDownloadIcon} aria-hidden="true" />
                下载
              </a>
            </div>

            <div className={styles.pager}>
              <div className={styles.pagerPrev} aria-hidden="true" />
              <div className={styles.pagerNumActive}>1</div>
              <div className={styles.pagerNext}>下一页</div>
              <div className={styles.pagerNextCaret} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
