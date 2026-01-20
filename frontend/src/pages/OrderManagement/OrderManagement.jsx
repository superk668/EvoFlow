import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import PersonalCenterNav from '../PersonalCenter/LocalComponents/PersonalCenterNav.jsx'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './OrderManagement.module.css'

function getAuthHeader() {
  try {
    const token = localStorage.getItem('auth_token') || ''
    return token ? { Authorization: `Bearer ${token}` } : null
  } catch {
    return null
  }
}

function getStatusLabel(status) {
  if (status === 'pending_payment') return '待支付'
  if (status === 'upcoming') return '未出行'
  if (status === 'pending_travel') return '未出行'
  if (status === 'completed') return '已完成'
  if (status === 'canceled') return '已取消'
  return status || ''
}

export default function OrderManagement() {
  const navigate = useNavigate()
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)

  const statusTabs = useMemo(
    () => [
      { label: '全部订单', value: 'all' },
      { label: '未出行', value: 'upcoming' },
      { label: '待支付', value: 'pending_payment' },
      { label: '已完成', value: 'completed' },
    ],
    []
  )

  const listUrl = useMemo(() => {
    const params = new URLSearchParams({
      status: selectedStatus,
      type: selectedType,
      page: String(page),
      pageSize: String(pageSize),
    })
    return `/api/orders?${params.toString()}`
  }, [page, pageSize, selectedStatus, selectedType])

  useEffect(() => {
    const authHeader = getAuthHeader()
    let isActive = true

    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const fetchOptions = authHeader ? { method: 'GET', headers: authHeader } : { method: 'GET' }
        const p = fetch(listUrl, fetchOptions)
        if (!p || typeof p.then !== 'function') {
          return
        }

        const res = await p
        const data = await res.json().catch(() => null)
        if (!isActive) return
        if (!res.ok) {
          if (res.status === 401 && authHeader) {
            navigate('/login', { replace: true })
            return
          }
          setOrders([])
          setTotal(0)
          if (res.status !== 401) {
            setError(data?.error || '加载失败')
          }
          return
        }

        const items = Array.isArray(data?.items) ? data.items : []
        setOrders(items)
        setTotal(Number(data?.total) || 0)
      } catch {
        if (!isActive) return
        setOrders([])
        setTotal(0)
        setError('网络异常，请稍后重试')
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    load()
    return () => {
      isActive = false
    }
  }, [listUrl, navigate])

  async function handleDelete(orderId) {
    const authHeader = getAuthHeader()
    if (!authHeader) {
      navigate('/login', { replace: true })
      return
    }

    setError('')
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE', headers: authHeader })
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null)
        setError(data?.error || '删除失败')
        return
      }
      setOrders((prev) => prev.filter((o) => o?.orderId !== orderId))
      setTotal((prev) => Math.max(0, (Number(prev) || 0) - 1))
    } catch {
      setError('网络异常，请稍后重试')
    }
  }

  function handlePay(orderId) {
    navigate(`/booking/payment/${encodeURIComponent(orderId)}`)
  }

  function handleOpenDetail(orderId) {
    navigate(`/orders/${encodeURIComponent(orderId)}`)
  }

  const showEmpty = !isLoading && !error && orders.length === 0
  const canNextPage = page * pageSize < total

  return (
    <div className={styles.page}>
      <TopHeader variant="authed" showHomeInAuthed showSearch={false} />

      <div className={styles.body}>
        <div className={styles.container}>
          <PersonalCenterNav />

          <main className={styles.main}>
            <section className={styles.panel}>
              <h1 className={styles.title}>我的订单</h1>

              <div className={styles.noticeBar}>
                <div className={styles.noticeLeft}>
                  <span className={styles.noticeIcon} aria-hidden />
                  <span className={styles.noticeText}>
                    您可以在携程查看一年订单，如需查找更久之前的订单，请至携程app或致电95010。您也可以使用右方下载功能下载历史所有订单
                  </span>
                </div>
                <button className={styles.noticeAction} type="button">
                  下载历史所有订单
                </button>
              </div>

              <div className={styles.tabsRow}>
                {statusTabs.map((t) => (
                  <button
                    key={t.value}
                    className={selectedStatus === t.value ? styles.tabActive : styles.tab}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(t.value)
                      setPage(1)
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className={styles.filterRow}>
                <div className={styles.filterGroup}>
                  <div className={styles.filterLabel}>订单类型</div>
                  <div className={styles.filterSelect}>
                    <select
                      className={styles.typeSelect}
                      value={selectedType}
                      onChange={(e) => {
                        setSelectedType(e.target.value)
                        setPage(1)
                      }}
                    >
                      <option value="all">全部订单</option>
                      <option value="flight">机票</option>
                      <option value="train">火车票</option>
                      <option value="hotel">酒店</option>
                    </select>
                    <span className={styles.caretDown} aria-hidden />
                  </div>
                </div>

                <div className={styles.filterMore}>
                  更多筛选条件 <span className={styles.caretDownSmall} aria-hidden />
                </div>
              </div>

              {isLoading ? (
                <div className={styles.loading} role="status">
                  加载中...
                </div>
              ) : null}

              {error ? (
                <div className={styles.error} role="alert">
                  {error}
                </div>
              ) : null}

              {showEmpty ? <div className={styles.empty}>您还没有相关订单哦</div> : null}

              {orders.length > 0 ? (
                <>
                  <div className={styles.orderList}>
                    {orders.map((o) => (
                      <div key={o.orderId} className={styles.orderItem}>
                        <div className={styles.orderHeader}>
                          <div className={styles.orderHeaderLeft}>
                            <span className={styles.checkbox} aria-hidden />
                            <span className={styles.headerText}>订单号：&nbsp;{o.orderNo || o.orderId}</span>
                            <span className={styles.headerSplit} aria-hidden />
                            <span className={styles.headerText}>预订日期：&nbsp;{o.createdAt || ''}</span>
                          </div>

                          <button className={styles.headerLink} type="button" onClick={() => handleDelete(o.orderId)}>
                            删除订单
                          </button>
                        </div>

                        <div className={styles.orderBody}>
                          <div className={styles.orderBodyLeft}>
                            <button
                              className={styles.orderTitleBtn}
                              type="button"
                              onClick={() => handleOpenDetail(o.orderId)}
                            >
                              <span className={styles.orderTitle}>{o.title || ''}</span>
                            </button>
                            <div className={styles.orderInfoGrid}>
                              <div className={styles.orderInfoCol}>
                                <div className={styles.orderInfoLine}>
                                  <span className={styles.orderInfoLabel}>出发日期：</span>
                                  <span>{o.departureAt || ''}</span>
                                </div>
                                <div className={styles.orderInfoLine}>
                                  <span className={styles.orderInfoLabel}>出行人：</span>
                                  <span>{Array.isArray(o.travelers) ? o.travelers.map((t) => t?.name).filter(Boolean).join('、') : ''}</span>
                                </div>
                              </div>
                              <div className={styles.orderInfoCol}>
                                <div className={styles.orderInfoLine}>{o.arrivalAt || ''}</div>
                                <div className={styles.orderInfoLine}>{o.type || ''}</div>
                              </div>
                            </div>
                          </div>

                          <div className={styles.orderBodyRight}>
                            <div className={styles.orderStatus}>{getStatusLabel(o.status)}</div>
                            <div className={styles.orderPrice}>
                              <span className={styles.currency}>¥</span>
                              <span className={styles.amount}>{Number(o.totalAmount) || 0}</span>
                            </div>
                            {o.status === 'pending_payment' ? (
                              <button className={styles.payBtn} type="button" onClick={() => handlePay(o.orderId)}>
                                去支付
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.footerBar}>
                    <div className={styles.footerLeft}>
                      <div className={styles.checkAll}>
                        <span className={styles.checkbox} aria-hidden />
                        <span>全选</span>
                      </div>
                      <a className={styles.downloadLink} href="#">
                        <span className={styles.downloadIcon} aria-hidden /> 下载
                      </a>
                    </div>

                    <div className={styles.pagination}>
                      <button
                        className={styles.pageBtn}
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        上一页
                      </button>
                      <div className={styles.pageCurrent}>{page}</div>
                      <button
                        className={styles.pageNext}
                        type="button"
                        disabled={!canNextPage}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </section>
          </main>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
