import PlaceholderImage from '../PlaceholderImage/PlaceholderImage.jsx'
import styles from './BottomBar.module.css'

export default function BottomBar() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.col}>
            <div className={styles.title}>旅游资讯</div>
            <div className={styles.links2}>
              <div className={styles.link}>宾馆索引</div>
              <div className={styles.link}>攻略索引</div>
              <div className={styles.link}>机票索引</div>
              <div className={styles.link}>网站导航</div>
              <div className={styles.link}>旅游索引</div>
              <div className={styles.link}>邮轮索引</div>
              <div className={styles.link}>企业差旅索引</div>
              <div className={styles.link} />
            </div>
          </div>

          <div className={styles.divider} aria-hidden="true" />

          <div className={styles.col}>
            <div className={styles.title}>加盟合作</div>
            <div className={styles.links2}>
              <div className={styles.link}>分销联盟</div>
              <div className={styles.link}>友情链接</div>
              <div className={styles.link}>企业礼品卡采购</div>
              <div className={styles.link}>保险代理</div>
              <div className={styles.link}>代理合作</div>
              <div className={styles.link}>酒店加盟</div>
              <div className={styles.link}>目的地及景区合作</div>
              <div className={styles.link}>更多加盟合作</div>
            </div>
          </div>

          <div className={styles.divider} aria-hidden="true" />

          <div className={styles.col}>
            <div className={styles.title}>关于携程</div>
            <div className={styles.links2}>
              <div className={styles.link}>关于携程</div>
              <div className={styles.link}>
                携程热点<span className={styles.caret} aria-hidden="true" />
              </div>
              <div className={styles.link}>联系我们</div>
              <div className={styles.link}>诚聘英才</div>
              <div className={styles.link}>用户协议</div>
              <div className={styles.link}>隐私政策</div>
              <div className={styles.link}>营业执照</div>
              <div className={styles.link}>安全中心</div>
              <div className={styles.link}>携程内容中心</div>
              <div className={styles.link}>知识产权</div>
              <div className={styles.link}>Trip.com Group</div>
              <div className={styles.link} />
            </div>
          </div>

          <div className={styles.contact}>
            <div className={styles.contactLine}>
              境内：<span className={styles.contactStrong}>95010</span>
            </div>
            <div className={styles.contactLine}>或 400-830-6666</div>
            <div className={styles.contactLine}>中国香港：+852-3008-3295</div>
            <div className={styles.contactLine}>中国澳门：+86-21 3406-4888</div>
            <div className={styles.contactLine}>中国台湾：+86-21 3406-4888</div>
            <div className={styles.contactLine}>其他国家和地区：+86-21-3406-4888</div>
          </div>

          <div className={styles.qr}>
            <PlaceholderImage name="底边栏二维码" width={110} height={110} className={styles.qrImg} />
            <div className={styles.qrText}>扫码下载携程App</div>
          </div>
        </div>
      </div>
    </footer>
  )
}

