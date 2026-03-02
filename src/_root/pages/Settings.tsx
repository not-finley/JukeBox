import { useState } from "react";
import { Link } from "react-router-dom";
import { useUserContext, } from "@/lib/AuthContext";
import { ChevronLeft, User, Lock, LogOut, Moon, X, HelpCircle} from "lucide-react";
import { useSignOutAccount } from '@/lib/react-query/queriesAndMutations';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { updateUsername } from "@/lib/appwrite/api";
import SupportModal from "@/components/shared/SupportModal";

const SettingsPage = () => {
    const { user, setUser } = useUserContext();
    const { mutate: signOut } = useSignOutAccount();
    const [modalType, setModalType] = useState<"username" | "password"| null>(null);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [newUsername, setNewUsername] = useState(user.username);
    const [isUpdating, setIsUpdating] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const redirectUrl = "https://jukeboxd.ca/reset-password";

    const handleUsernameUpdate = async () => {
        if (newUsername.trim().length < 3) {
            alert("Username too short");
            return;
        }

        setIsUpdating(true);
        try {
            const updatedUser = await updateUsername(user.accountId, newUsername);

            if (updatedUser) {
                setUser((prev: any) => ({ 
                    ...prev, 
                    username: updatedUser.username 
                }));
                setModalType(null);
            }
        } catch (err: any) {
            if (err.code === "23505") {
                toast({
                    title: "Already Taken!",
                    description: "Sorry, that username is already taken. Try something else!",
                });
            } else {
                toast({
                    title: "Error",
                    description: "An unexpected error occurred. Please try again.",
                });
                console.error("Full update error:", err);
            }
        } finally {
            setIsUpdating(false);
        }
    };

    async function handleReset() {

        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: redirectUrl,
        });

        setLoading(false);

        if (error) {
            toast({
                title: "Error",
                description: error.message,
            });
        } else {
            toast({
                title: "Check your inbox",
                description: "Password reset instructions have been sent.",
            });
        }
    }

    return (
        <div className="common-container bg-black min-h-screen w-full text-gray-100 p-6">
            <div className="max-w-2xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <Link to={`/profile/${user.accountId}`} className="p-2 hover:bg-gray-900 rounded-full transition">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight">Settings</h1>
                </div>

                <div className="space-y-10">
                    {/* Section: Account */}
                    <section>
                        <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 px-2">Account</h2>
                        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
                            <div onClick={() => setModalType("username")}>
                                <SettingsItem 
                                    icon={<User size={18}/>} 
                                    label="Change Username" 
                                    description={`Current: @${user.username}`} 
                                />
                            </div>
                            <div onClick={() => setModalType("password")}>
                                <SettingsItem 
                                    icon={<Lock size={18}/>} 
                                    label="Password" 
                                    description="Update your security credentials" 
                                    isLast 
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 px-2">Support</h2>
                        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
                            <div onClick={() => setIsSupportOpen(true)}>
                                <SettingsItem 
                                    icon={<HelpCircle size={18}/>} 
                                    label="Help & Feedback" 
                                    description="Report a bug or ask a question" 
                                    isLast 
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section: Privacy (Static for now) */}
                    <section>
                        <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 px-2">Experience</h2>
                        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
                            <SettingsItem icon={<Moon size={18}/>} label="Appearance" description="Dark mode (Lighter Coming Soon)" />
                            {/* <SettingsItem icon={<Shield size={18}/>} label="Privacy" description="Control who sees your listens" isLast /> */}
                        </div>
                    </section>

                    {/* Dangerous Zone */}
                    <div className="space-y-2">
                        <button 
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 p-4 text-gray-400 hover:bg-gray-900 transition-colors rounded-2xl font-bold"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                        {/* <button className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-red-500/10 transition-colors rounded-2xl font-bold">
                            <Trash size={18} />
                            Delete your account
                        </button> */}
                    </div>
                </div>
            </div>

            {/* Simple Modal Overlay */}
            {modalType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">
                                {modalType === "username" ? "Update Username" : "Update Password"}
                            </h3>
                            <button onClick={() => setModalType(null)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {modalType === "username" && (
                            <div className="space-y-4">
                                <input 
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                                />
                                <button onClick={handleUsernameUpdate} disabled={isUpdating} className="w-full bg-emerald-500 text-black font-bold py-3 rounded-lg hover:bg-emerald-400">
                                    {isUpdating ? "Saving..." : "Save Username"}
                                </button>
                            </div>
                        )}

                        {modalType === "password" && (
                            <div className="text-center py-4">
                                <p className="text-gray-400 mb-6 text-sm">A password reset link will be sent to <b>{user.email}</b>.</p>
                                <button onClick={() => handleReset()} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200">
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <SupportModal 
                isOpen={isSupportOpen} 
                onClose={() => setIsSupportOpen(false)} 
            />
        </div>
    );
};

const SettingsItem = ({ icon, label, description, isLast = false }: any) => (
    <div className={`flex items-center justify-between p-4 hover:bg-gray-800/50 cursor-pointer transition-colors ${!isLast ? 'border-b border-gray-800' : ''}`}>
        <div className="flex items-center gap-4">
            <div className="text-emerald-500">{icon}</div>
            <div>
                <p className="font-bold text-sm">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
        </div>
        <span className="text-gray-600 text-xl">›</span>
    </div>
);

export default SettingsPage;