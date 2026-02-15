import { sidebarLinks } from '@/constants';
import { useUserContext } from '@/lib/AuthContext';
import { useSignOutAccount } from '@/lib/react-query/queriesAndMutations';
import { INavLink } from '@/types';
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import defaultAvatar from "/assets/icons/profile-placeholder.svg"; 
import { Button } from '../ui/button';
import  AuthModal from './AuthModal';

const LeftSidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { mutate: signOut, isSuccess } = useSignOutAccount();
  const { user, isAuthenticated } = useUserContext();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if(isSuccess) {
      navigate(0);
    }}, [isSuccess])
  
  return (
    <>
    <nav className="leftsidebar">
      <div className="flex flex-col gap-11">
        <Link to="/" className="flex gap-3 items-center">
          <img
            src="/assets/images/JBlogoSimple.svg"
            alt="logo"
            width={200}
            height={36}
          />
        </Link>

          {isAuthenticated ? (
            <Link to={`/profile/${user.accountId}`} className="flex gap-3 items-center">
              <img
                src={user.imageUrl || defaultAvatar}
                alt="profile"
                className="h-14 w-14 rounded-full object-cover"
              />
              <div className="flex flex-col text-white">
                <p className="body-bold">{user.name}</p>
                <p className="small-regular text-light-3">@{user.username}</p>
              </div>
            </Link>
          ) : (
            /* GUEST: Show Sign In Button */
            <Link to="/sign-in" className="flex items-center gap-3 p-4 bg-emerald-600/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-600/20 transition">
              <img src={defaultAvatar} className="h-10 w-10 opacity-50" alt="default" />
              <p className="text-emerald-500 font-semibold">Sign in to Join</p>
            </Link>
          )}
        <ul className="flex flex-col gap-6">
          {sidebarLinks.map((link: INavLink) => {
            const isActive = pathname === link.route;
            if (link.authRequired && !isAuthenticated) return (
              <li key={link.label} className={`leftsidebar-link group hover:cursor-pointer`} 
                onClick={() => {
                  if (!isAuthenticated) {
                    setShowAuthModal(true);
                  }
                }}
              >
                <div className="flex gap-4 items-center p-4">
                  <img
                    width={30}
                    src={link.imgURL}
                    className={`group-hover:invert-white ${isActive && 'invert-white'}`}
                  />
                  {link.label}
                </div>
              </li>
            )
            return (
              <li key={link.label} className={`leftsidebar-link group ${isActive && 'bg-emerald-500'}`}>
                <NavLink
                  to={link.route}
                  className="flex gap-4 items-center p-4"
                >
                  <img
                    width={30}
                    src={link.imgURL}
                    className={`group-hover:invert-white ${isActive && 'invert-white'}`}
                  />
                  {link.label}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>
        {isAuthenticated && (
      <Button 
        variant="ghost" 
        className="w-14 shad-button_ghost" 
        onClick={() => signOut()}>
          <img 
              src="/assets/icons/leave.svg"
              alt="logout"
          />
          <p className="small-medium lg:base-medium">Logout</p>
      </Button>
        )}
        
    </nav>
    <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}

export default LeftSidebar