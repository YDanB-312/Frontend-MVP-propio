import GovernmentBar from '../../components/GovernmentBar/GovernmentBar'
import LandingHeader from '../../components/LandingHeader/LandingHeader'
import Footer from '../../components/Footer/Footer'
import s from './LandingLayout.module.css'

export default function LandingLayout({ children }) {
  return (
    <div className={s.layout}>
      <GovernmentBar />
      <LandingHeader />
      <main className={s.main}>{children}</main>
      <Footer />
    </div>
  )
}
