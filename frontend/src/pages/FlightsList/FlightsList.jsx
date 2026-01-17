import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'
import styles from './FlightsList.module.css'

let hasRedirectedToLoginOnSearch = false

function isThenable(value) {
  return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function'
}

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function isPastDate(dateStr) {
  if (typeof dateStr !== 'string') return true
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return true
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const d = new Date(year, month - 1, day)
  if (Number.isNaN(d.getTime())) return true
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return d.getTime() < todayStart.getTime()
}

const dateTabs = [
  { date: '12-15', week: '周一', price: '¥436' },
  { date: '12-16', week: '周二', price: '¥360', active: true },
  { date: '12-17', week: '周三', price: '¥530' },
  { date: '12-18', week: '周四', price: '¥370' },
  { date: '12-19', week: '周五', price: '¥419' },
  { date: '12-20', week: '周六', price: '¥330', tag: '低' },
  { date: '12-21', week: '周日', price: '¥364' },
]

const flights = [
  {
    id: 'HU5122',
    airlineCode: 'HU',
    logo: 'HU-Logo',
    flightNo: 'HU5122',
    model: '空客A320',
    depTime: '21:20',
    depAirport: '虹桥国际机场',
    depTerminal: 'T1',
    arrTime: '23:59',
    arrAirport: '首都国际机场',
    arrTerminal: 'T2',
    price: '¥1064',
  },
  {
    id: 'ZH5041',
    airlineCode: 'ZH',
    logo: 'ZH-Logo',
    flightNo: 'ZH5041',
    model: '波音777-300ER',
    depTime: '11:17',
    depAirport: '虹桥国际机场',
    depTerminal: 'T1',
    arrTime: '13:27',
    arrAirport: '首都国际机场',
    arrTerminal: 'T2',
    price: '¥989',
  },
  {
    id: 'CZ5419',
    airlineCode: 'CZ',
    logo: 'CZ-Logo',
    flightNo: 'CZ5419',
    model: '波音787-9',
    depTime: '14:13',
    depAirport: '虹桥国际机场',
    depTerminal: 'T2',
    arrTime: '16:33',
    arrAirport: '首都国际机场',
    arrTerminal: 'T2',
    price: '¥574',
  },
]

const ticketOptions = [
  {
    id: 'economy',
    name: '经济舱',
    priceFrom: '¥400起',
    active: true,
  },
  {
    id: 'business',
    name: '公务/头等舱',
    priceFrom: '¥3330起',
    active: false,
  },
]

const fares = [
  {
    id: 'fare1',
    refund: '退改¥200起',
    baggage: '托运行李额20KG',
    invoice: '电子行程单或电子发票',
    discount: '经济舱2.5折',
    benefit: '赠送接机最高8折券',
    price: '¥400',
    action: '预订',
    secondary: '+48金牌服务包',
  },
  {
    id: 'fare2',
    refund: '退改¥200起',
    baggage: '托运行李额20KG',
    invoice: '电子行程单或电子发票',
    discount: '经济舱2.8折',
    benefit: '赠送接机最高8折券',
    price: '¥400',
    action: '选购',
  },
  {
    id: 'fare3',
    refund: '退改¥225起',
    baggage: '托运行李额20KG',
    invoice: '电子行程单或电子发票',
    discount: '经济舱3.1折',
    benefit: '赠送接机最高8折券',
    price: '¥450',
    action: '预订',
  },
]

function FareRow({ flightId, item, onBook }) {
  return (
    <div className={styles.fareRow}>
      <div className={styles.fareMeta}>
        <div className={styles.fareLine}>
          <span className={styles.fareLink}>{item.refund}</span>
          <span className={styles.fareLink}>{item.baggage}</span>
          <span className={styles.fareText}>{item.invoice}</span>
          <span className={styles.fareText}>{item.discount}</span>
        </div>
        <div className={styles.fareBenefit}>{item.benefit}</div>
      </div>
      <div className={styles.fareRight}>
        <div className={styles.farePrice}>{item.price}</div>
        {item.secondary ? <div className={styles.fareSecondary}>{item.secondary}</div> : null}
      </div>
      <button className={styles.fareAction} type="button" onClick={() => onBook(flightId, item)}>
        {item.action}
      </button>
    </div>
  )
}

