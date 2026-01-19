import { Link, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'
import styles from './CommonTravelerView.module.css'

const STORAGE_KEY = 'evoflow_common_travelers'

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

export default function CommonTravelerView() {
  const [searchParams] = useSearchParams()
  const travelerId = searchParams.get('travelerId') ?? ''

  const [reloadToken, setReloadToken] = useState(0)

  const loadState = useMemo(() => {
    if (!travelerId) return { traveler: null, loadError: '' }
    try {
      const list = readCommonTravelers()
      const found = list.find((t) => String(t?.travelerId ?? '') === String(travelerId)) ?? null
      return { traveler: found, loadError: '', version: reloadToken }
    } catch {
      return { traveler: null, loadError: '加载失败', version: reloadToken }
    }
  }, [travelerId, reloadToken])

  const traveler = loadState.traveler
  const loadError = loadState.loadError

  function reload() {
    setReloadToken((n) => n + 1)
  }

  const viewModel = useMemo(() => {
    if (!traveler) return null
    const nameZh = String(traveler?.nameZh ?? '')
    const nameEn = `${String(traveler?.lastName ?? '')} ${String(traveler?.firstName ?? '')}`.trim()
    const nationality = String(traveler?.nationality ?? '') || '—'
    const gender = String(traveler?.gender ?? '') || '—'
    const birthday = String(traveler?.birthday ?? '') || '—'
    const birthPlace = String(traveler?.birthPlace ?? '') || '—'
    const phone = maskPhone(traveler?.phoneNumber)
    const fax = traveler?.faxNumber ? String(traveler.faxNumber) : '—'
    const email = String(traveler?.email ?? '') || '—'
    const idType = String(traveler?.idType ?? '') || '—'
    const idMasked = traveler?.idNumberMasked ? String(traveler.idNumberMasked) : maskId(traveler?.idNumber)
    const idExpiry = String(traveler?.idExpiry ?? '') || '—'
    const cards = Array.isArray(traveler?.frequentFlyerCards) ? traveler.frequentFlyerCards : []

    return {
      nameZh: nameZh || '—',
      nameEn: nameEn || '—',
      nationality,
      gender,
      birthday,
      birthPlace,
      phone,
      fax,
      email,
      idType,
      idMasked,
      idExpiry,
      cards,
    }
  }, [traveler])

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PersonalLeftBar activeKey="common-travelers" />
        <div className={styles.main}>
          <div className={styles.panel}>
            <div className={styles.head}>
              <div className={styles.title}>常用旅客信息查看</div>
              <Link className={styles.link} to="/user-center/common-info/travelers">
                查看所有旅客信息
              </Link>
            </div>

            {!travelerId ? (
              <div className={styles.error}>记录不存在或链接无效</div>
            ) : loadError ? (
              <div>
                <div className={styles.error}>{loadError}</div>
                <button type="button" onClick={reload}>
                  重试
                </button>
              </div>
            ) : travelerId && !traveler ? (
              <div className={styles.error}>记录已删除</div>
            ) : viewModel ? (
              <div className={styles.card}>
                <div className={styles.sectionTitle}>1 旅客信息</div>
                <div className={styles.row}>
                  <div className={styles.label}>中文名</div>
                  <div className={styles.value}>{viewModel.nameZh}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>英文名</div>
                  <div className={styles.value}>{viewModel.nameEn}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>国籍(国家/地区)</div>
                  <div className={styles.value}>{viewModel.nationality}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>性别</div>
                  <div className={styles.value}>{viewModel.gender}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>生日</div>
                  <div className={styles.value}>{viewModel.birthday}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>出生地</div>
                  <div className={styles.value}>{viewModel.birthPlace}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>手机号</div>
                  <div className={styles.value}>{viewModel.phone}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>传真号码</div>
                  <div className={styles.value}>{viewModel.fax}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>Email</div>
                  <div className={styles.value}>{viewModel.email}</div>
                </div>

                <div className={styles.sectionTitle}>2 证件信息</div>
                <div className={styles.row}>
                  <div className={styles.label}>证件类型</div>
                  <div className={styles.value}>{viewModel.idType}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>证件号码</div>
                  <div className={styles.value}>{viewModel.idMasked}</div>
                </div>
                <div className={styles.row}>
                  <div className={styles.label}>有效期</div>
                  <div className={styles.value}>{viewModel.idExpiry}</div>
                </div>

                <div className={styles.sectionTitle}>3 常旅客卡</div>
                {viewModel.cards.length === 0 ? (
                  <div className={styles.row}>
                    <div className={styles.label}>卡列表</div>
                    <div className={styles.value}>未设置</div>
                  </div>
                ) : (
                  viewModel.cards.map((c, idx) => (
                    <div key={idx} className={styles.row}>
                      <div className={styles.label}>卡</div>
                      <div className={styles.value}>{String(c ?? '') || '—'}</div>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            <div className={styles.foot}>
              <Link className={styles.back} to="/user-center/common-info/travelers">
                返回
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
