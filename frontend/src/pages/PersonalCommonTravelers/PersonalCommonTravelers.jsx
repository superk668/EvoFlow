import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import styles from './PersonalCommonTravelers.module.css'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'

const STORAGE_KEY = 'evoflow_common_travelers'
const FLASH_KEY = 'evoflow_common_travelers_flash'

function safeReadTravelers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { travelers: [], error: '' }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return { travelers: [], error: '' }
    return { travelers: parsed, error: '' }
  } catch {
    return { travelers: [], error: '加载失败，请稍后重试' }
  }
}

function safeWriteTravelers(nextTravelers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTravelers))
    return { ok: true, error: '' }
  } catch {
    return { ok: false, error: '写入失败' }
  }
}

function isInvalidKeyword(keyword) {
  const v = String(keyword || '').trim()
  if (!v) return false
  return /^[^a-zA-Z\u4e00-\u9fa5]+$/.test(v)
}

function maskIdNumber(idNumber) {
  const v = String(idNumber || '')
  if (!v) return ''
  if (v.length <= 8) return `${v.slice(0, 2)}****${v.slice(-2)}`
  return `${v.slice(0, 6)}********${v.slice(-4)}`
}

export default function PersonalCommonTravelers() {
  const [{ travelers, error }, setLoad] = useState(() => safeReadTravelers())
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [message, setMessage] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [flash] = useState(() => {
    try {
      const v = sessionStorage.getItem(FLASH_KEY)
      if (v) sessionStorage.removeItem(FLASH_KEY)
      return v || ''
    } catch {
      return ''
    }
  })

  const filtered = useMemo(() => {
    const k = String(appliedKeyword || '').trim()
    if (!k) return travelers
    return travelers.filter((t) => {
      const nameZh = String(t?.nameZh || '')
      const lastName = String(t?.lastName || '')
      const firstName = String(t?.firstName || '')
      const nameEn = `${lastName} ${firstName}`.trim()
      return nameZh.includes(k) || nameEn.toLowerCase().includes(k.toLowerCase())
    })
  }, [appliedKeyword, travelers])

  function retry() {
    setMessage('')
    setLoad(safeReadTravelers())
  }

  function onSearch() {
    if (isInvalidKeyword(keyword)) {
      setMessage('请输入合法的姓名关键字')
      return
    }
    setMessage('')
    setAppliedKeyword(String(keyword || '').trim())
  }

  function toggleSelected(travelerId, checked) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(String(travelerId))
      else next.delete(String(travelerId))
      return next
    })
  }

  function openDelete() {
    setMessage('')
    if (selectedIds.size === 0) {
      setMessage('请先选择要删除的记录')
      return
    }
    const picked = travelers.filter((t) => selectedIds.has(String(t?.travelerId)))
    const hasSelf = picked.some((t) => Boolean(t?.isSelf))
    if (hasSelf && picked.length === 1) {
      setMessage('本人信息不可删除')
      return
    }
    if (hasSelf) {
      setMessage('包含不可删除的记录')
      return
    }
    setConfirmOpen(true)
  }

  function confirmDelete() {
    setMessage('')
    const next = travelers.filter((t) => !selectedIds.has(String(t?.travelerId)))
    const written = safeWriteTravelers(next)
    if (!written.ok) {
      setMessage('删除失败，请稍后重试')
      setConfirmOpen(false)
      return
    }
    setLoad({ travelers: next, error: '' })
    setSelectedIds(new Set())
    setConfirmOpen(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PersonalLeftBar activeKey="common-travelers" />
        <div className={styles.main}>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <div className={styles.panelTitle}>常用旅客信息</div>
              <div className={styles.panelSub}>维护本人及常用同行人信息</div>
            </div>

            <div className={styles.searchRow}>
              <input
                className={styles.searchInput}
                placeholder="中文名/英文名"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <button type="button" className={styles.searchBtn} onClick={onSearch}>
                查询
              </button>
              <Link className={styles.addLink} to="/user-center/common-info/travelers/add">
                新增
              </Link>
            </div>

            {flash ? <div>{flash}</div> : null}
            {message ? <div>{message}</div> : null}
            {error ? (
              <div>
                <div>{error}</div>
                <button type="button" onClick={retry}>
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
                {error ? null : filtered.length === 0 ? (
                  <div className={styles.empty}>暂无记录</div>
                ) : (
                  filtered.map((t) => (
                    <div key={String(t?.travelerId)} className={styles.tr}>
                      <div className={styles.td}>
                        <input
                          type="checkbox"
                          aria-label={`选择-${t.travelerId}`}
                          checked={selectedIds.has(String(t?.travelerId))}
                          onChange={(e) => toggleSelected(t.travelerId, e.target.checked)}
                        />
                      </div>
                      <div className={styles.td}>{t?.isSelf ? '√' : ''}</div>
                      <div className={styles.td}>{t?.nameZh || `${t?.lastName || ''}${t?.firstName || ''}`}</div>
                      <div className={styles.td}>{t?.phoneNumber || ''}</div>
                      <div className={styles.td}>{t?.idType || ''}</div>
                      <div className={styles.td}>{maskIdNumber(t?.idNumber)}</div>
                      <div className={styles.td}>{t?.nationality || ''}</div>
                      <div className={styles.td}>{t?.gender || ''}</div>
                      <div className={styles.td}>{Array.isArray(t?.frequentFlyerCards) && t.frequentFlyerCards.length ? '已设置' : ''}</div>
                      <div className={styles.td}>
                        <span>查看</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.footerRow}>
              <div className={styles.checkWrap}>
                <div className={styles.checkbox} aria-hidden="true" />
                <div className={styles.footerText}>全选</div>
              </div>
              <a
                className={styles.deleteLink}
                href="#/"
                onClick={(e) => {
                  e.preventDefault()
                  openDelete()
                }}
              >
                删除
              </a>
            </div>

            {confirmOpen ? (
              <div role="dialog">
                <div>确认删除选中的记录吗？</div>
                <button type="button" onClick={confirmDelete}>
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
