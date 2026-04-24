import Footer from '@/components/shared/Footer'
import { Outlet } from 'react-router-dom'

const InfoLayout = () => {

  return (
    <div className="h-dvh">
        <Outlet />
        <Footer />
    </div>
  )
}



export default InfoLayout