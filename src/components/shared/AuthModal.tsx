import { Link, useLocation } from "react-router-dom";
import OAuthButtons from "@/components/shared/OAuthButtons";

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const location = useLocation();

    if (!isOpen) return null;

    const returnPath = location.pathname;

    return (
        <div className="fixed inset-0 z-[999] flex-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-dark-2 border border-gray-800 p-8 rounded-2xl max-w-sm w-full text-center flex flex-col gap-6">
                <img src="/assets/images/JBlogoSimple.svg" alt="logo" className="mx-auto" />
                <div>
                    <h2 className="h3-bold">Join the community</h2>
                    <p className="text-light-3 mt-2">You need an account to follow users and write reviews.</p>
                </div>

                <OAuthButtons redirectAfterAuth={returnPath} />

                <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gray-800" />
                    <span className="text-xs text-gray-500 uppercase">or email</span>
                    <div className="h-px flex-1 bg-gray-800" />
                </div>

                <div className="flex flex-col gap-3">
                    <Link
                        to="/sign-up"
                        state={{ from: returnPath }}
                        className="shad-button_primary py-3 rounded-lg justify-center"
                    >
                        Create account
                    </Link>

                    <Link
                        to="/sign-in"
                        state={{ from: returnPath }}
                        className="text-white hover:underline text-sm"
                    >
                        Log in with email
                    </Link>

                    <button type="button" onClick={onClose} className="text-light-4 text-sm mt-2">
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;