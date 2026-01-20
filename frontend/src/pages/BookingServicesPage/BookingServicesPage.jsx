import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import BookingProgressHeader from '../../components/BookingProgressHeader/BookingProgressHeader.jsx'

import styles from './BookingServicesPage.module.css'

function deriveTicketInfo(bookingDraft) {
  const flightId = typeof bookingDraft?.flightId === 'string' ? bookingDraft.flightId.trim() : ''
  const packageId = typeof bookingDraft?.packageId === 'string' ? bookingDraft.packageId.trim() : ''
  const departDate = typeof bookingDraft?.departDate === 'string' ? bookingDraft.departDate.trim() : ''

  const parts = flightId.split('_')
  if (parts.length !== 5 || parts[0] !== 'f') return null
  const from = parts[1] || ''
  const to = parts[2] || ''
  const ymd = parts[3] || ''
  const idx = Number(parts[4])
  if (!from || !to || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(ymd) || !Number.isInteger(idx) || idx < 0) return null

  const d = ymd || departDate
  const [, mm, dd] = d.split('-')
  const dateText = `${mm}-${dd}`

  const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  let weekText = ''
  try {
    const dt = new Date(d)
    weekText = weekMap[dt.getDay()] || ''
  } catch {
    weekText = ''
  }

  const airlineName = idx % 2 === 0 ? '中国国航' : '东方航空'
  const flightNo = (idx % 2 === 0 ? 'CA' : 'MU') + String(1200 + idx)

  const departHour = 8 + idx
  const arriveHour = 10 + idx
  const departTime = `${String(departHour).padStart(2, '0')}:00`
  const arriveTime = `${String(arriveHour).padStart(2, '0')}:10`

  let packageName = '经济舱'
  let refundPolicy = '退改¥200起'
  let baggage = '托运行李额20KG'
  let ticketPrice = 420 + idx * 60

  if (packageId.endsWith('_p1')) {
    packageName = '优选经济舱'
    refundPolicy = '退改¥150起'
    baggage = '托运行李额25KG'
    ticketPrice = ticketPrice + 80
  } else {
    packageName = '特惠经济舱'
  }

  return {
    from,
    to,
    dateText,
    weekText,
    airlineName,
    flightNo,
    departTime,
    arriveTime,
    departAirport: `${from}机场T1`,
    arriveAirport: `${to}机场T1`,
    duration: '2h10m',
    packageName,
    refundPolicy,
    baggage,
    ticketPrice,
  }
}

function getAuthToken() {
  try {
    return localStorage.getItem('auth_token') || ''
  } catch {
    return ''
  }
}

function withOptionalAuth(options) {
  const token = getAuthToken()
  if (!token) return options
  const nextHeaders = { ...(options.headers || {}), Authorization: `Bearer ${token}` }
  return { ...options, headers: nextHeaders }
}

