import { bottombarLinks } from "@/constants";
import { Link, useLocation } from "react-router-dom";
import { useUserContext } from "@/lib/AuthContext";
import AuthModal from "./AuthModal";
import { useState } from "react";
import { Plus } from "lucide-react"
import { INavLink } from "@/types";
import LogEntryModal from "@/components/shared/LogEntryModal";

const Bottombar = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useUserContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Split links to place the "Plus" in the middle
  const midIndex = Math.floor(bottombarLinks.length / 2);
  const leftLinks = bottombarLinks.slice(0, midIndex);
  const rightLinks = bottombarLinks.slice(midIndex);

  const renderLink = (link : INavLink) => {
    const isActive = pathname === link.route;
    const iconContent = (
      <img
        width={22}
        src={link.imgURL}
        alt={link.label}
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
    );
  };

  return (
    <>
      <section className="fixed bottom-0 left-0 right-0 z-30 bg-black/90 backdrop-blur-lg border-t border-white/10 pb-safe overflow-visible md:hidden">
        {/* Constrain max width and center so it doesn't stretch too wide */}
        <div className="max-w-md mx-auto flex justify-around items-center w-full px-4 relative py-1"> 
          
          {/* Left Side Links */}
          {leftLinks.map(renderLink)}

          {/* Central Floating Action Button (FAB) */}
          <div className="relative flex-1 flex justify-center">
            <button
              onClick={() => setShowLogModal(true)}
              className="absolute -top-10 flex flex-center bg-gray-800 w-14 h-14 rounded-full shadow-lg border-4 border-dark-2 transition-transform active:scale-90"
            >
              <Plus size={24} className="text-white" />
            </button>
            <div className="h-2 w-2" />
          </div>

          {/* Right Side Links */}
          {rightLinks.map(renderLink)}
          
        </div>
      </section>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <LogEntryModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} />
    </>
  );
};

export default Bottombar;