import Bottombar from '@/components/shared/Bottombar'
import LeftSidebar from '@/components/shared/LeftSidebar'
import Topbar from '@/components/shared/Topbar'

import { Navigate, Outlet } from 'react-router-dom'
import { useUserContext } from '@/lib/AuthContext';
import LoaderMusic from '@/components/shared/loaderMusic';

const RootLayout = () => {
  const { isAuthenticated, isLoading } = useUserContext();
  
  if (isLoading) return <div className='flex-center'><LoaderMusic/></div>;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
  return (
    <div className="w-full min-h-screen md:flex md:h-dvh">
      <Topbar />
      <LeftSidebar />

       <section className="flex flex-1 min-h-0 element-container md:min-h-screen">
        <Outlet />
      </section>

      <Bottombar />
    </div>
  )
}

export default RootLayout