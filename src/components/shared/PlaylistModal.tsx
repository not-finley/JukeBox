import { useEffect, useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { getPlaylists, addItemToPlaylist } from "@/lib/appwrite/api";
import { useUserContext } from "@/lib/AuthContext";
import LoaderMusic from "./loaderMusic";
import { Plus, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: string;
    type: "song" | "album";
}

const PlaylistModal = ({ isOpen, onClose, itemId, type }: PlaylistModalProps) => {
    const { user } = useUserContext();
    const { toast } = useToast();
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlaylists = async () => {
            if (!user.accountId || !isOpen) return;
            setLoading(true);
            try {
                const data = await getPlaylists(user.accountId);
                setPlaylists(data);
            } catch (error) {
                console.error("Error fetching playlists", error);
                toast({ title: "Error fetching playlists", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchPlaylists();
    }, [user.accountId, isOpen, toast]);

    const handleAdd = async (playlistId: string, type: 'song' | 'album', currentCount: number) => {
        try {
            console.log("adding to playlist:", playlistId)
            await addItemToPlaylist(playlistId, itemId, type, currentCount);
            
            toast({ 
                title: "Added to playlist!",
                description: type.charAt(0).toUpperCase() + type.slice(1) + " added to the end of the list." 
            });
            onClose();
        } catch (error) {
            console.error("Add to playlist error:", error);
            toast({ 
                title: "Failed to add " + type, 
                description: "Could not add at this time.",
                variant: "destructive" 
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-md shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">Add to Playlist</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto mt-4 pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="py-12 flex justify-center"><LoaderMusic /></div>
                    ) : playlists.length > 0 ? (
                        playlists.map((playlist) => (
                            <button
                                key={playlist.$id}
                                onClick={() => handleAdd(playlist.playlistId, type, playlist.songCount + playlist.albumCount)}
                                className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-all duration-200 text-left group active:scale-[0.98]"
                            >
                                {/* Playlist Cover with Fallback */}
                                <div className="w-14 h-14 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/5 group-hover:border-emerald-500/30">
                                    {playlist.coverUrl ? (
                                        <img 
                                            src={playlist.coverUrl} 
                                            alt={playlist.name} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Music className="text-gray-500" size={24} />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-100 truncate group-hover:text-emerald-400 transition-colors">
                                        {playlist.name}
                                    </p>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                                        {playlist.albumCount > 0 ? (
                                        <>
                                            {playlist.albumCount} {playlist.albumCount === 1 ? 'album' : 'albums'}, {playlist.totalTracks} tracks
                                        </>
                                    ) : (
                                        <>
                                            {playlist.totalTracks} {playlist.totalTracks === 1 ? 'track' : 'tracks'}
                                        </>
                                    )}
                                    </p>
                                </div>

                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-emerald-500/20 transition-colors">
                                    <Plus size={18} className="text-gray-400 group-hover:text-emerald-500" />
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-10 px-6">
                            <p className="text-gray-400 mb-4">No playlists found.</p>
                            <p className="text-sm text-gray-500">Go to your library to create your first playlist!</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PlaylistModal;