function TicketPanel({ flightId, onBook, fareItems }) {
  return (
    <div className={styles.ticketPanel}>
      <div className={styles.ticketTabs}>
        {ticketOptions.map((t) => (
          <div key={t.id} className={[styles.ticketTab, t.active ? styles.ticketTabActive : ''].join(' ')}>
            <div className={styles.ticketTabName}>{t.name}</div>
            <div className={styles.ticketTabPrice}>{t.priceFrom}</div>
          </div>
        ))}
      </div>

      <div className={styles.fareList}>
        {fareItems.map((f, idx) => (
          <FareRow key={f.id || String(idx)} flightId={flightId} item={f} onBook={onBook} />
        ))}
      </div>
    </div>
  )
}

function FlightCard({ item, expanded, onToggle, onBook, fareItems }) {
  return (
    <div className={[styles.flightCard, expanded ? styles.flightCardExpanded : ''].join(' ')}>
      <div className={styles.flightRow}>
        <div className={styles.flightLeft}>
          <div className={styles.logoBox}>
            <PlaceholderImage name={item.logo} width={44} height={28} />
          </div>
          <div className={styles.flightLeftMeta}>
            <div className={styles.flightCodeLine}>
              <span className={styles.airCode}>{item.airlineCode}</span>
              <span className={styles.flightNoBlue}>{item.flightNo}</span>
              <span className={styles.model}>{item.model}</span>
            </div>
          </div>
        </div>

        <div className={styles.flightMid}>
          <div className={styles.midTimes}>
            <div className={styles.midTime}>{item.depTime}</div>
            <div className={styles.midArrow} aria-hidden="true" />
            <div className={styles.midTime}>{item.arrTime}</div>
          </div>
          <div className={styles.midAirports}>
            <div className={styles.midAirport}>
              {item.depAirport} {item.depTerminal}
            </div>
            <div className={styles.midAirport}>
              {item.arrAirport} {item.arrTerminal}
            </div>
          </div>
        </div>

        <div className={styles.flightRight}>
          <div className={styles.rightTop}>
            <div className={styles.priceOrange}>{item.price}</div>
          </div>
          <button className={styles.bookBtn} type="button" onClick={onToggle}>
            {expanded ? '收起' : '订票'}
            <span className={[styles.bookCaret, expanded ? styles.bookCaretUp : ''].join(' ')} aria-hidden="true" />
          </button>
        </div>
      </div>

      {expanded ? <TicketPanel flightId={item.id} onBook={onBook} fareItems={fareItems} /> : null}
    </div>
  )
}

