import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="w-full py-1 border-t border-white/10 bg-dark-1 mt-auto">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-12 md:flex-row">
            <p className="text-sm text-light-3">
            © 2026 Jukeboxd. All rights reserved.
            </p>
            <div className="flex gap-4">
            <Link 
                to="/about" 
                className="text-sm text-light-3 hover:text-emerald-500 underline-offset-4 hover:underline"
            >
                About
            </Link>
            <Link 
                to="/privacy" 
                className="text-sm text-light-3 hover:text-emerald-500 underline-offset-4 hover:underline"
            >
                Privacy Policy
            </Link>
            <a 
                href="mailto:finley.harrison@me.com" 
                className="text-sm text-light-3 hover:text-emerald-500 underline-offset-4 hover:underline"
            >
                Contact
            </a>
            </div>
        </div>
        </footer>
    );
};

export default Footer;