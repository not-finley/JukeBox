import { useState } from "react";
import { X, MessageSquare, Bug } from "lucide-react";
import { useUserContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SupportModal = ({ isOpen, onClose }: SupportModalProps) => {
    const { user } = useUserContext();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [supportType, setSupportType] = useState<"question" | "bug">("question");
    const [message, setMessage] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !user) return;

        setLoading(true);

        try {
        // 1. Database record (includes the URL where the user is currently)
        const { error: dbError } = await supabase
            .from('support_tickets')
            .insert([{ 
                user_id: user.accountId, 
                user_email: user.email, 
                type: supportType, 
                message: message,
                page_url: window.location.href 
            }]);

        if (dbError) throw dbError;

        // 2. Call the Edge Function
        await supabase.functions.invoke('discord-support', {
            body: { 
                user: { username: user.username, email: user.email },
                supportType,
                message,
                url: window.location.href
            },
        });

        toast({ title: "Success!", description: "Your feedback has been sent." });
        setMessage("");
        onClose();

        } catch (error: any) {
        toast({ variant: "destructive", title: "Submission failed", description: "Error connecting to support." });
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Help & Support</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
            </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 p-1 bg-black border border-gray-800 rounded-xl">
                <button 
                type="button"
                onClick={() => setSupportType("question")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${supportType === "question" ? "bg-gray-800 text-emerald-500" : "text-gray-500"}`}
                >
                <MessageSquare size={16} /> Question
                </button>
                <button 
                type="button"
                onClick={() => setSupportType("bug")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${supportType === "bug" ? "bg-gray-800 text-red-500" : "text-gray-500"}`}
                >
                <Bug size={16} /> Bug Report
                </button>
            </div>
            <textarea 
                required
                placeholder={supportType === "bug" ? "What's broken? (e.g. 'The play button isn't working on this album')" : "How can we help?"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none h-32 resize-none"
            />
            <button 
                type="submit" 
                disabled={loading || !message.trim()}
                className="w-full bg-emerald-500 text-black font-bold py-3 rounded-lg hover:bg-emerald-400 disabled:opacity-50"
            >
                {loading ? "Sending..." : "Submit"}
            </button>
            </form>
        </div>
        </div>
    );
};

export default SupportModal;