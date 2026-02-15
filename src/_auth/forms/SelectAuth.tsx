import { Link } from 'react-router-dom'

const SelectAuth = () => {
    return (
        <div className="sm:w-420 flex-center flex-col p-6">
            <img src="/assets/images/JBlogoSimple.svg" alt="Logo" />
            <h2 className="h3-bold md:h2-bold pt-5 sm:pt-8 text-center">
                The pulse of your playlist
            </h2>
            <p className="text-light-3 small-medium md:base-regular mt-2 text-center mb-10">
                Review albums, track listens, and see what your friends are spinning.
            </p>

            <div className="flex flex-col gap-4 w-full">
                {/* Primary Action: Sign In */}
                <Link 
                    to="/sign-in" 
                    className="shad-button_primary py-6 flex-center rounded-lg font-semibold"
                >
                    Sign In
                </Link>

                {/* Secondary Action: Sign Up */}
                <Link 
                    to="/sign-up" 
                    className="bg-gray-800 hover:bg-gray-700 text-white py-3 flex-center rounded-lg border border-gray-700 transition"
                >
                    Create an Account
                </Link>

                {/* Divider */}
                <div className="flex items-center my-2">
                    <div className="h-[1px] flex-1 bg-gray-800"></div>
                    <span className="px-3 text-xs text-gray-500 uppercase">or</span>
                    <div className="h-[1px] flex-1 bg-gray-800"></div>
                </div>

                {/* Preview Action: Continue without account */}
                <Link 
                    to="/trending" 
                    className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition text-center py-2"
                >
                    Continue as Guest (Preview)
                </Link>
            </div>
        </div>
    )
}

export default SelectAuth