import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useSignOutAccount } from '@/lib/react-query/queriesAndMutations';
import defaultAvatar from "/assets/icons/profile-placeholder.svg"; 
import { useUserContext } from '@/lib/AuthContext';
import { Bug, LogOut } from 'lucide-react'; 
import SupportModal from './SupportModal';

const Topbar = () => {
    const navigate = useNavigate();
    const { mutate: signOut, isSuccess } = useSignOutAccount();
    const { user, isAuthenticated } = useUserContext();
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    useEffect(() => {
        if(isSuccess) {
            navigate(0);
        }
    }, [isSuccess]);

    return (
        <>
        <section className="topbar sticky top-0 z-30 w-full bg-black/80 backdrop-blur-md border-b border-white/5">
            <div className="flex justify-between items-center py-3 px-5">
                {/* Logo */}
                <Link to="/" className="flex gap-3 items-center hover:opacity-80 transition">
                    <img
                        src="/assets/images/JBlogoSimple.svg"
                        alt="logo"
                        width={110} 
                        className="h-auto"
                    />
                </Link>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                    {isAuthenticated ? (
                        <>
                            <div className="flex items-center gap-1 bg-white/5 rounded-full px-1 py-1 border border-white/5">
                                {/* Support Button */}
                                <Button 
                                    variant="ghost" 
                                    className="h-9 w-9 p-0 hover:bg-emerald-500/10 rounded-full transition group" 
                                    onClick={() => setIsSupportOpen(true)}
                                    title="Report a bug"
                                >
                                    <Bug size={18} className="text-emerald-500/70 group-hover:text-emerald-500" />
                                </Button>
                                
                                {/* Logout Button */}
                                <Button 
                                    variant="ghost" 
                                    className="h-9 w-9 p-0 hover:bg-red-500/10 rounded-full transition group" 
                                    onClick={() => signOut()}
                                    title="Logout"
                                >
                                    <LogOut size={18} className="text-gray-400 group-hover:text-red-500" />
                                </Button>
                            </div>

                            {/* Profile Link - Slightly separated */}
                            <Link 
                                to={`/profile/${user.accountId}`} 
                                className="ml-1 p-0.5 rounded-full border-2 border-transparent hover:border-emerald-500 transition active:scale-90"
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
                        </> 
                    ) : (
                        <Link 
                            to="/sign-in" 
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black text-sm font-bold rounded-full hover:bg-emerald-400 transition"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>

        </section>

        <SupportModal 
                isOpen={isSupportOpen} 
                onClose={() => setIsSupportOpen(false)} 
            />
        </>
    );
};

export default Topbar;