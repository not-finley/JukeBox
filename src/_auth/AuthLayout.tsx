import { Outlet, Navigate } from "react-router-dom";
import Footer from '../components/shared/Footer';

const AuthLayout = () => {
  const isAuthenticated = false;

  return (
    <>
      {isAuthenticated ? (
        <Navigate to="/" />
      ) : (
        /* Change h-dvh to flex-col and overflow-hidden to prevent scrolling */
        <div className="flex flex-col h-dvh overflow-hidden">
          
          {/* Main content area (Form + Side Image) */}
          <div className="flex flex-1 min-h-0"> 
            <section className="flex flex-1 justify-center items-center flex-col py-10 overflow-y-auto">
              <Outlet />
            </section>

            <img
              src="/assets/images/side-image-small.png"
              alt="logo"
              className="hidden xl:block w-1/2 object-cover bg-no-repeat"
              loading="lazy"
            />
          </div>

          {/* Footer inside the flex container at the bottom */}
          <Footer />
        </div>
      )}
    </>
  );
};

export default AuthLayout