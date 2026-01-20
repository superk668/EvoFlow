import styles from './BottomBar.module.css'

import qrDownloadApp from '../../assets/placeholders/qr_download_app.svg'

const infoLeft = ['宾馆索引', '机票索引', '旅游索引', '企业差旅索引']
const infoRight = ['攻略索引', '网站导航', '邮轮索引']

const coopLeft = ['分销联盟', '企业礼品卡采购', '代理合作', '目的地及景区合作']
const coopRight = ['友情链接', '保险代理', '酒店加盟', '更多加盟合作']

const aboutLeft = ['关于携程', '联系我们', '用户协议', '营业执照', '携程内容中心', 'Trip.com Group']
const aboutRight = ['携程热点', '诚聘英才', '隐私政策', '安全中心', '知识产权']

export default function BottomBar() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.block}>
          <div className={styles.title}>旅游资讯</div>
          <div className={styles.twoCols}>
            <div className={styles.col}>
              {infoLeft.map((t) => (
                <a key={t} className={styles.link} href="#">
                  {t}
                </a>
              ))}
            </div>
            <div className={styles.col}>
              {infoRight.map((t) => (
                <a key={t} className={styles.link} href="#">
                  {t}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.sep} aria-hidden />

        <div className={styles.block}>
          <div className={styles.title}>加盟合作</div>
          <div className={styles.twoCols}>
            <div className={styles.col}>
              {coopLeft.map((t) => (
                <a key={t} className={styles.link} href="#">
                  {t}
                </a>
              ))}
            </div>
            <div className={styles.col}>
              {coopRight.map((t) => (
                <a key={t} className={styles.link} href="#">
                  {t}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.sep} aria-hidden />

        <div className={styles.blockAbout}>
          <div className={styles.title}>关于携程</div>
          <div className={styles.twoCols}>
            <div className={styles.col}>
              {aboutLeft.map((t) => (
                <a key={t} className={styles.link} href="#">
                  {t}
                </a>
              ))}
            </div>
            <div className={styles.col}>
              {aboutRight.map((t) => (
                <a
                  key={t}
                  className={t === '携程热点' ? styles.linkHot : styles.link}
                  href="#"
                >
                  {t}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.sep} aria-hidden />

        <div className={styles.blockContact}>
          <div className={styles.contactLine}>
            境内：<span className={styles.contactStrong}>95010</span>
          </div>
          <div className={styles.contactLine}>或 400-830-6666</div>
          <div className={styles.contactLine}>中国香港：+852-3008-3295</div>
          <div className={styles.contactLine}>中国澳门：+86-21 3406-4888</div>
          <div className={styles.contactLine}>中国台湾：+86-21 3406-4888</div>
          <div className={styles.contactLine}>其他国家和地区：+86-21-3406-4888</div>
        </div>

        <div className={styles.sep} aria-hidden />

        <div className={styles.qr}>
          <img className={styles.qrImg} src={qrDownloadApp} alt="qr" />
          <div className={styles.qrText}>扫码下载携程App</div>
        </div>
      </div>
    </footer>
  )
}

