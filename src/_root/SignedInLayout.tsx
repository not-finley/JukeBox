import Bottombar from '@/components/shared/Bottombar'
import LeftSidebar from '@/components/shared/LeftSidebar'
import Topbar from '@/components/shared/Topbar'

import { Navigate, Outlet } from 'react-router-dom'
import { PreviewPlayer } from '@/components/shared/PreviewPlayer'
import { useUserContext } from '@/lib/AuthContext';
import { usePlayerContext } from '@/context/PlayerContext';
import { AppShellSkeleton } from '@/components/shared/PageSkeletons';

const SignedInLayout = () => {
  const { isAuthenticated, isLoading } = useUserContext();
  const { currentTrack } = usePlayerContext();
  
  if (isLoading) return <AppShellSkeleton />;
  if (!isAuthenticated) return <Navigate to="/auth-select" replace />;

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-[#050505] text-white">
      
      <LeftSidebar />

      {/* Main Column wrapping both the Topbar and the page content */}
      <main className="flex-1 flex flex-col min-w-0 relative pb-24 md:pb-0">
        
        {/* Topbar is now sticky inside the scrolling column */}
        <div className="md:hidden sticky top-0 z-30 w-full">
          <Topbar />
        </div>

        {/* The Page Content */}
        <div className="flex-1">
          <section className="flex flex-col max-w-7xl mx-auto w-full p-4 md:p-8">
            <Outlet />
            <div className="h-20" /> 
          </section>
        </div>

        {/* Desktop/Mobile Player Wrapper */}
          {currentTrack && (
            <div className="fixed bottom-16 md:bottom-6 left-0 w-full z-40 pointer-events-none">
              <div className="pointer-events-auto">
                  <PreviewPlayer />
              </div>
            </div>
          )}
      </main>

      <div className="md:hidden">
        <Bottombar />
      </div>
    </div>
  )
}

export default SignedInLayout;