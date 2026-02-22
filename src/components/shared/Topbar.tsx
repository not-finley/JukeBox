import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useSignOutAccount } from '@/lib/react-query/queriesAndMutations';
import defaultAvatar from "/assets/icons/profile-placeholder.svg"; 
import { useUserContext } from '@/lib/AuthContext';

const Topbar = () => {
    const navigate = useNavigate();
    const { mutate: signOut, isSuccess } = useSignOutAccount();
    const { user, isAuthenticated } = useUserContext();

    useEffect(() => {
        if(isSuccess) {
            navigate(0);
        }
    }, [isSuccess])

    return (
        <section className="topbar">
            <div className="flex-between py-4 px-5">
                <Link to="/" className="flex gap-3 items-center">
                    <img
                        src="/assets/images/JBlogoSimple.svg"
                        alt="logo"
                        width={130}
                        height={325}
                        
                    />
                </Link>
                {isAuthenticated ? (
                    <div className="flex gap-4">
                        <Button variant="ghost" className="w-14 shad-button_ghost" onClick={() => signOut()}>
                            <img 
                                src="/assets/icons/leave.svg"
                                alt="logout"
                            />
                        </Button>
                        <Link to={`/profile/${user.accountId}`} className="flex-center gap-3">
                            <img
                                src={user.imageUrl || defaultAvatar}
                                alt="profile"
                                className="h-8 w-8 rounded-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (target.src !== window.location.origin + "/assets/icons/profile-placeholder.svg") {
                                        target.src = "/assets/icons/profile-placeholder.svg";
                                    }
                                }}
                            />
                        </Link>
                    </div> ) : 
                    (<Link to="/sign-in" className="flex items-center gap-3 p-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-600/20 transition">
                        <img src={defaultAvatar} className="h-6 w-6 opacity-50" alt="default" />
                        <p className="text-emerald-500 font-semibold">Sign in to Join</p>
                    </Link>)}
            </div>
        </section>
    )
}

export default Topbar