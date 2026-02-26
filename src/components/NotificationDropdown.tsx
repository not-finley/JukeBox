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
                <div className="absolute right-0 mt-2 w-72 max-h-96 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
                    <div className="p-3 border-b border-gray-800 font-bold text-xs uppercase tracking-widest text-gray-500">Notifications</div>
                    <div className="overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">No notifications yet.</div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} className={`p-4 border-b border-gray-800/50 flex gap-3 transition ${n.isRead ? 'bg-transparent' : 'bg-emerald-500/5'}`}>
                                    <img src={n.actorAvatar} className="w-8 h-8 rounded-full object-cover" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-200">
                                            <span className="font-bold">{n.actorUsername}</span> {n.type === 'like' ? 'liked your review' : 'followed you'}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                                    </div>
                                    {!n.isRead && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full self-center" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;