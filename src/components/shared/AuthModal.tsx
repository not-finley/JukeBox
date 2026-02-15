import { Link, useLocation } from "react-router-dom";

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const location = useLocation(); // This grabs the current path (e.g., /song/123)

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-dark-2 border border-gray-800 p-8 rounded-2xl max-w-sm w-full text-center flex flex-col gap-6">
                <img src="/assets/images/JBlogoSimple.svg" alt="logo" className="mx-auto" />
                <div>
                    <h2 className="h3-bold">Join the community</h2>
                    <p className="text-light-3 mt-2">You need an account to follow users and write reviews.</p>
                </div>
                
                <div className="flex flex-col gap-3">
                    <Link 
                        to="/sign-up" 
                        state={{ from: location.pathname }}
                        className="shad-button_primary py-3 rounded-lg justify-center"
                    >
                        Create Account
                    </Link>
                    
                    <Link 
                        to="/sign-in" 
                        state={{ from: location.pathname }}
                        className="text-white hover:underline"
                    >
                        Log In
                    </Link>
                    
                    <button onClick={onClose} className="text-light-4 text-sm mt-2">Maybe later</button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;