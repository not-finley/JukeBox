import { sidebarLinks } from '@/constants';
import { useUserContext } from '@/lib/AuthContext';
import { useSignOutAccount } from '@/lib/react-query/queriesAndMutations';
import { INavLink } from '@/types';
import { useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../ui/button';

const LeftSidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { mutate: signOut, isSuccess } = useSignOutAccount();
  const { user } = useUserContext();

  useEffect(() => {
    if(isSuccess) {
      navigate(0);
    }}, [isSuccess])
  
  return (
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

        <Link to={`/profile/${user.accountId}`} className="flex gap-3 items-center">
          <img
            src={user.imageUrl || '/assets/images/profile-placeholder.svg'}
            alt="profile"
            className="h-14 w-14 rounded-full"
          />

          <div className="flex flex-col">
            <p className="body-bold">{user.name}</p>
            <p className="small-regular text-light-3">@{user.username}</p>
          </div>
        </Link>
        <ul className="flex flex-col gap-6">
          {sidebarLinks.map((link: INavLink) => {
            const isActive = pathname === link.route;
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
    </nav>
  )
}

export default LeftSidebar