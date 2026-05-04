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
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#050505] text-white overflow-hidden">
      {/* Hide Topbar on desktop since LeftSidebar handles it */}
      <div className="md:hidden">
        <Topbar />
      </div>
      
      <LeftSidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* The Content Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <section className="flex flex-col max-w-7xl mx-auto w-full p-4 md:p-8">
            <Outlet />
            {/* Spacer for the floating player */}
            <div className="h-32" /> 
          </section>
        </div>

        {/* Desktop/Mobile Player Wrapper */}
        {currentTrack && (
          <div className="absolute bottom-0 left-0 w-full pb-4 md:pb-6 pointer-events-none">
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



export default SignedInLayout