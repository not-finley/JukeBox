import Bottombar from '@/components/shared/Bottombar'
import LeftSidebar from '@/components/shared/LeftSidebar'
import Topbar from '@/components/shared/Topbar'

import { Link, Outlet } from 'react-router-dom'
import { useUserContext } from '@/lib/AuthContext';
import LoaderMusic from '@/components/shared/loaderMusic';

const RootLayout = () => {
    const { isAuthenticated, isLoading } = useUserContext();

    if (!isAuthenticated && !isLoading) {
        return (
            <div className="common-container flex flex-col items-center justify-center min-h-[80vh] gap-6">
                <h1 className="text-3xl font-bold text-white">Welcome to JukeBox</h1>
                <p className="text-gray-400">Please sign in or create an account to continue.</p>
                <div className="flex gap-4">
                    <Link to="/sign-in" className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition">Sign In</Link>
                    <Link to="/sign-up" className="px-4 py-2 border border-gray-600 text-white rounded hover:border-gray-400 transition">Sign Up</Link>
                </div>
            </div>
        );
    }
    
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