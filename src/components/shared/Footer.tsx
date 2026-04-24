import { Link } from "react-router-dom";
import { Coffee } from "lucide-react";

const Footer = () => {
    return (
        <footer className="w-full py-4 border-t border-white/10 bg-dark-1 mt-auto">
        <div className="container flex flex-col items-center gap-4 md:flex-row md:justify-between md:h-12">
            
            {/* Copyright - First on mobile, left on desktop */}
            <p className="text-xs text-light-3 order-2 md:order-1">
            © 2026 Jukeboxd. Built by Finley.
            </p>

            {/* Links Group - Centered on mobile, right on desktop */}
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 order-1 md:order-2">
            <Link 
                to="/about" 
                className="text-xs font-medium text-light-3 hover:text-emerald-500 transition-colors"
            >
                About
            </Link>
            <Link 
                to="/privacy" 
                className="text-xs font-medium text-light-3 hover:text-emerald-500 transition-colors"
            >
                Privacy
            </Link>
            <a 
                href="mailto:finley.harrison@me.com" 
                className="text-xs font-medium text-light-3 hover:text-emerald-500 transition-colors"
            >
                Contact
            </a>
            
            {/* Buy Me A Coffee - Styled as a subtle button on mobile */}
            <a 
                href="https://buymeacoffee.com/notfinley" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-all group"
            >
                <Coffee size={14} className="group-hover:animate-bounce" />
                <span>Support</span>
            </a>
            </div>
        </div>
        </footer>
    );
};

export default Footer;