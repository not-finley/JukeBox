import Bottombar from '@/components/shared/Bottombar'
import LeftSidebar from '@/components/shared/LeftSidebar'
import Topbar from '@/components/shared/Topbar'

import { Outlet } from 'react-router-dom'
import { useUserContext } from '@/lib/AuthContext';
import LoaderMusic from '@/components/shared/loaderMusic';

const RootLayout = () => {
  const { isLoading } = useUserContext();
  
  if (isLoading) return <div className='common-container'><LoaderMusic/></div>;
  return (
    <div className="relative w-full min-h-dvh md:flex bg-dark-1">
      <Topbar />
      <LeftSidebar />

      <section className="flex flex-1 flex-col">
        <Outlet />
      </section>

      <Bottombar />
    </div>
  )
}

export default RootLayout