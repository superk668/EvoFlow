import styles from './BottomBar.module.css'
import qrPlaceholder from '../../assets/placeholders/footer-qr.svg'

export default function BottomBar() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.cols}>
          <div className={styles.col}>
            <div className={styles.colTitle}>旅游资讯</div>
            <div className={styles.colGrid}>
              <a className={styles.link} href="#/">
                宾馆索引
              </a>
              <a className={styles.link} href="#/">
                攻略索引
              </a>
              <a className={styles.link} href="#/">
                机票索引
              </a>
              <a className={styles.link} href="#/">
                网站导航
              </a>
              <a className={styles.link} href="#/">
                旅游索引
              </a>
              <a className={styles.link} href="#/">
                邮轮索引
              </a>
              <a className={styles.link} href="#/">
                企业差旅索引
              </a>
            </div>
          </div>

          <div className={styles.vSep} aria-hidden="true" />

          <div className={styles.col}>
            <div className={styles.colTitle}>加盟合作</div>
            <div className={styles.colGrid}>
              <a className={styles.link} href="#/">
                分销联盟
              </a>
              <a className={styles.link} href="#/">
                友情链接
              </a>
              <a className={styles.link} href="#/">
                企业礼品卡采购
              </a>
              <a className={styles.link} href="#/">
                保险代理
              </a>
              <a className={styles.link} href="#/">
                代理合作
              </a>
              <a className={styles.link} href="#/">
                酒店加盟
              </a>
              <a className={styles.link} href="#/">
                目的地及景区合作
              </a>
              <a className={styles.link} href="#/">
                更多加盟合作
              </a>
            </div>
          </div>

          <div className={styles.vSep} aria-hidden="true" />

          <div className={styles.col}>
            <div className={styles.colTitle}>关于携程</div>
            <div className={styles.colStack}>
              <a className={styles.link} href="#/">
                关于携程
              </a>
              <a className={styles.link} href="#/">
                携程热点
              </a>
              <a className={styles.link} href="#/">
                联系我们
              </a>
              <a className={styles.link} href="#/">
                诚聘英才
              </a>
              <a className={styles.link} href="#/">
                用户协议
              </a>
              <a className={styles.link} href="#/">
                隐私政策
              </a>
              <a className={styles.link} href="#/">
                营业执照
              </a>
              <a className={styles.link} href="#/">
                安全中心
              </a>
              <a className={styles.link} href="#/">
                携程内容中心
              </a>
              <a className={styles.link} href="#/">
                知识产权
              </a>
              <div className={styles.group}>Trip.com Group</div>
            </div>
          </div>

          <div className={styles.contact}>
            <div className={styles.contactLine}>境内：95010</div>
            <div className={styles.contactLine}>或 400-830-6666</div>
            <div className={styles.contactLine}>中国香港：+852-3008-3295</div>
            <div className={styles.contactLine}>中国澳门：+86-21 3406-4888</div>
            <div className={styles.contactLine}>中国台湾：+86-21 3406-4888</div>
            <div className={styles.contactLine}>其他国家和地区：+86-21-3406-4888</div>
          </div>

          <div className={styles.qr}>
            <img className={styles.qrImg} src={qrPlaceholder} alt="占位-扫码下载携程App" />
            <div className={styles.qrLabel}>扫码下载携程App</div>
          </div>
        </div>
      </div>
    </footer>
  )
}

