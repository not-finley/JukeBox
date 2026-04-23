import { Link } from 'react-router-dom'
import OAuthButtons from '@/components/shared/OAuthButtons'
import { Mail } from 'lucide-react'

const SelectAuth = () => {
    return (
        <div className="sm:w-420 flex-center flex-col p-6">
            <img src="/assets/images/JBlogoSimple.svg" alt="Logo" />
            <h2 className="h3-bold md:h2-bold pt-5 sm:pt-8 text-center">
                The pulse of your playlist
            </h2>
            <p className="text-light-3 small-medium md:base-regular mt-2 text-center mb-8">
                Review albums, track listens, and see what your friends are spinning.
            </p>

            <div className="flex flex-col gap-4 w-full">
                <OAuthButtons redirectAfterAuth="/" />

                <div className="flex items-center my-1">
                    <div className="h-[1px] flex-1 bg-gray-800"></div>
                    <span className="px-3 text-xs text-gray-500 uppercase">or email</span>
                    <div className="h-[1px] flex-1 bg-gray-800"></div>
                </div>

                <Link
                    to="/sign-in"
                    className="flex-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg border border-gray-700 transition font-semibold text-sm"
                >
                    <Mail className="h-4 w-4" aria-hidden />
                    Sign in with email
                </Link>

                <Link
                    to="/sign-up"
                    className="text-center text-emerald-400 hover:text-emerald-300 text-sm font-medium transition py-1"
                >
                    Create an account with email
                </Link>

                <div className="flex items-center my-2">
                    <div className="h-[1px] flex-1 bg-gray-800"></div>
                    <span className="px-3 text-xs text-gray-500 uppercase">or</span>
                    <div className="h-[1px] flex-1 bg-gray-800"></div>
                </div>

                <Link
                    to="/trending"
                    className="text-light-3 hover:text-light-2 text-sm font-medium transition text-center py-2"
                >
                    Continue as Guest (Preview)
                </Link>
            </div>
        </div>
    )
}

export default SelectAuth