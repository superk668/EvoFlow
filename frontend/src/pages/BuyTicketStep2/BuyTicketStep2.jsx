import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import styles from './BuyTicketStep2.module.css'
import { useAuth } from '../../auth/AuthContext.jsx'

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function formatMmDdWeek(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}-${dd}  ${weekdays[d.getDay()]}`
}

function parseTimeToMinutes(t) {
  const [h, m] = t.split(':').map((v) => Number(v))
  return h * 60 + m
}

function formatDuration(dep, arr) {
  const d0 = parseTimeToMinutes(dep)
  const d1 = parseTimeToMinutes(arr)
  const delta = ((d1 - d0) % 1440 + 1440) % 1440
  const hh = Math.floor(delta / 60)
  const mm = delta % 60
  return `${hh}h${String(mm).padStart(2, '0')}m`
}

function maskPhone(phone) {
  const p = String(phone ?? '').replace(/\s+/g, '')
  if (p.length < 7) return p
  return `${p.slice(0, 3)}****${p.slice(-4)}`
}

function maskId(idNumber) {
  const s = String(idNumber ?? '').replace(/\s+/g, '')
  if (s.length < 5) return s
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

function readSession(key) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    void 0
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
  localStorage.setItem('evoflow_orders', JSON.stringify(next))
}

function findLatestPendingPaymentOrderId() {
  const orders = readOrders()
  const list = orders
    .map((o) => {
      if (!o || typeof o !== 'object') return null
      const orderId = String(o.orderId ?? o.id ?? '').trim()
      const status = String(o.status ?? '').trim()
      const createdAt = Date.parse(String(o.createdAt ?? ''))
      if (!orderId || status !== 'pending_payment') return null
      return { orderId, createdAt: Number.isFinite(createdAt) ? createdAt : 0 }
    })
    .filter(Boolean)
  list.sort((a, b) => b.createdAt - a.createdAt)
  return list[0]?.orderId || ''
}

async function tryFetchLatestPendingPaymentOrderId(authToken) {
  try {
    const resp = await fetch('/api/orders?tab=pending_payment&productType=flight&page=1&pageSize=10', {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    })
    if (!resp.ok) return ''
    const data = await resp.json()
    const list = Array.isArray(data?.orders) ? data.orders : []
    const first = list.find((o) => o && typeof o === 'object')
    const orderId = String(first?.orderId ?? first?.id ?? '').trim()
    return orderId
  } catch {
    return ''
  }
}

function toDepartAtIso(isoDate) {
  const s = String(isoDate ?? '').trim()
  if (!s) return ''
  const d = new Date(`${s}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString()
}

