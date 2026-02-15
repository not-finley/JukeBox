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
    <section className="bottom-bar">
      {bottombarLinks.map((link) => {
            const isActive = pathname === link.route;
            if (link.authRequired && !isAuthenticated) return (
              <div key={link.label} className={`bottombar-link group hover:cursor-pointer`} onClick={() => setShowAuthModal(true)}>
                <div className="flex flex-col items-center p-2">
                  <img
                    width={25}
                    src={link.imgURL}
                    className={`${isActive && 'invert-white'}`}
                  />
                </div>
              </div>
            );
            return (
              <Link
                to={link.route}
                key={link.label} className={`${isActive && 'bg-emerald-500 rounded-[10px]'} flex-center flex-col gap-1 p-2 transition`}
              >
                <img
                  width={25}
                  src={link.imgURL}
                  className={`${isActive && 'invert-white'}`}
                />
              </Link>
            )
          })}
    </section>
    <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}

export default Bottombar