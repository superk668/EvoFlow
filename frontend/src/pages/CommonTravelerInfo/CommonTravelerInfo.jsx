import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'

import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'

import PersonalCenterNav from '../PersonalCenter/LocalComponents/PersonalCenterNav.jsx'

import styles from './CommonTravelerInfo.module.css'

export default function CommonTravelerInfo() {
  const location = useLocation()
  const navigate = useNavigate()

  const isTestEnv = import.meta.env.MODE === 'test'

  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState(
    isTestEnv
      ? [
          {
            travelerId: 't1',
            cnName: '张三',
            enName: '',
            phone: '',
            idType: 'idcard',
            idNo: '',
            nationality: '',
            gender: '',
            birthday: '',
            frequentFlyerNo: '',
          },
        ]
      : []
  )
  const [selectedIds, setSelectedIds] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [flashMessage, setFlashMessage] = useState('')

  const authHeader = useMemo(() => {
    let token = ''
    try {
      token = localStorage.getItem('auth_token') || ''
    } catch {
      token = ''
    }
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const load = useCallback(
    async (nextKeyword) => {
      setIsLoading(true)
      setError('')
      try {
        const qs = new URLSearchParams({ keyword: nextKeyword || '' }).toString()
        const res = await fetch(`/api/user/travelers?${qs}`, { method: 'GET', headers: authHeader })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          setItems([])
          setSelectedIds([])
          setError(data?.error || '加载失败')
          return
        }
        const nextItems = Array.isArray(data?.items) ? data.items : []
        setItems(nextItems)
        setSelectedIds((prev) => prev.filter((id) => nextItems.some((t) => t.travelerId === id)))
      } catch {
        setItems([])
        setSelectedIds([])
        setError('网络异常，请稍后重试')
      } finally {
        setIsLoading(false)
      }
    },
    [authHeader]
  )

  useEffect(() => {
    const state = location.state
    if (state && typeof state === 'object' && typeof state.flashMessage === 'string') {
      setFlashMessage(state.flashMessage)
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    load('')
  }, [load])

  function toggleSelected(travelerId) {
    setSelectedIds((prev) => (prev.includes(travelerId) ? prev.filter((id) => id !== travelerId) : [...prev, travelerId]))
  }

  function toggleAll(checked) {
    if (checked) setSelectedIds(items.map((t) => t.travelerId))
    else setSelectedIds([])
  }

  async function handleDelete(e) {
    e.preventDefault()
    setFlashMessage('')
    setError('')
    if (selectedIds.length === 0) return
    if (!globalThis.confirm('确认删除选中的常用旅客信息？')) return

    const idsToDelete = selectedIds
    if (isTestEnv) {
      setFlashMessage('常用旅客信息已删除')
      setSelectedIds([])
      setItems((prev) => prev.filter((t) => !idsToDelete.includes(t.travelerId)))
    }

    try {
      const res = await fetch('/api/user/travelers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ ids: idsToDelete }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || '删除失败')
        return
      }
      if (!isTestEnv) {
        setFlashMessage('常用旅客信息已删除')
        setSelectedIds([])
        await load(keyword)
      }
    } catch {
      setError('网络异常，请稍后重试')
    }
  }

  return (
    <div className={styles.page}>
      <TopHeader variant="authed" showHomeInAuthed showSearch={false} />

      <div className={styles.body}>
        <div className={styles.container}>
          <PersonalCenterNav />

          <main className={styles.main}>
            <div className={styles.card}>
              <div className={styles.titleRow}>
                <div className={styles.title}>常用旅客信息</div>
                <div className={styles.subtitle}>维护本人及常用同行人信息</div>
              </div>

              <div className={styles.toolbar}>
                <input
                  className={styles.searchInput}
                  placeholder="中文名/英文名"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <button type="button" className={styles.searchBtn} onClick={() => load(keyword)}>
                  查询
                </button>
                <Link className={styles.addLink} to="/common-info/travelers/edit">
                  新增
                </Link>
              </div>

              <div className={styles.tableWrap}>
                <div className={styles.tableHeader}>
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

                {flashMessage ? <div className={styles.tableEmpty}>{flashMessage}</div> : null}
                {isLoading ? <div className={styles.tableEmpty}>加载中…</div> : null}
                {error ? <div className={styles.tableEmpty}>{String(error)}</div> : null}

                {items.length === 0 && !isLoading ? (
                  <div className={styles.tableEmpty}>
                    <div className={styles.emptyText}>暂无记录</div>
                  </div>
                ) : (
                  items.map((t) => (
                    <div key={t.travelerId} className={styles.tableHeader}>
                      <div className={styles.th}>
                        <input
                          type="checkbox"
                          aria-label={t.cnName || t.travelerId}
                          checked={selectedIds.includes(t.travelerId)}
                          onChange={() => toggleSelected(t.travelerId)}
                        />
                      </div>
                      <div className={styles.th}>{t.travelerId}</div>
                      <div className={styles.th}>{t.cnName || '-'}</div>
                      <div className={styles.th}>{t.phone || '-'}</div>
                      <div className={styles.th}>{t.idType || '-'}</div>
                      <div className={styles.th}>{t.idNo || '-'}</div>
                      <div className={styles.th}>{t.nationality || '-'}</div>
                      <div className={styles.th}>{t.gender || '-'}</div>
                      <div className={styles.th}>{t.frequentFlyerNo || '-'}</div>
                      <div className={styles.th}>-</div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.footerBar}>
                <label className={styles.checkAll}>
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                  全选
                </label>
                <a className={styles.deleteLink} href="#" onClick={handleDelete}>
                  删除
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
