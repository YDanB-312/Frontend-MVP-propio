import GovernmentBar from '../../components/GovernmentBar/GovernmentBar'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import s from './LandingLayout.module.css'

export default function LandingLayout({ children }) {
  return (
    <div className={s.layout}>
      <GovernmentBar />
      <Header />
      <main className={s.main}>{children}</main>
      <Footer />
    </div>
  )
}
