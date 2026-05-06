import { Link } from "react-router-dom";
import { useUserContext } from '@/lib/AuthContext';
import { useSignOutAccount } from '@/lib/react-query/queriesAndMutations';
import defaultAvatar from "/assets/icons/profile-placeholder.svg";
import { LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";

const InfoHeader = () => {
    const { user, isAuthenticated } = useUserContext();
    const { mutate: signOut } = useSignOutAccount();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-dark-1/80 backdrop-blur-lg">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                
                {/* Logo */}
                <Link to="/" className="flex gap-3 items-center hover:opacity-80 transition">
                    <img
                        src="/assets/images/JBlogoSimple.svg"
                        alt="Jukeboxd logo"
                        width={150}
                        className="h-auto"
                    />
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-3 sm:gap-6">
                    
                    {/* Hidden on mobile */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            to="/about"
                            className="text-sm text-light-3 hover:text-emerald-400 transition-colors"
                        >
                            About
                        </Link>

                        <Link
                            to="/privacy"
                            className="text-sm text-light-3 hover:text-emerald-400 transition-colors"
                        >
                            Privacy
                        </Link>
                    </div>

                    {/* Auth Conditional Rendering */}
                    {isAuthenticated ? (
                        <div className="flex items-center gap-3">
                            {/* Logout - subtle version for the info header */}
                            <Button 
                                variant="ghost" 
                                className="hidden sm:flex h-9 w-9 p-0 hover:bg-red-500/10 rounded-full transition group" 
                                onClick={() => signOut()}
                            >
                                <LogOut size={18} className="text-gray-400 group-hover:text-red-500" />
                            </Button>

                            {/* User Profile */}
                            <Link 
                                to={`/profile/${user.accountId}`} 
                                className="p-0.5 rounded-full border-2 border-transparent hover:border-emerald-500 transition active:scale-90"
                            >
                                <img
                                    src={user.imageUrl || defaultAvatar}
                                    alt="profile"
                                    className="h-9 w-9 rounded-full object-cover border border-white/10"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = defaultAvatar;
                                    }}
                                />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/sign-up"
                                className="px-4 py-2 rounded-full bg-emerald-500 text-dark-1 font-semibold hover:bg-emerald-400 transition text-sm"
                            >
                                Join Free
                            </Link>

                            <Link
                                to="/sign-in"
                                className="px-4 py-2 rounded-full bg-white text-dark-1 font-semibold hover:bg-gray-200 transition text-sm"
                            >
                                Sign In
                            </Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default InfoHeader;