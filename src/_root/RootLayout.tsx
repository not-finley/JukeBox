import Bottombar from '@/components/shared/Bottombar'
import LeftSidebar from '@/components/shared/LeftSidebar'
import Topbar from '@/components/shared/Topbar'

import { Outlet } from 'react-router-dom'

const RootLayout = () => {
  return (
    <div className="w-full h-dvh md:flex overflow-hidden">
      <Topbar />
      <LeftSidebar />

      <section className="flex flex-1 element-container md:h-dvh">
        <Outlet />
      </section>

      <Bottombar />
    </div>
  )
}

export default RootLayout