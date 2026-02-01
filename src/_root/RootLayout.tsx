import Bottombar from '@/components/shared/Bottombar'
import LeftSidebar from '@/components/shared/LeftSidebar'
import Topbar from '@/components/shared/Topbar'

import { Navigate, Outlet } from 'react-router-dom'
import { useUserContext } from '@/lib/AuthContext';
import LoaderMusic from '@/components/shared/loaderMusic';

const RootLayout = () => {
  const { isAuthenticated, isLoading } = useUserContext();
  
  if (isLoading) return <div className='common-container'><LoaderMusic/></div>;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;

  return (
    // min-h-dvh ensures the background covers the full screen without being static
    <div className="relative w-full min-h-dvh md:flex bg-dark-1">
      <Topbar />
      
      <LeftSidebar />

      {/* On mobile, we need to ensure this section doesn't push the footer down */}
      <section className="flex flex-1 flex-col">
        <Outlet />
      </section>

      <Bottombar />
    </div>
  )
}

export default RootLayout