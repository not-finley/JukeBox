import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { getNotifications, timeAgo } from "@/lib/appwrite/api";
import { supabase } from "@/lib/supabaseClient";


const NotificationDropdown = ({ userId }: { userId: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        const data = await getNotifications(userId);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
    }

    useEffect(() => {
        fetchNotifications();

        const channel = supabase
            .channel(`user:${userId}:notifications`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications', 
                filter: `recipient_id=eq.${userId}` 
            }, () => {
                fetchNotifications(); 
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const handleMarkAsRead = async () => {
        setIsOpen(!isOpen);
        
        if (!isOpen && unreadCount > 0) {
            setUnreadCount(0); 
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('recipient_id', userId);
            
            fetchNotifications();
        }
    };

return (
        <div className="relative">
            <button onClick={handleMarkAsRead} className="relative p-2 bg-gray-800 hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-white">
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-gray-900" />
                )}
            </button>

            {isOpen && (
                <>
                    {/* 1. Mobile Overlay: Closes dropdown when clicking outside on mobile */}
                    <div 
                        className="fixed inset-0 z-40 md:hidden" 
                        onClick={() => setIsOpen(false)} 
                    />

                    <div className="
                        /* Positioning */
                        fixed left-4 right-4 top-20     /* Mobile: Centered with margins */
                        md:absolute md:left-auto md:right-0 md:top-full md:mt-2 /* Desktop: Anchored to button */
                        
                        /* Sizing */
                        md:w-80 max-h-[70vh] md:max-h-96 
                        
                        /* Styling */
                        bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl 
                        overflow-hidden z-50 flex flex-col
                    ">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                            <span className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500">
                                Notifications
                            </span>
                            {unreadCount > 0 && (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>

                        <div className="overflow-y-auto custom-scrollbar flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center flex flex-col items-center gap-2">
                                    <Bell size={24} className="text-gray-800" />
                                    <p className="text-gray-500 text-xs">All caught up!</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div 
                                        key={n.id} 
                                        className={`p-4 border-b border-gray-800/50 flex gap-3 transition active:bg-white/5 ${
                                            n.isRead ? 'bg-transparent' : 'bg-emerald-500/[0.03]'
                                        }`}
                                    >
                                        <img 
                                            src={n.actorAvatar || '/assets/icons/profile-placeholder.svg'} 
                                            className="w-10 h-10 rounded-full object-cover border border-gray-800" 
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-200 leading-normal">
                                                <span className="font-bold text-white">{n.actorUsername}</span> 
                                                {' '}{n.type === 'like' ? 'liked your review' : 'followed you'}
                                            </p>
                                            <p className="text-[10px] text-gray-500 mt-1 font-medium">
                                                {timeAgo(n.createdAt)}
                                            </p>
                                        </div>
                                        {!n.isRead && (
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full self-center shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* Mobile: View all or Close footer */}
                        <div className="p-3 bg-gray-950/50 border-t border-gray-800 md:hidden">
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="w-full py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationDropdown;