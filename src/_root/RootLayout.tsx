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
    // 1. Remove md:h-dvh from the main wrapper to allow the document to scroll
    <div className="relative w-full min-h-screen md:flex">
      <Topbar />
      
      {/* 2. Your LeftSidebar needs to be 'sticky' or 'fixed' inside its own component 
          Ensure LeftSidebar has: className="sticky top-0 h-dvh hidden md:block" */}
      <LeftSidebar />

      {/* 3. The main section now scrolls with the body */}
      <section className="flex flex-1 flex-col min-h-screen">
        <Outlet />
      </section>

      <Bottombar />
    </div>
  )
}

export default RootLayout