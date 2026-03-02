import { bottombarLinks } from "@/constants";
import { Link, useLocation } from "react-router-dom"
import { useUserContext } from "@/lib/AuthContext";
import AuthModal from "./AuthModal";
import { useState } from "react";

const Bottombar = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useUserContext();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
    <section className="bottom-bar pb-safe"> 
      <div className="flex-between w-full px-2 py-0.5"> 
        {bottombarLinks.map((link) => {
          const isActive = pathname === link.route;
          
          const iconContent = (
            <img
              width={22}
              src={link.imgURL}
              className={`${isActive && 'invert-white'} transition-all`}
            />
          );

          if (link.authRequired && !isAuthenticated) {
            return (
              <div 
                key={link.label} 
                className="flex-center flex-1 p-2 cursor-pointer" 
                onClick={() => setShowAuthModal(true)}
              >
                {iconContent}
              </div>
            );
          }

          return (
            <Link
              to={link.route}
              key={link.label} 
              className={`${isActive && 'bg-emerald-500 rounded-xl'} flex-center flex-1 flex-col py-2 px-3 transition-all duration-300`}
            >
              {iconContent}
            </Link>
          )
        })}
      </div>
    </section>
    <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}

export default Bottombar