import { Outlet, Navigate } from "react-router-dom";
import Footer from '../components/shared/Footer';

const AuthLayout = () => {
  const isAuthenticated = false;

  return (
    <>
      {isAuthenticated ? (
        <Navigate to="/home" replace />
      ) : (
        /* Use 100dvh to prevent mobile address bar clipping/layout shifts */
        <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-[#050505] text-white">
          
          {/* Main content split wrapper - min-h-0 is essential for nested flex scrolling */}
          <div className="flex flex-1 min-h-0 w-full"> 
            
            {/* Scrollable form container with mobile overscroll protection */}
            <section className="flex flex-1 justify-center items-center flex-col p-4 sm:p-6 overflow-y-auto overscroll-y-none custom-scrollbar">
              <div className="w-full max-w-md my-auto">
                <Outlet />
              </div>
            </section>

            {/* Desktop side image preview */}
            <img
              src="/assets/images/side-image-small.png"
              alt="logo"
              className="hidden xl:block w-1/2 object-cover bg-no-repeat"
              loading="lazy"
            />
          </div>

          <Footer />
        </div>
      )}
    </>
  );
};

export default AuthLayout;