export default function BuyTicketStep2() {
  const { auth } = useAuth()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [serviceToast, setServiceToast] = useState('')
  const [servicesError, setServicesError] = useState('')
  const [payError, setPayError] = useState('')
  const [isPaying, setIsPaying] = useState(false)

  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)
  const from = searchParams.get('from') || '上海(SHA)'
  const to = searchParams.get('to') || '北京(BJS)'
  const flightNo = searchParams.get('flight') || 'KN5987'
  const airline = searchParams.get('airline') || '中国联合航空'
  const cabin = searchParams.get('cabin') || '经济舱'
  const depTime = searchParams.get('depTime') || '20:50'
  const arrTime = searchParams.get('arrTime') || '22:55'
  const depAirport = searchParams.get('depAirport') || '大兴国际机场'
  const arrAirport = searchParams.get('arrAirport') || '浦东国际机场T1'
  const total = searchParams.get('total') || '528'

  const routeTitle = useMemo(() => {
    const f = from.split('(')[0]
    const t = to.split('(')[0]
    return `${formatMmDdWeek(date)}  ${f}  →  ${t}`
  }, [date, from, to])

  const duration = useMemo(() => formatDuration(depTime, arrTime), [depTime, arrTime])

  const draft = useMemo(() => readBookingDraft(), [])

  const passengerName = draft?.passenger?.name ?? ''
  const passengerIdType = draft?.passenger?.idType ?? ''
  const passengerIdNumber = draft?.passenger?.idNumber ?? ''
  const contactPhone = draft?.contact?.phoneNumber ?? ''

  const draftValid = Boolean(passengerName && passengerIdType && passengerIdNumber && contactPhone)

  useEffect(() => {
    let alive = true
    fetch('/api/services/flight')
      .then((resp) => {
        if (!alive) return
        if (resp.ok) return
        if (resp.status === 404) return
        setServicesError('加载失败')
      })
      .catch(() => {
        if (!alive) return
        setServicesError('加载失败')
      })
    return () => {
      alive = false
    }
  }, [])

  async function handlePickService() {
    setServiceToast('')
    try {
      const resp = await fetch('/api/services/flight/select', { method: 'POST' })
      if (resp.status === 503) {
        setServiceToast('服务暂不可用')
      }
    } catch {
      setServiceToast('服务暂不可用')
    }
  }

  async function goPay() {
    if (!draftValid) return
    setPayError('')
    setIsPaying(true)
    try {
      const fromCity = String(from).split('(')[0].trim()
      const toCity = String(to).split('(')[0].trim()
      const totalAmount = Number.parseFloat(String(total))
      const draftForCreate = {
        ...draft,
        route: fromCity && toCity ? { fromCity, toCity } : undefined,
        airline: String(airline || '').trim() || undefined,
        cabin: String(cabin || '').trim() || undefined,
        depTime: String(depTime || '').trim() || undefined,
        arrTime: String(arrTime || '').trim() || undefined,
        depAirport: String(depAirport || '').trim() || undefined,
        arrAirport: String(arrAirport || '').trim() || undefined,
        totalAmount: Number.isFinite(totalAmount) ? totalAmount : undefined,
        priceItems: Number.isFinite(totalAmount) ? [{ name: '机票', unitPrice: totalAmount, quantity: 1 }] : undefined,
      }

      const resp = await fetch('/api/orders/flight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        body: JSON.stringify({ draft: draftForCreate }),
      })
      if (resp.status === 401) {
        const redirectTo = location.pathname + location.search
        writeSession('postLoginRedirect', redirectTo)
        navigate('/login', { state: { from: redirectTo } })
        return
      }
      if (resp.status === 409) {
        let existing = String(readSession('createdOrderId') || '').trim()
        if (!existing) existing = String(findLatestPendingPaymentOrderId() || '').trim()
        if (!existing) existing = String(await tryFetchLatestPendingPaymentOrderId(auth?.token)).trim()

        if (existing) {
          const qp = new URLSearchParams(searchParams)
          qp.set('orderId', existing)
          const search = qp.toString()
          navigate({ pathname: '/buy-ticket/step3', search: search ? `?${search}` : '' })
          return
        }
        navigate('/user-center/orders')
        return
      }
      if (resp.status === 400 || resp.status === 422) {
        setPayError('订单信息异常，请返回重新填写')
        return
      }
      if (!resp.ok) {
        setPayError('下单失败，请稍后重试')
        return
      }
      const data = await resp.json()

      const orderId = data.orderId
      const status = data.status
      const expiresAt = data.expiresAt
      const nowIso = new Date().toISOString()
      const amount = Number.parseFloat(String(total))
      const totalAmountValue = amount
      const departAt = toDepartAtIso(draft?.departDate ?? date)
      const nextOrder = {
        id: orderId,
        orderId,
        productType: 'flight',
        status,
        createdAt: nowIso,
        updatedAt: nowIso,
        expiresAt,
        amount: Number.isFinite(amount) ? amount : 0,
        departAt,
        totalAmount: Number.isFinite(totalAmountValue) ? totalAmountValue : 0,
        details: {
          flightId: draftForCreate.flightId,
          airline: draftForCreate.airline,
          cabin: draftForCreate.cabin,
          departDate: draftForCreate.departDate,
          depTime: draftForCreate.depTime,
          arrTime: draftForCreate.arrTime,
          depAirport: draftForCreate.depAirport,
          arrAirport: draftForCreate.arrAirport,
          route: draftForCreate.route || null,
          passenger: { name: passengerName, idType: passengerIdType, idNumberMasked: maskId(passengerIdNumber) },
          contact: { phoneNumber: maskPhone(contactPhone), phoneNumberMasked: maskPhone(contactPhone) },
          priceItems: Array.isArray(draftForCreate.priceItems) ? draftForCreate.priceItems : [],
        },
      }

      const orders = readOrders()
      const without = orders.filter((o) => o?.id !== orderId)
      writeOrders([...without, nextOrder])
      writeSession('createdOrderId', String(orderId))

      const qp = new URLSearchParams(searchParams)
      qp.set('orderId', String(orderId))
      const search = qp.toString()
      navigate({ pathname: '/buy-ticket/step3', search: search ? `?${search}` : '' })
    } catch {
      setPayError('网络异常，请稍后重试')
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.stepsBar}>
          <div className={styles.steps}>
            <div className={styles.stepDone}>
              <span className={styles.stepDotDone} aria-hidden="true" />
              乘机信息
            </div>
            <div className={styles.stepActive}>
              <span className={styles.stepDotActive} aria-hidden="true" />
              增值服务
            </div>
            <div className={styles.step}>
              <span className={styles.stepDot} aria-hidden="true" />
              支付
            </div>
            <div className={styles.step}>
              <span className={styles.stepDot} aria-hidden="true" />
              完成
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.left}>
            <div className={styles.noticeRow}>
              <div className={styles.noticeIcon} aria-hidden="true" />
              <div className={styles.noticeText}>15分钟内完成支付，即可拥有机票。</div>
            </div>

            <div className={styles.profileCard}>
              <div className={styles.profileLeft}>
                <div className={styles.profileNo}>1</div>
                <div className={styles.profileType}>成人</div>
                <div className={styles.profileName}>{passengerName}</div>
                <div className={styles.profileIdLabel}>{passengerIdType}</div>
                <div className={styles.profileIdValue}>{maskId(passengerIdNumber)}</div>
              </div>
              <div className={styles.profileSep} aria-hidden="true" />
              <div className={styles.profileRight}>
                <div className={styles.avatar} aria-hidden="true" />
                <div className={styles.contactTag}>联系人</div>
                <div className={styles.contactValue}>{maskPhone(contactPhone)}</div>
              </div>
              <Link className={styles.backModify} to={{ pathname: '/buy-ticket/step1', search: location.search }}>
                返回修改
              </Link>
            </div>

            {!draftValid ? <div>订单信息异常，请返回重新填写</div> : null}
            {servicesError ? <div>{servicesError}</div> : null}
            {serviceToast ? <div>{serviceToast}</div> : null}
            {payError ? <div>{payError}</div> : null}

            <div className={styles.serviceCard}>
              <div className={styles.serviceSide}>
                <div className={styles.serviceTitle}>为行程添加保障</div>
                <div className={styles.serviceSub}>出行有保险，家人更放心</div>
                <div className={styles.serviceArt} aria-hidden="true" />
              </div>

              <div className={styles.serviceList}>
                <div className={styles.serviceItemActive}>
                  <div className={styles.serviceHead}>
                    <span className={styles.badgeGreen}>更划算</span>
                    <div className={styles.serviceName}>航意航延组合险</div>
                    <div className={styles.serviceMeta}>(2025A)</div>
                    <div className={styles.serviceLink}>投保须知</div>
                    <div className={styles.servicePriceWrap}>
                      <div className={styles.serviceDesc}>意外最高350万+延…</div>
                      <div className={styles.servicePrice}>¥40/人</div>
                      <div className={styles.caretDown} aria-hidden="true" />
                    </div>
                    <button type="button" className={styles.addBtnActive} onClick={handlePickService}>
                      添加保障
                      <span className={styles.addCircle} aria-hidden="true" />
                    </button>
                  </div>

                  <div className={styles.serviceBullets}>
                    <div className={styles.bullet}>
                      <span className={styles.checkIcon} aria-hidden="true" />
                      意外保障最高¥350万
                    </div>
                    <div className={styles.bullet}>
                      <span className={styles.checkIcon} aria-hidden="true" />
                      延误最高可赔¥300
                    </div>
                    <div className={styles.bullet}>
                      <span className={styles.checkIcon} aria-hidden="true" />
                      返航、备降赔¥100
                    </div>
                  </div>
                </div>

                <div className={styles.serviceItem}>
                  <div className={styles.serviceRow}>
                    <div className={styles.serviceRowTitle}>航空意外险</div>
                    <div className={styles.serviceRowLink}>投保须知</div>
                    <div className={styles.serviceRowLabel}>标准保障</div>
                    <div className={styles.serviceRowPrice}>¥39/人</div>
                    <div className={styles.caretDownSmall} aria-hidden="true" />
                    <button type="button" className={styles.addBtn} onClick={handlePickService}>
                      添加保障
                      <span className={styles.addCircle} aria-hidden="true" />
                    </button>
                  </div>
                  <div className={styles.serviceRowDesc}>航空意外保障最高¥500万，含意外医疗、行李损失等保障</div>
                </div>

                <div className={styles.serviceItem}>
                  <div className={styles.serviceRow}>
                    <div className={styles.serviceRowTitle}>国内旅行险</div>
                    <div className={styles.serviceRowLink}>投保须知</div>
                    <div className={styles.serviceRowLabel}>保2天</div>
                    <div className={styles.serviceRowPrice}>¥75/人</div>
                    <div className={styles.caretDownSmall} aria-hidden="true" />
                    <button type="button" className={styles.addBtn} onClick={handlePickService}>
                      添加保障
                      <span className={styles.addCircle} aria-hidden="true" />
                    </button>
                  </div>
                  <div className={styles.serviceRowDesc}>航意最高保¥180万，延误最高赔2张¥400机票券</div>
                </div>

                <div className={styles.serviceFoot}>
                  <span className={styles.infoDot} aria-hidden="true" />
                  本模块为投保页页面，由携程保险代理有限公司管理并运营。请仔细阅读投保须知等内容，并知
                  晓承保保险公司和产品条款内容。如您同意请点击下一步，为确保您的投保权益，您的投保信息
                  将被记录。
                </div>

                <label className={styles.noNeed}>
                  <span className={styles.noNeedBox} aria-hidden="true" />
                  我不需要额外保障
                </label>
              </div>
            </div>

            <div className={styles.payCard}>
              <div className={styles.paySection}>
                <div className={styles.payTitle}>
                  可享优惠 <span className={styles.giftTiny}>礼</span>
                </div>
                <label className={styles.payCheckRow}>
                  <span className={styles.payBox} aria-hidden="true" />
                  使用优惠券
                </label>
              </div>

              <div className={styles.paySection}>
                <div className={styles.payTitle}>报销凭证</div>
                <div className={styles.payText}>
                  支付完成后可开具（乘机日期在2025年9月30日以后的中国内地机票将不再提供纸质行程单。
                  电子行程单需在所有行程结束后180天内申请（承运航司另有规定的除外）。详见国家税务总局、
                  财政部、中国民用航空局公告2024年第9号公告）
                </div>
              </div>

              <div className={styles.paySection}>
                <div className={styles.payTitle}>预订须知</div>
                <label className={styles.payAgreeRow}>
                  <span className={styles.payBoxChecked} aria-hidden="true" />
                  我已阅读并同意
                  <span className={styles.payLink}>购票须知</span>、
                  <span className={styles.payLink}>机票产品预订须知</span>
                </label>
              </div>

              <button type="button" className={styles.payBtn} onClick={goPay} disabled={!draftValid || isPaying}>
                去支付
              </button>
            </div>
          </div>

          <aside className={styles.right}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryTop}>
                <div className={styles.summaryTitle}>{routeTitle}</div>
                <div className={styles.summaryProvider}>
                  <span className={styles.providerIcon} aria-hidden="true" />
                  供应方
                </div>
              </div>

              <div className={styles.summaryFlight}>
                <div className={styles.summaryFlightRow}>
                  <span className={styles.flightIcon} aria-hidden="true" />
                  {airline} {flightNo}
                  <span className={styles.flightSep} aria-hidden="true" />
                  {cabin}
                </div>

                <div className={styles.summaryTimes}>
                  <div className={styles.summaryTimeCol}>
                    <div className={styles.summaryTime}>{depTime}</div>
                    <div className={styles.summaryAirport}>{depAirport}</div>
                  </div>
                  <div className={styles.summaryMid}>
                    <div className={styles.summaryDur}>
                      <span className={styles.clockIcon} aria-hidden="true" />
                      {duration}
                    </div>
                    <div className={styles.summaryLine} aria-hidden="true" />
                    <div className={styles.planeIcon} aria-hidden="true" />
                  </div>
                  <div className={styles.summaryTimeCol}>
                    <div className={styles.summaryTime}>{arrTime}</div>
                    <div className={styles.summaryAirport}>{arrAirport}</div>
                  </div>
                </div>
              </div>

              <div className={styles.fareBlock}>
                <div className={styles.fareHead}>
                  <div className={styles.fareName}>成人套餐</div>
                  <div className={styles.fareLinks}>
                    <span className={styles.fareLink}>退改¥205起</span>
                    <span className={styles.fareLink}>行李额</span>
                  </div>
                  <div className={styles.fareTopPrice}>¥458 × 1</div>
                  <div className={styles.fareCaret} aria-hidden="true" />
                </div>

                <div className={styles.fareRows}>
                  <div className={styles.fareRow}>
                    <div className={styles.fareItem}>成人</div>
                    <div className={styles.farePrice}>¥410 × 1</div>
                  </div>
                  <div className={styles.fareRow}>
                    <div className={styles.fareItem}>金牌服务包</div>
                    <div className={styles.farePrice}>¥48 × 1</div>
                  </div>
                  <div className={styles.fareRow}>
                    <div className={styles.fareItem}>机建</div>
                    <div className={styles.farePrice}>¥50 × 1</div>
                  </div>
                  <div className={styles.fareRow}>
                    <div className={styles.fareItem}>燃油税</div>
                    <div className={styles.farePrice}>¥20 × 1</div>
                  </div>
                </div>
              </div>

              <div className={styles.giftBlock}>
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

              <div className={styles.totalRow}>
                <div className={styles.totalPrice}>¥{total}</div>
              </div>
            </div>
          </aside>
        </div>

        <div className={styles.csFloat}>
          在线
          <br />
          客服
        </div>
      </div>
    </div>
  )
}