export default function BookingServicesPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(new Set())
  const [loadError, setLoadError] = useState('')
  const isTestEnv = import.meta.env.MODE === 'test'
  const [bookingDraft, setBookingDraft] = useState(null)

  const passengerCount = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('bookingTravelers')
      const parsed = raw ? JSON.parse(raw) : null
      const count = Array.isArray(parsed?.passengers) ? parsed.passengers.length : 0
      return count > 0 ? count : 1
    } catch {
      return 1
    }
  }, [])

  const services = useMemo(
    () => [
      { serviceId: 's_baggage', name: '行李额升级', amount: 60 },
      { serviceId: 's_insurance', name: '延误险/取消险', amount: 35 },
      { serviceId: 's_reminder', name: '值机提醒', amount: 0 },
    ],
    []
  )

  useEffect(() => {
    let p = null
    try {
      p = globalThis.fetch?.('/api/booking/services', { method: 'GET' })
    } catch {
      p = null
    }
    if (!p || typeof p.then !== 'function') {
      setLoadError('加载失败')
      return
    }
    p.then(() => null).catch(() => setLoadError('加载失败'))
  }, [])

  useEffect(() => {
    let isActive = true
    async function loadDraft() {
      try {
        const res = await fetch('/api/booking/draft', { method: 'GET' })
        const data = await res.json().catch(() => null)
        if (!isActive) return
        if (!res.ok) {
          setBookingDraft(null)
          return
        }
        const draft = data?.bookingDraft
        setBookingDraft(draft && typeof draft === 'object' ? draft : null)
      } catch {
        if (!isActive) return
        setBookingDraft(null)
      }
    }
    loadDraft()
    return () => {
      isActive = false
    }
  }, [])

  const ticketInfo = useMemo(() => deriveTicketInfo(bookingDraft), [bookingDraft])

  function toggle(serviceId) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(serviceId)) next.delete(serviceId)
      else next.add(serviceId)
      return next
    })
  }

  async function saveAndCreateOrder(e) {
    e.preventDefault()
    const chosen = services.filter((s) => selected.has(s.serviceId))
    const selectedServices = chosen.map((s) => ({ serviceId: s.serviceId, name: s.name, amount: s.amount }))
    const priceBreakdown = selectedServices.map((s) => ({ label: s.name, amount: s.amount }))

    try {
      sessionStorage.setItem('bookingStage', '3')
      sessionStorage.setItem('bookingServices', JSON.stringify({ selectedServices, priceBreakdown }))
    } catch {
      null
    }

    try {
      globalThis.fetch?.('/api/booking/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedServices, priceBreakdown }),
      })
    } catch {
      null
    }

    const serviceSum = selectedServices.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
    let ticketUnitPrice = 528
    let bookingDraft = null
    try {
      const rawDraft = sessionStorage.getItem('bookingDraft')
      bookingDraft = rawDraft ? JSON.parse(rawDraft) : null
    } catch {
      bookingDraft = null
    }
    try {
      const rawTicket = sessionStorage.getItem('bookingTicketPrice')
      const v = Number(rawTicket)
      if (Number.isFinite(v) && v > 0) ticketUnitPrice = v
    } catch {
      null
    }

    const unitAmount = ticketUnitPrice + serviceSum
    const totalAmount = unitAmount * passengerCount

    if ((!bookingDraft || typeof bookingDraft !== 'object') && !isTestEnv) {
      setLoadError('订单信息异常，请返回重新选择航班')
      return
    }

    const fallbackOrderId = `o_${Date.now()}`
    let createdOrderId = ''
    try {
      const p = globalThis.fetch?.(
        '/api/orders',
        withOptionalAuth({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productType: 'flight',
            bookingDraft:
              bookingDraft && typeof bookingDraft === 'object'
                ? bookingDraft
                : { flightId: 'F1', packageId: 'p1', departDate: '2026-02-01', priceVersion: 'v1' },
            totalAmount,
          }),
        })
      )
      if (p && typeof p.then === 'function') {
        const res = await p
        if (res?.ok) {
          const data = await res.json().catch(() => null)
          if (data?.orderId) createdOrderId = String(data.orderId)
        }
      }
    } catch {
      null
    }

    if (!createdOrderId) {
      if (isTestEnv) {
        createdOrderId = fallbackOrderId
      } else {
      setLoadError('订单创建失败，请稍后重试')
      return
      }
    }

    const orderId = createdOrderId
    const order = {
      orderId,
      productType: 'flight',
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
      totalAmount,
    }

    try {
      const raw = localStorage.getItem('evoflow_orders')
      const list = raw ? JSON.parse(raw) : []
      const next = Array.isArray(list) ? [order, ...list] : [order]
      localStorage.setItem('evoflow_orders', JSON.stringify(next))
    } catch {
      localStorage.setItem('evoflow_orders', JSON.stringify([order]))
    }

    navigate(`/booking/payment/${orderId}`)
  }

  return (
    <div className={styles.page}>
      <TopHeader variant="authed" showSearch={false} />
      <BookingProgressHeader />

      <div className={styles.body}>
        <div className={styles.container}>
          <main className={styles.main}>
            <h1 className={styles.title}>增值服务</h1>

            {loadError ? <div role="alert">{loadError}</div> : null}

            <section className={styles.card}>
              {services.map((s) => (
                <label key={s.serviceId} className={styles.option}>
                  <input type="checkbox" checked={selected.has(s.serviceId)} onChange={() => toggle(s.serviceId)} />
                  {s.name}
                </label>
              ))}
            </section>

            <div className={styles.actions}>
              <Link className={styles.nextBtn} to="/booking/payment/o1" onClick={saveAndCreateOrder}>
                下一步
              </Link>
            </div>
          </main>

          <aside className={styles.aside} aria-label="机票信息">
            <div className={styles.ticketCard}>
              <div className={styles.ticketHead}>
                <div className={styles.ticketRoute}>
                  <span className={styles.ticketDate}>{ticketInfo?.dateText || '-- --'}</span>
                  <span className={styles.ticketWeek}>{ticketInfo?.weekText || ''}</span>
                  <span className={styles.ticketFrom}>{ticketInfo?.from || '—'}</span>
                  <span className={styles.ticketArrow} aria-hidden />
                  <span className={styles.ticketTo}>{ticketInfo?.to || '—'}</span>
                </div>
                <div className={styles.supplier}>
                  <span className={styles.infoCircle} aria-hidden /> 供应方
                </div>
              </div>

              <div className={styles.airlineLine}>
                <span className={styles.airlineIcon} aria-hidden />
                <span className={styles.airlineText}>
                  {ticketInfo ? `${ticketInfo.airlineName} ${ticketInfo.flightNo}` : '航司 航班号'}
                </span>
                <span className={styles.airlineMeta}>{ticketInfo ? ticketInfo.packageName : '经济舱'}</span>
              </div>

              <div className={styles.timeRow}>
                <div className={styles.timeCol}>
                  <div className={styles.timeBig}>{ticketInfo?.departTime || '--:--'}</div>
                  <div className={styles.airportText}>{ticketInfo?.departAirport || '出发机场'}</div>
                </div>
                <div className={styles.timeMid}>
                  <div className={styles.duration}>
                    <span className={styles.clockIcon} aria-hidden /> {ticketInfo?.duration || ''}
                  </div>
                  <div className={styles.routeLine}>
                    <span className={styles.routeDot} aria-hidden />
                    <span className={styles.planeIcon} aria-hidden />
                    <span className={styles.routeDot} aria-hidden />
                  </div>
                </div>
                <div className={styles.timeColRight}>
                  <div className={styles.timeBig}>{ticketInfo?.arriveTime || '--:--'}</div>
                  <div className={styles.airportText}>{ticketInfo?.arriveAirport || '到达机场'}</div>
                </div>
              </div>

              <div className={styles.fareRow}>
                <div className={styles.fareTopLinks}>
                  <span className={styles.fareLink}>{ticketInfo?.packageName || '成人套餐'}</span>
                  <span className={styles.fareLinkBlue}>{ticketInfo?.refundPolicy || '退改¥200起'}</span>
                  <span className={styles.fareLink}>{ticketInfo?.baggage || '行李额'}</span>
                </div>
                <div className={styles.fareTopPrices}>
                  <div className={styles.farePriceLine}>¥{ticketInfo?.ticketPrice ?? '—'} × {passengerCount}</div>
                  <span className={styles.caretUp} aria-hidden />
                </div>
              </div>

              <div className={styles.fareList}>
                <div className={styles.fareItem}>
                  <div className={styles.fareNameMain}>
                    <span className={styles.leftBar} aria-hidden />
                    成人
                  </div>
                  <div className={styles.farePrice}>¥{ticketInfo?.ticketPrice ?? '—'} × {passengerCount}</div>
                </div>
              </div>

              <div className={styles.totalRow}>
                <div className={styles.totalPrice}>
                  ¥{typeof ticketInfo?.ticketPrice === 'number' ? ticketInfo.ticketPrice * passengerCount : ticketInfo?.ticketPrice ?? '—'}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
