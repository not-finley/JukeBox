import Bottombar from '@/components/shared/Bottombar'
import LeftSidebar from '@/components/shared/LeftSidebar'
import Topbar from '@/components/shared/Topbar'

import { Navigate, Outlet } from 'react-router-dom'
import { useUserContext } from '@/lib/AuthContext';

const RootLayout = () => {
  const { isAuthenticated, isLoading } = useUserContext();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
  return (
    <div className="w-full h-dvh md:flex">
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