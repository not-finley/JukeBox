import { Outlet, Navigate } from "react-router-dom";

const AuthLayout = () => {
  const isAuthenticated = false;

  return (
    <>
      {isAuthenticated ? (
        <Navigate to="/" />
      ) : (
        <div className="flex h-dvh">
          <section className="flex flex-1 justify-center items-center flex-col py-10">
            <Outlet />
          </section>

          <img
            src="/assets/images/side-image-low.png"
            alt="logo"
            className="hidden xl:block w-1/2 object-cover bg-no-repeat"
            loading="lazy"
          />
        </div>
      )}
    </>
  )
}

export default AuthLayout