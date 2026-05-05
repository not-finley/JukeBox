import { Navigate } from "react-router-dom";
import { useUserContext } from "@/lib/AuthContext";
import About from "./About";

const LandingRedirect = () => {
    const { isAuthenticated, isLoading } = useUserContext();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-1 text-light-1">
                Loading...
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/home" replace />;
    }

    return <About />;
};

export default LandingRedirect;