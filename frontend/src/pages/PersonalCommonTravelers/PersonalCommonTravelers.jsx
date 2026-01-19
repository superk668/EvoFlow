import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import styles from './PersonalCommonTravelers.module.css'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'

const STORAGE_KEY = 'evoflow_common_travelers'
const TOAST_KEY = 'commonTravelersToast'

function maskPhone(phone) {
  const raw = String(phone ?? '').trim()
  if (!raw) return '—'
  const [prefix, rest] = raw.includes('-') ? raw.split('-', 2) : ['', raw]
  const digits = String(rest).replace(/\s+/g, '')
  if (digits.length < 7) return raw
  const masked = `${digits.slice(0, 3)}****${digits.slice(-4)}`
  return prefix ? `${prefix}-${masked}` : masked
}

function maskId(idNumber) {
  const s = String(idNumber ?? '').replace(/\s+/g, '')
  if (!s) return '—'
  if (s.length < 5) return s
  return `${s.slice(0, 3)}**********${s.slice(-2)}`
}

function readCommonTravelers() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
}

function writeCommonTravelers(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function isValidNameKeyword(keyword) {
  const s = String(keyword ?? '').trim()
  if (!s) return true
  return /^[\p{L}\p{N}\s·.'-]+$/u.test(s)
}

export default function PersonalCommonTravelers() {
  const [loadError, setLoadError] = useState(() => {
    try {
      readCommonTravelers()
      return ''
    } catch {
      return '加载失败，请稍后重试'
    }
  })
  const [actionError, setActionError] = useState('')
  const [toast] = useState(() => {
    try {
      const msg = sessionStorage.getItem(TOAST_KEY)
      return msg ? String(msg) : ''
    } catch {
      return ''
    }
  })
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [travelers, setTravelers] = useState(() => {
    try {
      return readCommonTravelers()
    } catch {
      return []
    }
  })
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)

  const visibleTravelers = useMemo(() => {
    if (!appliedKeyword.trim()) return travelers
    const needle = appliedKeyword.trim().toLowerCase()
    return travelers.filter((t) => {
      const nameZh = String(t?.nameZh ?? '')
      const lastName = String(t?.lastName ?? '')
      const firstName = String(t?.firstName ?? '')
      const en = `${lastName} ${firstName}`.trim().toLowerCase()
      return nameZh.includes(appliedKeyword.trim()) || en.includes(needle)
    })
  }, [appliedKeyword, travelers])

  const allVisibleSelected = useMemo(() => {
    if (visibleTravelers.length === 0) return false
    return visibleTravelers.every((t) => selectedIds.has(String(t?.travelerId ?? '')))
  }, [selectedIds, visibleTravelers])

  function reload() {
    setLoadError('')
    setActionError('')
    try {
      const next = readCommonTravelers()
      setTravelers(next)
    } catch {
      setLoadError('加载失败，请稍后重试')
    }
  }

  useEffect(() => {
    try {
      if (toast) sessionStorage.removeItem(TOAST_KEY)
    } catch {
      void 0
    }
  }, [toast])

  function applySearch() {
    setActionError('')
    if (!isValidNameKeyword(keyword)) {
      setActionError('请输入合法的姓名关键字')
      return
    }
    setAppliedKeyword(keyword)
  }

  function toggleAllVisible(checked) {
    setActionError('')
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        visibleTravelers.forEach((t) => {
          const id = String(t?.travelerId ?? '')
          if (id) next.add(id)
        })
      } else {
        visibleTravelers.forEach((t) => {
          const id = String(t?.travelerId ?? '')
          if (id) next.delete(id)
        })
      }
      return next
    })
  }

  function toggleOne(id, checked) {
    setActionError('')
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function deleteOne(traveler) {
    setActionError('')
    const id = String(traveler?.travelerId ?? '')
    if (!id) return
    if (traveler?.isSelf) {
      setActionError('本人信息不可删除')
      return
    }

    try {
      const next = travelers.filter((t) => String(t?.travelerId ?? '') !== id)
      writeCommonTravelers(next)
      setTravelers(next)
      setSelectedIds((prev) => {
        const s = new Set(prev)
        s.delete(id)
        return s
      })
    } catch {
      setActionError('删除失败，请稍后重试')
    }
  }

  function openBatchDelete() {
    setActionError('')
    if (selectedIds.size === 0) {
      setActionError('请先选择要删除的记录')
      return
    }

    const selected = travelers.filter((t) => selectedIds.has(String(t?.travelerId ?? '')))
    if (selected.some((t) => Boolean(t?.isSelf))) {
      setActionError('包含不可删除的记录')
      return
    }
    setConfirmOpen(true)
  }

  function confirmBatchDelete() {
    setConfirmOpen(false)
    setActionError('')
    try {
      const next = travelers.filter((t) => !selectedIds.has(String(t?.travelerId ?? '')))
      writeCommonTravelers(next)
      setTravelers(next)
      setSelectedIds(new Set())
    } catch {
      setActionError('删除失败，请稍后重试')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PersonalLeftBar activeKey="common-travelers" />
        <div className={styles.main}>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <div className={styles.panelTitle}>常用旅客信息列表</div>
              <div className={styles.panelSub}>维护本人及常用同行人信息</div>
            </div>

            <div className={styles.searchRow}>
              <input
                className={styles.searchInput}
                placeholder="中文名/英文名"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <button type="button" className={styles.searchBtn} onClick={applySearch}>
                查询
              </button>
              <Link className={styles.addLink} to="/user-center/common-info/travelers/add">
                新增
              </Link>
            </div>

            {toast ? <div>{toast}</div> : null}
            {actionError ? <div>{actionError}</div> : null}

            {loadError ? (
              <div>
                <div>{loadError}</div>
                <button type="button" onClick={reload}>
                  重试
                </button>
              </div>
            ) : null}

            <div className={styles.table}>
              <div className={styles.thead}>
                <div className={styles.th}>选择</div>
                <div className={styles.th}>标识</div>
                <div className={styles.th}>姓名</div>
                <div className={styles.th}>手机/电话</div>
                <div className={styles.th}>证件类型</div>
                <div className={styles.th}>证件号码</div>
                <div className={styles.th}>国籍(国家/地区)</div>
                <div className={styles.th}>性别</div>
                <div className={styles.th}>常旅客卡</div>
                <div className={styles.th}>操作</div>
              </div>
              <div className={styles.tbody}>
                {!loadError && visibleTravelers.length === 0 ? <div className={styles.empty}>暂无记录</div> : null}

                {!loadError
                  ? visibleTravelers.map((t) => {
                      const travelerId = String(t?.travelerId ?? '')
                      const nameZh = String(t?.nameZh ?? '')
                      const nameEn = `${String(t?.lastName ?? '')} ${String(t?.firstName ?? '')}`.trim()
                      const name = nameZh || nameEn || '—'
                      const idType = String(t?.idType ?? '') || '—'
                      const idMasked = t?.idNumberMasked ? String(t.idNumberMasked) : maskId(t?.idNumber)
                      const nationality = String(t?.nationality ?? '') || '—'
                      const gender = String(t?.gender ?? '') || '—'
                      const cards = Array.isArray(t?.frequentFlyerCards) ? t.frequentFlyerCards : []
                      const cardText = cards.length ? `已设置(${cards.length})` : '—'

                      return (
                        <div key={travelerId} className={styles.tr}>
                          <div className={styles.td}>
                            <input
                              type="checkbox"
                              aria-label={travelerId || name}
                              checked={selectedIds.has(travelerId)}
                              onChange={(e) => toggleOne(travelerId, e.target.checked)}
                            />
                          </div>
                          <div className={styles.td}>{t?.isSelf ? <span>本人</span> : <span>—</span>}</div>
                          <div className={styles.td}>{name}</div>
                          <div className={styles.td}>{maskPhone(t?.phoneNumber)}</div>
                          <div className={styles.td}>{idType}</div>
                          <div className={styles.td}>{idMasked}</div>
                          <div className={styles.td}>{nationality}</div>
                          <div className={styles.td}>{gender}</div>
                          <div className={styles.td}>{cardText}</div>
                          <div className={styles.td}>
                            <Link to={`/user-center/common-info/travelers/view?travelerId=${encodeURIComponent(travelerId)}`}>
                              查看
                            </Link>
                            <span> </span>
                            <Link to={`/user-center/common-info/travelers/edit?travelerId=${encodeURIComponent(travelerId)}`}>
                              编辑
                            </Link>
                            <span> </span>
                            <button type="button" onClick={() => deleteOne(t)}>
                              删除
                            </button>
                          </div>
                        </div>
                      )
                    })
                  : null}
              </div>
            </div>

            <div className={styles.footerRow}>
              <label className={styles.checkWrap}>
                <input
                  type="checkbox"
                  aria-label="全选"
                  checked={allVisibleSelected}
                  onChange={(e) => toggleAllVisible(e.target.checked)}
                />
                <div className={styles.footerText}>全选</div>
              </label>
              <a
                className={styles.deleteLink}
                href="#/"
                onClick={(e) => {
                  e.preventDefault()
                  openBatchDelete()
                }}
              >
                删除
              </a>
            </div>

            {confirmOpen ? (
              <div>
                <div>确认删除所选旅客？</div>
                <button type="button" onClick={confirmBatchDelete}>
                  确认删除
                </button>
                <button type="button" onClick={() => setConfirmOpen(false)}>
                  取消
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
