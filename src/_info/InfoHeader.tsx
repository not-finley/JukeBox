import { Link } from "react-router-dom";

const InfoHeader = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-dark-1/80 backdrop-blur-lg">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                
                {/* Logo */}
                <Link to="/" className="flex gap-3 items-center hover:opacity-80 transition">
                    <img
                        src="/assets/images/JBlogoSimple.svg"
                        alt="Jukeboxd logo"
                        width={150}
                        className="h-auto"
                    />
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-3 sm:gap-6">
                    
                    {/* Hidden on mobile */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            to="/about"
                            className="text-sm text-light-3 hover:text-emerald-400 transition-colors"
                        >
                            About
                        </Link>

                        <Link
                            to="/privacy"
                            className="text-sm text-light-3 hover:text-emerald-400 transition-colors"
                        >
                            Privacy
                        </Link>
                    </div>

                    {/* Primary Actions */}
                    <Link
                        to="/sign-up"
                        className="px-4 py-2 rounded-full bg-emerald-500 text-dark-1 font-semibold hover:bg-emerald-400 transition text-sm"
                    >
                        Join Free
                    </Link>

                    <Link
                        to="/sign-in"
                        className="px-4 py-2 rounded-full bg-white text-dark-1 font-semibold hover:bg-gray-200 transition text-sm"
                    >
                        Sign In
                    </Link>
                </nav>
            </div>
        </header>
    );
};

export default InfoHeader;