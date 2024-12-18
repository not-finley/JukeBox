import { bottombarLinks } from "@/constants";
import { Link, useLocation } from "react-router-dom"

const Bottombar = () => {
  const { pathname } = useLocation();
  return (
    <section className="bottom-bar">
      {bottombarLinks.map((link) => {
            const isActive = pathname === link.route;
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
                <p className="tiny-medium text-light-2">{link.label}</p>
              </Link>
            )
          })}
    </section>
  )
}

export default Bottombar