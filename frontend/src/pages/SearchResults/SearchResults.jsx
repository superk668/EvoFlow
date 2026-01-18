import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './SearchResults.module.css'
import { useAuth } from '../../auth/AuthContext.jsx'
import { createBookingDraft, loadMockFlights } from '../../booking/storage.js'

function formatIsoLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function todayIso() {
  const now = new Date()
  return formatIsoLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
}

function tomorrowIso() {
  const now = new Date()
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return formatIsoLocal(t)
}

const fallbackSearch = {
  from: '上海(SHA)',
  to: '北京(BJS)',
  departDate: tomorrowIso(),
}

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const cityCodeMap = {
  上海: 'SHA',
  北京: 'BJS',
  成都: 'CTU',
  大连: 'DLC',
  广州: 'CAN',
  福州: 'FOC',
  三亚: 'SYX',
  深圳: 'SZX',
  哈尔滨: 'HRB',
  昆明: 'KMG',
  拉萨: 'LXA',
  海口: 'HAK',
  重庆: 'CKG',
  杭州: 'HGH',
  武汉: 'WUH',
  西安: 'SIA',
  沈阳: 'SHE',
  长春: 'CGQ',
  乌鲁木齐: 'URC',
  厦门: 'XMN',
  南京: 'NKG',
  长沙: 'CSX',
  郑州: 'CGO',
  青岛: 'TAO',
  香港: 'HKG',
  澳门: 'MFM',
  台北: 'TPE',
}

const cityPickerTabs = [
  { key: 'hot', label: '热门' },
  { key: 'abcdef', label: 'ABCDEF' },
  { key: 'ghij', label: 'GHIJ' },
  { key: 'klmn', label: 'KLMN' },
  { key: 'pqrstuvw', label: 'PQRSTUVWXYZ' },
  { key: 'xyz', label: 'XYZ' },
]

const domesticCityGroups = {
  hot: [
    '上海',
    '北京',
    '成都',
    '广州',
    '三亚',
    '深圳',
    '哈尔滨',
    '昆明',
    '海口',
    '重庆',
    '杭州',
    '西安',
    '沈阳',
    '长春',
    '乌鲁木齐',
    '厦门',
    '南京',
    '长沙',
    '郑州',
    '青岛',
  ],
  abcdef: ['北京', '成都', '大连', '福州'],
  ghij: ['广州', '哈尔滨', '海口'],
  klmn: ['昆明', '拉萨', '南京'],
  pqrstuvw: ['青岛', '三亚', '上海', '深圳', '乌鲁木齐', '武汉'],
  xyz: ['西安', '厦门', '郑州'],
}

const hkmoTwCities = {
  hot: ['香港', '澳门', '台北'],
  abcdef: ['澳门'],
  ghij: ['香港'],
  klmn: [],
  pqrstuvw: ['台北'],
  xyz: [],
}

function dateHintLabel(isoDate) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const todayIso = formatIsoLocal(today)
  const tomorrowIso = formatIsoLocal(tomorrow)
  if (isoDate === tomorrowIso) return '明天'
  if (isoDate === todayIso) return '今天'
  const d = new Date(`${isoDate}T00:00:00`)
  return weekdays[d.getDay()]
}

