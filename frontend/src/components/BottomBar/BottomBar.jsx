import styles from './BottomBar.module.css'
import footerQr from '../../assets/placeholders/footer_qr_90x90.svg'

const COLS = [
  {
    title: '关于携程',
    links: ['关于我们', '联系我们', '诚聘英才', '用户协议', '隐私政策'],
  },
  {
    title: '旅行服务',
    links: ['酒店预订', '机票预订', '火车票', '旅游度假', '景点门票'],
  },
  {
    title: '帮助中心',
    links: ['常见问题', '意见反馈', '安全中心', '在线客服', '投诉建议'],
  },
  {
    title: '合作与招商',
    links: ['商家入驻', '广告合作', '开放平台', '合作伙伴', '政企服务'],
  },
]

export default function BottomBar() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.cols}>
          {COLS.map((c) => (
            <div key={c.title} className={styles.col}>
              <div className={styles.colTitle}>{c.title}</div>
              <div className={styles.links}>
                {c.links.map((l) => (
                  <div key={l} className={styles.link}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className={styles.qrCol}>
            <div className={styles.colTitle}>携程旅行</div>
            <div className={styles.qrBox}>
              <img className={styles.qr} src={footerQr} alt="二维码" />
            </div>
            <div className={styles.qrText}>扫码下载 APP</div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.meta}>
          <div className={styles.metaRow}>
            <div className={styles.metaText}>Copyright © 1999-2025, ctrip.com. All rights reserved.</div>
          </div>
          <div className={styles.metaRow}>
            <div className={styles.metaText}>沪ICP备08023580号</div>
            <div className={styles.metaDot} />
            <div className={styles.metaText}>沪公网安备 31010502002731号</div>
          </div>
        </div>
      </div>
    </footer>
  )
}