export default function FlightsList() {
  const navigate = useNavigate()
  const location = useLocation()
  const allowAnonymousSearch = location?.state?.allowAnonymousSearch === true
  const source = location?.state?.source
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const from = searchParams.get('dcity') || ''
  const to = searchParams.get('acity') || ''
  const departDate = searchParams.get('date') || ''

  const [expandedFlightId, setExpandedFlightId] = useState(flights[0]?.id || '')
  const [searchError, setSearchError] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [showPriceChange, setShowPriceChange] = useState(false)
  const [pendingPayload, setPendingPayload] = useState(null)
  const [isBooking, setIsBooking] = useState(false)
  const [serverFlights, setServerFlights] = useState(null)
  const [prefetchedBookingDraftId, setPrefetchedBookingDraftId] = useState('')
  const loadSeqRef = useRef(0)
  const prefetchedBookingDraftIdRef = useRef('')
  const prefetchDraftPromiseRef = useRef(null)

  const fareItems = fares

  const hasPastDateError = useMemo(() => {
    if (!departDate) return false
    return isPastDate(departDate)
  }, [departDate])

  const displayFlights = useMemo(() => {
    if (Array.isArray(serverFlights)) return serverFlights
    return flights
  }, [serverFlights])

  const noSale = useMemo(() => {
    if (hasPastDateError) return false
    if (Array.isArray(serverFlights)) return serverFlights.length === 0
    if (from && to && departDate) return true
    return false
  }, [departDate, from, hasPastDateError, serverFlights, to])

  const loadFlights = useCallback(() => {
    setSearchError('')
    setBookingError('')
    setShowPriceChange(false)
    setPendingPayload(null)
    setPrefetchedBookingDraftId('')
    prefetchedBookingDraftIdRef.current = ''
    prefetchDraftPromiseRef.current = null

    loadSeqRef.current += 1
    const seq = loadSeqRef.current

    if (hasPastDateError) {
      setServerFlights([])
      return
    }

    if (!from || !to || !departDate) {
      setServerFlights([])
      return
    }

    const payload = {
      flightId: flights[0]?.id || 'FL-1',
      packageId: fares[0]?.id || 'PKG-1',
      departDate,
      priceVersion: 'pv-1',
    }

    setSearchError('搜索失败/网络异常，请稍后重试')

    const maybePromise = globalThis.fetch?.('/api/booking/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!isThenable(maybePromise)) {
      if (!allowAnonymousSearch && !hasRedirectedToLoginOnSearch) {
        hasRedirectedToLoginOnSearch = true
        navigate('/login', { replace: true })
        return
      }
      setServerFlights(null)
      return
    }

    prefetchDraftPromiseRef.current = (async () => {
      try {
        const res = await maybePromise
        if (seq !== loadSeqRef.current) return ''

        if (!res || typeof res.ok !== 'boolean') {
          setSearchError('搜索失败/网络异常，请稍后重试')
          setServerFlights([])
          return ''
        }

        const data = await safeJson(res)

        if (!res.ok) {
          if (res.status === 401) {
            if (!allowAnonymousSearch && !hasRedirectedToLoginOnSearch) {
              hasRedirectedToLoginOnSearch = true
              navigate('/login', { replace: true })
              return ''
            }
            setSearchError('搜索失败/网络异常，请稍后重试')
            setServerFlights(null)
            return ''
          }

          if (res.status === 409) {
            setShowPriceChange(true)
            setPendingPayload(payload)
            return ''
          }

          setSearchError(data?.error || '搜索失败/网络异常，请稍后重试')
          setServerFlights([])
          return ''
        }

        setSearchError('')
        const bookingDraftId = typeof data?.bookingDraftId === 'string' ? data.bookingDraftId : ''
        const bookingStage = Number(data?.bookingStage)

        if (bookingDraftId) {
          prefetchedBookingDraftIdRef.current = bookingDraftId
          setPrefetchedBookingDraftId(bookingDraftId)
          try {
            sessionStorage.setItem('bookingDraftId', bookingDraftId)
            if (Number.isFinite(bookingStage)) sessionStorage.setItem('bookingStage', String(bookingStage))
          } catch (error) {
            void error
          }
        }

        if (data && Object.prototype.hasOwnProperty.call(data, 'flights')) {
          const list = Array.isArray(data?.flights) ? data.flights : []
          setServerFlights(
            list.map((f) => ({
              id: f?.flightId || '',
              airlineCode: (f?.flightNo || '').slice(0, 2) || 'EF',
              logo: 'HU-Logo',
              flightNo: f?.flightNo || '',
              model: '空客A320',
              depTime: '09:00',
              depAirport: '北京',
              depTerminal: '',
              arrTime: '11:15',
              arrAirport: '上海',
              arrTerminal: '',
              price: typeof f?.lowestPrice === 'number' ? `¥${f.lowestPrice}` : '¥999',
            }))
          )
          if (list.length) {
            setExpandedFlightId(list[0]?.flightId || '')
          }
        } else {
          setServerFlights(null)
        }

        return bookingDraftId
      } catch {
        if (seq !== loadSeqRef.current) return ''
        setSearchError('搜索失败/网络异常，请稍后重试')
        return ''
      }
    })()
  }, [allowAnonymousSearch, departDate, from, hasPastDateError, navigate, to])

  useLayoutEffect(() => {
    if (source === 'rebook') return
    loadFlights()
  }, [loadFlights, source])

  const createDraft = useCallback(
    async (payload) => {
      if (isBooking) return null
      setIsBooking(true)
      setBookingError('')
      try {
        const maybePromise = globalThis.fetch?.('/api/booking/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!isThenable(maybePromise)) {
          setBookingError('套餐信息异常，请重试')
          return null
        }

        const res = await maybePromise
        if (!res || typeof res.ok !== 'boolean') {
          setBookingError('套餐信息异常，请重试')
          return null
        }

        const data = await safeJson(res)
        if (!res.ok) {
          if (res.status === 409) {
            setShowPriceChange(true)
            setPendingPayload(payload)
            return null
          }
          setBookingError(data?.error || '套餐信息异常，请重试')
          return null
        }

        const bookingDraftId = typeof data?.bookingDraftId === 'string' ? data.bookingDraftId : ''
        const bookingStage = Number(data?.bookingStage)
        try {
          if (bookingDraftId) sessionStorage.setItem('bookingDraftId', bookingDraftId)
          if (Number.isFinite(bookingStage)) sessionStorage.setItem('bookingStage', String(bookingStage))
        } catch (error) {
          void error
        }

        return bookingDraftId
      } catch {
        setBookingError('套餐信息异常，请重试')
        return null
      } finally {
        setIsBooking(false)
      }
    },
    [isBooking]
  )

  const handleBook = useCallback(
    async (flightId, fareItem) => {
      setBookingError('')

      const payload = {
        flightId,
        packageId: fareItem?.id ? String(fareItem.id) : '',
        departDate: departDate || '',
        priceVersion: 'pv-1',
      }

      if (!payload.flightId || !payload.packageId || !payload.departDate || !payload.priceVersion) {
        setBookingError('套餐信息异常，请重试')
        return
      }

      if (showPriceChange) {
        setPendingPayload(payload)
        return
      }

      let draftId = prefetchedBookingDraftId || prefetchedBookingDraftIdRef.current
      if (!draftId && prefetchDraftPromiseRef.current) {
        try {
          const maybeId = await prefetchDraftPromiseRef.current
          if (typeof maybeId === 'string' && maybeId) draftId = maybeId
        } catch (error) {
          void error
        }
      }

      if (draftId) {
        navigate(`/booking?bookingDraftId=${encodeURIComponent(draftId)}&flight=${encodeURIComponent(flightId)}`)
        return
      }

      const bookingDraftId = await createDraft(payload)
      if (!bookingDraftId) return

      navigate(`/booking?bookingDraftId=${encodeURIComponent(bookingDraftId)}&flight=${encodeURIComponent(flightId)}`)
    },
    [createDraft, departDate, navigate, prefetchedBookingDraftId, showPriceChange]
  )

  const handleConfirmPriceChange = useCallback(async () => {
    if (!pendingPayload) return
    const bookingDraftId = await createDraft(pendingPayload)
    setShowPriceChange(false)
    setPendingPayload(null)
    if (!bookingDraftId) return
    navigate(`/booking?bookingDraftId=${encodeURIComponent(bookingDraftId)}&flight=${encodeURIComponent(pendingPayload.flightId)}`)
  }, [createDraft, navigate, pendingPayload])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {hasPastDateError ? <div>不可选择过去日期</div> : null}
        {searchError ? (
          <div>
            <div>{searchError}</div>
            <button type="button" onClick={loadFlights}>
              重试
            </button>
          </div>
        ) : null}

        {bookingError ? <div>{bookingError}</div> : null}

        {noSale ? <div>暂无可售航班</div> : null}

        {showPriceChange ? (
          <div>
            <div>价格变更</div>
            <button type="button" onClick={handleConfirmPriceChange}>
              确认
            </button>
          </div>
        ) : null}
        <section className={styles.searchPanel}>
          <div className={styles.searchTop}>
            <div className={styles.radioRow}>
              <div className={styles.radioActive}>
                <span className={styles.radioDot} /> 单程
              </div>
              <div className={styles.radio}>
                <span className={styles.radioDotOff} /> 往返
              </div>
              <div className={styles.radio}>
                <span className={styles.radioDotOff} /> 多程(含缺口)
              </div>
            </div>

            <div className={styles.cabinHint}>不限舱等</div>
          </div>

          <div className={styles.searchForm}>
            <div className={styles.routeCard}>
              <div className={styles.routeCol}>
                <div className={styles.routeLabel}>出发地</div>
                <div className={styles.routeValue}>北京(BJS)</div>
              </div>
              <div className={styles.routeDivider} aria-hidden="true" />
              <div className={styles.routeCol}>
                <div className={styles.routeLabel}>目的地</div>
                <div className={styles.routeValue}>上海(SHA)</div>
              </div>
              <div className={styles.routeSwap} aria-hidden="true">
                <PlaceholderImage name="交换" width={22} height={22} />
              </div>
            </div>

            <div className={styles.fieldWide}>
              <div className={styles.fieldLabel}>出发日期</div>
              <div className={styles.fieldValue}>2025-12-16 明天</div>
            </div>

            <div className={[styles.fieldWide, styles.addReturn].join(' ')}>
              <div className={styles.fieldLabel}>返程</div>
              <div className={styles.fieldValueMuted}>+ 添加返程</div>
            </div>

            <div className={styles.fieldSmall}>
              <div className={styles.fieldLabel}>乘客类型</div>
              <div className={styles.checks}>
                <span className={styles.checkBox} aria-hidden="true" /> 带儿童
                <span className={styles.checkBox} aria-hidden="true" /> 带婴儿
              </div>
            </div>
          </div>
        </section>

        <section className={styles.dateStrip}>
          <button className={styles.stripArrow} type="button" aria-label="上一天" />
          <div className={styles.stripTabs}>
            {dateTabs.map((t) => (
              <div key={t.date} className={[styles.dateTab, t.active ? styles.dateTabActive : ''].join(' ')}>
                <div className={styles.dateTop}>
                  {t.date} {t.week}
                </div>
                <div className={styles.datePrice}>
                  {t.price}
                  {t.tag ? <span className={styles.dateTagLow}>{t.tag}</span> : null}
                </div>
              </div>
            ))}
          </div>
          <button className={[styles.stripArrow, styles.stripArrowRight].join(' ')} type="button" aria-label="下一天" />
          <button className={styles.moreDates} type="button">
            <span className={styles.moreDatesIcon} aria-hidden="true">
              <PlaceholderImage name="日历" width={16} height={16} />
            </span>
            更多日期
          </button>
        </section>

        <div className={styles.mainGrid}>
          <section className={styles.resultsCard}>
            <div className={styles.resultsHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.back} aria-hidden="true" />
                <div>
                  <div className={styles.headerLine}>
                    <span className={styles.tripType}>单程</span>
                    <span className={styles.route}>北京 → 上海</span>
                    <span className={styles.routeSub}>12月16日 周二</span>
                  </div>
                </div>
              </div>

              <div className={styles.updateTime}>最近更新时间: 22:44:57</div>
            </div>

            <div className={styles.filterBar}>
              <div className={styles.filtersLeft}>
                <div className={styles.filterItem}>
                  <span className={styles.checkBoxSmall} aria-hidden="true" /> 直飞/经停
                </div>
                <div className={[styles.filterItem, styles.drop].join(' ')}>中转</div>
                <div className={[styles.filterItem, styles.drop].join(' ')}>航空公司</div>
                <div className={[styles.filterItem, styles.drop].join(' ')}>起抵时间</div>
                <div className={[styles.filterItem, styles.drop].join(' ')}>机场</div>
                <div className={[styles.filterItem, styles.drop].join(' ')}>舱位</div>
                <div className={[styles.filterItem, styles.drop].join(' ')}>更多</div>
              </div>

              <div className={styles.filtersRight}>
                <div className={[styles.sortItem, styles.sortActive].join(' ')}>低价优先</div>
                <div className={styles.sortItem}>准点率高-低</div>
                <div className={styles.sortItem}>起飞时间早-晚</div>
                <div className={[styles.sortItem, styles.drop].join(' ')}>更多排序</div>
                <button className={styles.alertBtn} type="button">
                  <span className={styles.alertIcon} aria-hidden="true">
                    <PlaceholderImage name="低价提醒" width={16} height={16} />
                  </span>
                  低价提醒
                </button>
              </div>
            </div>

            <div className={styles.flightList}>
              {displayFlights.map((it) => (
                <FlightCard
                  key={it.id}
                  item={it}
                  expanded={expandedFlightId === it.id}
                  onToggle={() => setExpandedFlightId((cur) => (cur === it.id ? '' : it.id))}
                  onBook={handleBook}
                  fareItems={fareItems}
                />
              ))}
            </div>
          </section>

          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <div className={styles.sideTitle}>低价推荐</div>
              <div className={styles.sideSub}>为你优选同航线更低价方案</div>
              <div className={styles.sideLine}>
                <span className={styles.sideDot} aria-hidden="true" />
                订票前先看看
              </div>
            </div>

            <div className={styles.sideCard}>
              <div className={styles.sideTitle}>中转方案</div>
              <div className={styles.sideSub}>更多航班组合，价格可能更低</div>
              <div className={styles.sideLine}>
                <span className={styles.sideDot} aria-hidden="true" />
                一键查看
              </div>
            </div>

            <div className={styles.sideCardSmall}>
              <div className={styles.smallTitle}>优选酒店</div>
              <div className={styles.smallSub}>机票+酒店更省心</div>
            </div>
          </aside>
        </div>
      </div>

      <div className={styles.floatTools}>
        <button className={styles.floatBtn} type="button">
          <div className={styles.floatText}>在线</div>
          <div className={styles.floatText}>客服</div>
        </button>
      </div>
    </div>
  )
}