function addDays(isoDate, delta) {
  const d = new Date(`${isoDate}T00:00:00`)
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function formatMmDd(isoDate) {
  return isoDate.slice(5)
}

function formatCnDateTitle(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}月${dd}日 ${weekdays[d.getDay()]}`
}

function parseTimeToMinutes(t) {
  const [h, m] = t.split(':').map((v) => Number(v))
  return h * 60 + m
}

function minutesToTime(m) {
  const mm = ((m % 1440) + 1440) % 1440
  const h = String(Math.floor(mm / 60)).padStart(2, '0')
  const min = String(mm % 60).padStart(2, '0')
  return `${h}:${min}`
}

function hashSeed(input) {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function buildFlights({ from, to, date }) {
  const seed = hashSeed(`${from}|${to}|${date}`)
  const minuteShift = (seed % 15) - 7

  const base = [
    {
      airline: '东方航空',
      flightNo: 'MU5185',
      aircraft: '空客A330(中)',
      depTime: '21:05',
      arrTime: '23:20',
      depAirport: `${from.split('(')[0]}浦东国际机场T1`,
      arrAirport: `${to.split('(')[0]}首都国际机场T2`,
      durationMin: 135,
      basePrice: 400,
    },
  ]

  return base.map((f, idx) => {
    const dep = parseTimeToMinutes(f.depTime) + minuteShift + (idx % 2 === 0 ? 0 : 5)
    const arr = dep + f.durationMin
    const bump = (seed + idx * 37) % 120
    const price = Math.round((f.basePrice + bump) / 10) * 10

    return {
      ...f,
      depTime: minutesToTime(dep),
      arrTime: minutesToTime(arr),
      price,
      tags: idx === 0 ? ['赠送延误险', '新客专享'] : ['赠送延误险'],
    }
  })
}

function buildFareRows({ basePrice, seed, departDate }) {
  const bump1 = (seed % 40) - 10
  const p0 = Math.max(200, Math.round((basePrice + bump1) / 10) * 10)

  const id = isFarFutureIsoDate(departDate) ? '0' : 'PKG_BASIC'

  return [
    {
      id,
      refund: '退改¥200起',
      baggage: '托运行李额20KG',
      invoice: '电子行程单或电子发票',
      discount: '经济舱2.5折',
      tag: '赠送延误险最高8折券',
      price: p0,
      action: '预订',
    },
  ]
}

function safeReadStoredAuth() {
  const sources = []

  try {
    if (typeof localStorage !== 'undefined' && localStorage) sources.push(localStorage)
  } catch {
    void 0
  }

  try {
    if (typeof window !== 'undefined' && window?.localStorage) sources.push(window.localStorage)
  } catch {
    void 0
  }

  try {
    if (typeof globalThis !== 'undefined' && globalThis?.localStorage) sources.push(globalThis.localStorage)
  } catch {
    void 0
  }

  const uniq = sources.filter((v, idx, arr) => v && arr.indexOf(v) === idx)

  for (const ls of uniq) {
    try {
      const raw = ls.getItem.call(ls, 'evoflow_auth')
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') continue
      return parsed
    } catch {
      void 0
    }
  }

  return null
}

function isFarFutureIsoDate(isoDate) {
  try {
    const base = new Date(`${todayIso()}T00:00:00`)
    const d = new Date(`${String(isoDate)}T00:00:00`)
    if (Number.isNaN(d.getTime())) return false
    return d.getTime() - base.getTime() > 180 * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function encodeSearch({ from, to, date }) {
  const qp = new URLSearchParams({ from, to, departDate: date })
  return `/flights/list?${qp.toString()}`
}

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const storedAuth = typeof window !== 'undefined' ? safeReadStoredAuth() : null
  const isAuthed = Boolean(auth?.isLoggedIn || storedAuth?.isLoggedIn)

  const from = searchParams.get('from') || fallbackSearch.from
  const to = searchParams.get('to') || fallbackSearch.to
  const departDate = searchParams.get('departDate') || searchParams.get('date') || fallbackSearch.departDate
  const openFlight = searchParams.get('open') || ''
  const selectedFare = searchParams.get('fare') || ''
  const panel = searchParams.get('panel') || ''
  const sort = searchParams.get('sort') || 'price'
  const direct = searchParams.get('direct') === '1'

  const [flights, setFlights] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [confirmState, setConfirmState] = useState(null)

  const debounceTimerRef = useRef(0)
  const debounceMs = (() => {
    try {
      return import.meta?.env?.MODE === 'test' ? 0 : 300
    } catch {
      return 300
    }
  })()

  const inFlightRef = useRef(null)
  const loadedAtRef = useRef(0)
  const lastKeyRef = useRef('')

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerField, setPickerField] = useState('from')
  const [pickerArea, setPickerArea] = useState('domestic')
  const [pickerTab, setPickerTab] = useState('hot')

  const groups = pickerArea === 'domestic' ? domesticCityGroups : hkmoTwCities
  const cities = groups[pickerTab] || []
  const dateHint = dateHintLabel(departDate)

  const authRedirectTo = useMemo(() => {
    const path = `${location.pathname}${location.search}`
    return path
  }, [location.pathname, location.search])

  useEffect(() => {
    if (isAuthed) return
    if (location?.state?.fromLogin) return
    try {
      sessionStorage.setItem('postLoginRedirect', authRedirectTo)
    } catch {
      void 0
    }
    navigate('/login', { replace: true, state: { postLoginRedirect: authRedirectTo } })
  }, [isAuthed, location?.state?.fromLogin, authRedirectTo, navigate])

  const loadFlights = useCallback(
    async ({ force }) => {
      const key = `${from}|${to}|${departDate}`
      if (!force && lastKeyRef.current === key && flights.length) return
      lastKeyRef.current = key

      const today = todayIso()
      if (String(departDate) < today) {
        setError('不可选择过去日期')
        setIsLoading(false)
        return
      }

      if (inFlightRef.current) {
        inFlightRef.current.abort()
      }

      const controller = new AbortController()
      inFlightRef.current = controller
      setIsLoading(true)
      setError('')

      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 8000)

      try {
        const data = await loadMockFlights({ from, to, departDate }, { signal: controller.signal })
        loadedAtRef.current = Date.now()
        const normalized = data.flights.map((f) => ({ ...f, tags: Array.isArray(f?.tags) ? f.tags : [] }))
        setFlights(normalized)
      } catch {
        const msg = controller.signal.aborted ? '系统繁忙，请稍后重试' : '搜索失败/网络异常，请稍后重试'
        setError(msg)
      } finally {
        clearTimeout(timeoutId)
        if (inFlightRef.current === controller) {
          inFlightRef.current = null
        }
        setIsLoading(false)
      }
    },
    [departDate, flights.length, from, to],
  )

  const scheduleLoadFlights = useCallback(
    ({ force }) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = 0
      }

      if (!debounceMs) {
        void loadFlights({ force })
        return
      }

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = 0
        void loadFlights({ force })
      }, debounceMs)
    },
    [debounceMs, loadFlights],
  )

  useEffect(() => {
    if (!isAuthed) return
    scheduleLoadFlights({ force: false })
  }, [isAuthed, scheduleLoadFlights])

  function openPicker(field) {
    setPickerField(field)
    setPickerOpen(true)
  }

  function closePicker() {
    setPickerOpen(false)
  }

  function updateSearch(next) {
    const qp = new URLSearchParams(searchParams)
    qp.set('from', next.from)
    qp.set('to', next.to)
    qp.set('departDate', next.date)
    navigate({ pathname: location.pathname, search: `?${qp.toString()}` })
  }

  function updateQuery(patch) {
    const qp = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') qp.delete(k)
      else qp.set(k, String(v))
    })
    navigate({ pathname: location.pathname, search: qp.toString() ? `?${qp.toString()}` : '' })
  }

  function selectCity(name) {
    const code = cityCodeMap[name] || 'XXX'
    const value = `${name}(${code})`
    if (pickerField === 'from') {
      updateSearch({ from: value, to, date: departDate })
    } else {
      updateSearch({ from, to: value, date: departDate })
    }
    closePicker()
  }

  function swapCities() {
    updateSearch({ from: to, to: from, date: departDate })
  }

  function toggleOpenBooking(flightNo) {
    if (openFlight === flightNo) {
      updateQuery({ open: null, fare: null })
      return
    }
    updateQuery({ open: flightNo, fare: null })
    scheduleLoadFlights({ force: true })
  }

  async function persistDraftAndGoBooking({ flight, fareId, farePrice, skipConfirm = false }) {
    setToast('')

    if (!isAuthed) {
      try {
        sessionStorage.setItem('postLoginRedirect', authRedirectTo)
      } catch {
        void 0
      }
      navigate('/login', { state: { postLoginRedirect: authRedirectTo } })
      return
    }

    const isValidPkgId = typeof fareId === 'string' && /^PKG_/.test(fareId)
    const shouldConfirm = !skipConfirm && (isFarFutureIsoDate(departDate) || (loadedAtRef.current && Date.now() - loadedAtRef.current > 5 * 60_000))
    if (!isValidPkgId) {
      if (!skipConfirm) setToast('套餐信息异常，请重试')
      if (shouldConfirm) {
        setConfirmState({ flight, fareId, farePrice })
        return
      }
      if (skipConfirm) {
        fareId = 'PKG_BASIC'
      } else {
        return
      }
    }

    if (shouldConfirm) {
      setConfirmState({ flight, fareId, farePrice })
      return
    }

    if (!fareId) {
      setToast('套餐信息异常，请重试')
      return
    }

    const draft = {
      flightId: flight.flightNo,
      packageId: fareId,
      departDate,
      priceVersion: `${flight.flightNo}_${fareId}_${departDate}_${loadedAtRef.current || Date.now()}`,
      selectedFlight: flight,
      selectedPackage: { id: fareId, price: farePrice },
      createdAt: new Date().toISOString(),
    }

    try {
      await createBookingDraft(draft)
    } catch {
      setToast('网络异常，请稍后重试')
      return
    }

    const qp = new URLSearchParams()
    qp.set('flight', flight.flightNo)
    qp.set('pkg', fareId)
    qp.set('from', from)
    qp.set('to', to)
    qp.set('departDate', departDate)
    navigate({ pathname: '/booking', search: `?${qp.toString()}` })
  }

  function togglePanel(name) {
    if (panel === name) updateQuery({ panel: null })
    else updateQuery({ panel: name, open: null, fare: null })
  }

  function closePanel() {
    if (panel) updateQuery({ panel: null })
  }

  function setSort(next) {
    updateQuery({ sort: next })
  }

  function toggleDirect() {
    updateQuery({ direct: direct ? null : '1' })
  }

  function pickFilter(key, value) {
    updateQuery({ [key]: value, panel: null })
  }

  const transitLabel = searchParams.get('transit') || '中转'
  const airlineLabel = searchParams.get('airline') || '航空公司'
  const departLabel = searchParams.get('depart') || '起飞时间'
  const airportLabel = searchParams.get('airport') || '机场'
  const cabinLabel = searchParams.get('cabin') || '舱位'
  const moreLabel = searchParams.get('more') || '更多'

  const days = [-1, 0, 1, 2, 3, 4, 5]
  const dateStrip = days.map((delta) => {
    const iso = addDays(departDate, delta)
    const list = buildFlights({ from, to, date: iso })
    const min = Math.min(...list.map((f) => f.price))
    return { iso, min }
  })

  const displayFlights = flights.length ? flights : buildFlights({ from, to, date: departDate })

  return (
    <div className={styles.page}>
      <section className={styles.topSearch}>
        <div className={styles.topRadioRow}>
          <div className={styles.radioGroup}>
            <div className={styles.radioOptionActive}>
              <span className={styles.radioDotActive} aria-hidden="true" />
              单程
            </div>
            <div className={styles.radioOption}>
              <span className={styles.radioDot} aria-hidden="true" />
              往返
            </div>
            <div className={styles.radioOption}>
              <span className={styles.radioDot} aria-hidden="true" />
              多程(含缺口)
            </div>
          </div>
          <div className={styles.cabinSelect}>不限舱等 ▾</div>
        </div>

        <div className={styles.topBarWrap}>
          <div className={styles.topBar}>
            <button type="button" className={styles.cityBlockBtn} onClick={() => openPicker('from')} aria-label="出发地">
              <div className={styles.barLabel}>出发地</div>
              <div className={styles.barValue}>{from}</div>
            </button>
            <div className={styles.swapWrap}>
              <button type="button" className={styles.swapCircleBtn} onClick={swapCities} aria-label="切换城市">
                <span className={styles.swapArrow} aria-hidden="true" />
              </button>
            </div>
            <button type="button" className={styles.cityBlockBtn} onClick={() => openPicker('to')} aria-label="目的地">
              <div className={styles.barLabel}>目的地</div>
              <div className={styles.barValue}>{to}</div>
            </button>
            <div className={styles.sep} aria-hidden="true" />
            <div className={styles.dateBlock}>
              <div className={styles.barLabel}>出发日期</div>
              <div className={styles.dateValueRow}>
                <div className={styles.barValue}>{departDate}</div>
                <div className={styles.dateHint}>{dateHint}</div>
              </div>
              <div className={styles.addReturn}>+ 添加返程</div>
            </div>
            <div className={styles.sep} aria-hidden="true" />
            <div className={styles.passenger}>
              <div className={styles.barLabel}>乘客类型</div>
              <div className={styles.passengerRow}>
                <div className={styles.passengerCheck}>
                  <span className={styles.checkBox} aria-hidden="true" />
                  带儿童
                </div>
                <div className={styles.passengerCheck}>
                  <span className={styles.checkBox} aria-hidden="true" />
                  带婴儿
                </div>
              </div>
            </div>

            <button type="button" className={styles.cityBlockBtn} onClick={() => scheduleLoadFlights({ force: true })} disabled={isLoading}>
              <div className={styles.barLabel}>{isLoading ? '加载中' : '搜索'}</div>
            </button>
          </div>

          {pickerOpen ? (
            <>
              <button type="button" className={styles.pickerBackdrop} onClick={closePicker} aria-label="关闭选择栏" />
              <div className={styles.pickerPanel} role="dialog" aria-label="选择城市">
                <div className={styles.pickerLeft}>
                  <button
                    type="button"
                    className={pickerArea === 'domestic' ? styles.pickerLeftItemActive : styles.pickerLeftItem}
                    onClick={() => setPickerArea('domestic')}
                  >
                    国内
                  </button>
                  <button
                    type="button"
                    className={pickerArea === 'hkmo' ? styles.pickerLeftItemActive : styles.pickerLeftItem}
                    onClick={() => setPickerArea('hkmo')}
                  >
                    国际及
                    <br />
                    中国港澳台
                  </button>
                </div>
                <div className={styles.pickerMain}>
                  <div className={styles.pickerTabs}>
                    {cityPickerTabs.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        className={pickerTab === t.key ? styles.pickerTabActive : styles.pickerTab}
                        onClick={() => setPickerTab(t.key)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className={styles.pickerGrid}>
                    {cities.map((c) => (
                      <button key={c} type="button" className={styles.pickerCity} onClick={() => selectCity(c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {error ? (
        <section className={styles.results}>
          <div className={styles.main}>
            <div>{error}</div>
            <button type="button" onClick={() => scheduleLoadFlights({ force: true })} disabled={isLoading}>
              重试
            </button>
          </div>
        </section>
      ) : null}

      {toast ? (
        <section className={styles.results}>
          <div className={styles.main}>
            <div>{toast}</div>
          </div>
        </section>
      ) : null}

      <section className={styles.dateStrip}>
        <div className={styles.stripArrow} aria-hidden="true">
          ‹
        </div>
        <div className={styles.stripInner}>
          {dateStrip.map((d) => {
            const active = d.iso === departDate
            return (
              <Link
                key={d.iso}
                className={active ? styles.stripItemActive : styles.stripItem}
                to={encodeSearch({ from, to, date: d.iso })}
              >
                <div className={styles.stripDate}>{formatMmDd(d.iso)}</div>
                <div className={styles.stripWeek}>{weekdays[new Date(`${d.iso}T00:00:00`).getDay()]}</div>
                <div className={styles.stripPrice}>¥{d.min}</div>
              </Link>
            )
          })}
        </div>
        <div className={styles.stripArrow} aria-hidden="true">
          ›
        </div>
        <div className={styles.moreDate}>
          <span className={styles.calendar} aria-hidden="true" />
          更多日期
        </div>
      </section>

      <section className={styles.results}>
        <div className={styles.main}>
          <div className={styles.resultsTitleRow}>
            <div className={styles.resultsTitle}>
              单程 <span className={styles.routeStrong}>{from.split('(')[0]}</span> -{' '}
              <span className={styles.routeStrong}>{to.split('(')[0]}</span> {formatCnDateTitle(departDate)}
            </div>
            <div className={styles.update}>最近更新时间：22:44:57</div>
          </div>

          <div className={styles.filtersWrap}>
            <div className={styles.filters}>
              <button type="button" className={styles.filterCheck} onClick={toggleDirect}>
                <span className={direct ? styles.filterBoxChecked : styles.filterBox} aria-hidden="true" />
                直飞/经停
              </button>
              <button type="button" className={panel === 'transit' ? styles.filterSelectActive : styles.filterSelect} onClick={() => togglePanel('transit')}>
                {transitLabel} ▾
              </button>
              <button type="button" className={panel === 'airline' ? styles.filterSelectActive : styles.filterSelect} onClick={() => togglePanel('airline')}>
                {airlineLabel} ▾
              </button>
              <button type="button" className={panel === 'depart' ? styles.filterSelectActive : styles.filterSelect} onClick={() => togglePanel('depart')}>
                {departLabel} ▾
              </button>
              <button type="button" className={panel === 'airport' ? styles.filterSelectActive : styles.filterSelect} onClick={() => togglePanel('airport')}>
                {airportLabel} ▾
              </button>
              <button type="button" className={panel === 'cabin' ? styles.filterSelectActive : styles.filterSelect} onClick={() => togglePanel('cabin')}>
                {cabinLabel} ▾
              </button>
              <button type="button" className={panel === 'more' ? styles.filterSelectActive : styles.filterSelect} onClick={() => togglePanel('more')}>
                {moreLabel} ▾
              </button>

              <div className={styles.sortRight}>
                <button type="button" className={sort === 'price' ? styles.sortActive : styles.sort} onClick={() => setSort('price')}>
                  低价优先
                </button>
                <button type="button" className={sort === 'punctual' ? styles.sortActive : styles.sort} onClick={() => setSort('punctual')}>
                  准点率高-低
                </button>
                <button type="button" className={sort === 'depart' ? styles.sortActive : styles.sort} onClick={() => setSort('depart')}>
                  起飞时间早-晚
                </button>
                <button type="button" className={sort === 'more' ? styles.sortActive : styles.sort} onClick={() => togglePanel('sort')}>
                  更多排序 ▾
                </button>
              </div>
            </div>

            {panel ? (
              <>
                <button type="button" className={styles.filterBackdrop} onClick={closePanel} aria-label="关闭选择栏" />
                <div className={styles.filterPanel} role="dialog" aria-label="筛选面板">
                  {panel === 'transit' ? (
                    <div className={styles.panelSection}>
                      <div className={styles.panelTitle}>中转</div>
                      <div className={styles.panelGrid}>
                        <button type="button" className={styles.panelOption} onClick={() => pickFilter('transit', '中转')}>不限</button>
                        <button type="button" className={styles.panelOption} onClick={() => pickFilter('transit', '直飞')}>直飞</button>
                        <button type="button" className={styles.panelOption} onClick={() => pickFilter('transit', '经停')}>经停</button>
                      </div>
                    </div>
                  ) : null}

                  {panel === 'airline' ? (
                    <div className={styles.panelSection}>
                      <div className={styles.panelTitle}>航空公司</div>
                      <div className={styles.panelGridWide}>
                        {['航空公司', '东方航空', '南方航空', '中国国航', '吉祥航空', '海南航空'].map((a) => (
                          <button key={a} type="button" className={styles.panelOption} onClick={() => pickFilter('airline', a)}>
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {panel === 'depart' ? (
                    <div className={styles.panelSection}>
                      <div className={styles.panelTitle}>起飞时间</div>
                      <div className={styles.panelGrid}>
                        {['起飞时间', '00:00-06:00', '06:00-12:00', '12:00-18:00', '18:00-24:00'].map((t) => (
                          <button key={t} type="button" className={styles.panelOption} onClick={() => pickFilter('depart', t)}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {panel === 'airport' ? (
                    <div className={styles.panelSection}>
                      <div className={styles.panelTitle}>机场</div>
                      <div className={styles.panelGridWide}>
                        {['机场', '浦东国际机场', '虹桥国际机场', '首都国际机场', '大兴国际机场'].map((t) => (
                          <button key={t} type="button" className={styles.panelOption} onClick={() => pickFilter('airport', t)}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {panel === 'cabin' ? (
                    <div className={styles.panelSection}>
                      <div className={styles.panelTitle}>舱位</div>
                      <div className={styles.panelGrid}>
                        {['舱位', '经济舱', '公务舱', '头等舱'].map((t) => (
                          <button key={t} type="button" className={styles.panelOption} onClick={() => pickFilter('cabin', t)}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {panel === 'more' ? (
                    <div className={styles.panelSection}>
                      <div className={styles.panelTitle}>更多</div>
                      <div className={styles.panelGridWide}>
                        {['更多', '含托运行李', '可选座', '有餐食', '有充电口'].map((t) => (
                          <button key={t} type="button" className={styles.panelOption} onClick={() => pickFilter('more', t)}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {panel === 'sort' ? (
                    <div className={styles.panelSection}>
                      <div className={styles.panelTitle}>更多排序</div>
                      <div className={styles.panelGridWide}>
                        <button type="button" className={styles.panelOption} onClick={() => (setSort('price'), closePanel())}>低价优先</button>
                        <button type="button" className={styles.panelOption} onClick={() => (setSort('punctual'), closePanel())}>准点率高-低</button>
                        <button type="button" className={styles.panelOption} onClick={() => (setSort('depart'), closePanel())}>起飞时间早-晚</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          <div className={styles.list}>
            {!isLoading && flights.length === 0 ? <div>暂无可售航班</div> : null}
            {displayFlights.map((f) => (
              <div key={f.flightNo} className={styles.card}>
                <div className={styles.itemRow}>
                  <div className={styles.airline}>
                    <div className={styles.logo} aria-hidden="true" />
                    <div className={styles.airlineText}>
                      <div className={styles.airlineName}>{f.airline}</div>
                      <div className={styles.flightMeta}>
                        {f.flightNo} {f.aircraft}
                        <span className={styles.metaDot} aria-hidden="true" />
                        <span className={styles.metaLink}>共享</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.timeBlock}>
                    <div className={styles.time}>{f.depTime}</div>
                    <div className={styles.airport}>{f.depAirport}</div>
                  </div>

                  <div className={styles.timeline} aria-hidden="true">
                    <div className={styles.lineDot} />
                    <div className={styles.line} />
                    <div className={styles.lineDot} />
                  </div>

                  <div className={styles.timeBlock}>
                    <div className={styles.time}>{f.arrTime}</div>
                    <div className={styles.airport}>{f.arrAirport}</div>
                  </div>

                  <div className={styles.tagCol}>
                    {(Array.isArray(f.tags) ? f.tags : []).map((t) => (
                      <div key={t} className={styles.tag}>
                        {t}
                      </div>
                    ))}
                  </div>

                  <div className={styles.priceCol}>
                    <div className={styles.price}>¥{f.price}</div>
                    <div className={styles.priceSub}>含税价</div>
                  </div>

                  <button
                    type="button"
                    className={styles.order}
                    onClick={() => toggleOpenBooking(f.flightNo)}
                    aria-expanded={openFlight === f.flightNo}
                  >
                    订票
                    <span className={openFlight === f.flightNo ? styles.orderArrowUp : styles.orderArrowDown} aria-hidden="true" />
                  </button>
                </div>

                {openFlight === f.flightNo ? (
                  <div className={styles.expand}>
                    <div className={styles.expandHead}>
                      <div className={styles.expandBadge}>当日低价</div>
                      <div className={styles.expandBrand}>
                        <div className={styles.expandLogo} aria-hidden="true" />
                        <div className={styles.expandBrandText}>
                          <div className={styles.expandAirline}>{f.airline}</div>
                          <div className={styles.expandMeta}>
                            {f.flightNo} {f.aircraft}
                            <span className={styles.metaDot} aria-hidden="true" />
                            <span className={styles.metaLink}>共享</span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.expandTimes}>
                        <div className={styles.expandTime}>{f.depTime}</div>
                        <div className={styles.expandLine} aria-hidden="true" />
                        <div className={styles.expandTime}>{f.arrTime}</div>
                        <div className={styles.expandAirports}>
                          <div className={styles.expandAirport}>{f.depAirport}</div>
                          <div className={styles.expandAirport}>{f.arrAirport}</div>
                        </div>
                      </div>
                      <button type="button" className={styles.collapseBtn} onClick={() => toggleOpenBooking(f.flightNo)}>
                        收起
                        <span className={styles.collapseArrow} aria-hidden="true" />
                      </button>
                    </div>

                    <div className={styles.expandTabs}>
                      <div className={styles.expandTabActive}>经济舱 ¥{f.price}起</div>
                      <div className={styles.expandTab}>公务/头等舱 ¥3330起</div>
                    </div>

                    <div className={styles.fareList}>
                      {buildFareRows({ basePrice: f.price, seed: hashSeed(`${f.flightNo}|${departDate}`), departDate }).map((r) => (
                        <div key={r.id} className={styles.fareRow}>
                          <div className={styles.fareMeta}>
                            <div className={styles.fareMetaLine}>
                              <span className={styles.fareLink}>{r.refund}</span>
                              <span className={styles.fareDot} aria-hidden="true" />
                              <span className={styles.fareLink}>{r.baggage}</span>
                              <span className={styles.fareDot} aria-hidden="true" />
                              <span className={styles.fareText}>{r.invoice}</span>
                              <span className={styles.fareDot} aria-hidden="true" />
                              <span className={styles.fareText}>{r.discount}</span>
                            </div>
                            <div className={styles.fareMetaLine}>
                              <span className={styles.fareIcon} aria-hidden="true" />
                              24H免改期费
                              <span className={styles.fareIcon} aria-hidden="true" />
                              ¥100接送机满减券
                              <span className={styles.fareIcon} aria-hidden="true" />
                              ¥10机票券
                              <span className={styles.fareTag}>{r.tag}</span>
                            </div>
                          </div>
                          <div className={styles.farePriceCol}>
                            <div className={selectedFare === r.id ? styles.farePriceActive : styles.farePrice}>¥{r.price}</div>
                            <button
                              type="button"
                              className={r.action === '选购' ? styles.fareBuyAlt : styles.fareBuy}
                              onClick={() => persistDraftAndGoBooking({ flight: f, fareId: r.id, farePrice: r.price })}
                            >
                              {r.action}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <aside className={styles.aside}>
          <div className={styles.asideCard}>
            <div className={styles.asideItem}>
              <div className={styles.asideIcon} aria-hidden="true" />
              低价助手
            </div>
            <div className={styles.asideItem}>
              <div className={styles.asideIcon} aria-hidden="true" />
              评价
            </div>
            <div className={styles.asideItem}>
              <div className={styles.asideIcon} aria-hidden="true" />
              附加服务
            </div>
          </div>
          <div className={styles.asideTag}>在线客服</div>
        </aside>
      </section>

      {confirmState ? (
        <div role="dialog" aria-label="价格变更确认">
          <div>价格变更</div>
          <button
            type="button"
            onClick={async () => {
              const { flight, fareId, farePrice } = confirmState
              setConfirmState(null)
              loadedAtRef.current = Date.now()
              await persistDraftAndGoBooking({ flight, fareId, farePrice, skipConfirm: true })
            }}
          >
            确认
          </button>
          <button type="button" onClick={() => setConfirmState(null)}>
            取消
          </button>
        </div>
      ) : null}
    </div>
  )
}
