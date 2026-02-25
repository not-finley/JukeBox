import Bottombar from '@/components/shared/Bottombar'
import LeftSidebar from '@/components/shared/LeftSidebar'
import Topbar from '@/components/shared/Topbar'

import { Outlet } from 'react-router-dom'
import { PreviewPlayer } from '@/components/shared/PreviewPlayer'
import { useUserContext } from '@/lib/AuthContext';
import { usePlayerContext } from '@/context/PlayerContext';
import LoaderMusic from '@/components/shared/loaderMusic';
import { useThemeContext } from '@/context/ThemeContext';


const RootLayout = () => {
  const { isLoading } = useUserContext();
  const { currentTrack } = usePlayerContext();
  const { theme } = useThemeContext();
  
  if (isLoading) return <div className='common-container'><LoaderMusic/></div>;

  return (
    // min-h-dvh ensures the background covers the full screen without being static
    <div className={`relative w-full min-h-dvh md:flex ${theme === 'dark' ? 'bg-dark-1 text-white' : 'bg-white text-slate-900'}`}>
      <Topbar />
      
      <LeftSidebar />

      {/* On mobile, we need to ensure this section doesn't push the footer down */}
      <section className="flex flex-1 flex-col">
        <Outlet />
        {currentTrack && <PreviewPlayer/>}
      </section>


      <Bottombar />
    </div>
  )
}



export default RootLayout