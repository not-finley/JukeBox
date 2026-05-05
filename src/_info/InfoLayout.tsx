import Footer from "@/components/shared/Footer";
import InfoHeader from "./InfoHeader";
import { Outlet } from "react-router-dom";

const InfoLayout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-dark-1">
            <InfoHeader />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default InfoLayout;