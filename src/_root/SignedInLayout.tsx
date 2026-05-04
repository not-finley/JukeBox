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
    <div className="flex flex-col md:flex-row h-screen w-full bg-dark-1 overflow-hidden">
      <Topbar />
      
      <LeftSidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <section className="flex flex-col">
          <Outlet />
          <div className="h-24" /> 
        </section>
      </main>

      {/* 3. PLAYER: If active, sits above bottom bar */}
      {currentTrack && <PreviewPlayer />}

      {/* 4. BOTTOMBAR: pb-safe is applied here */}
      <Bottombar />

    </div>
  )
}



export default SignedInLayout