import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit2, X, Search, Loader2 } from "lucide-react";
import { getSpotifyToken, searchSpotify, SpotifyTrackById } from "@/lib/appwrite/spotify";
import { addUpdateRatingAlbum, addUpdateRatingSong, addAlbumComplex, addSongToDatabase, addReviewAlbum, addReviewSong } from "@/lib/appwrite/api";
import { useUserContext } from "@/lib/AuthContext";
import StarIcon from "@/components/shared/StarIcon";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

const LogEntryModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { user } = useUserContext();
    
    // Search States (Matched to PlaylistPage)
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Selection & Rating States
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debounced Search Logic (Synced with PlaylistPage)
    useEffect(() => {
        if (searchQuery.trim().length === 0) {
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setIsSearching(true);
            try {
                const token = await getSpotifyToken();
                const { sorted } = await searchSpotify(searchQuery, token);
                // Filter out artists as per PlaylistPage logic
                setSearchResults(sorted.filter(item => item.type !== 'artist'));
            } catch (error) {
                console.error(error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const handleSelect = (item: any) => {
        setSelectedItem(item);
        console.log("Selected item:", item);
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleRatingClick = (e: React.MouseEvent, value: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const finalValue = x < rect.width / 2 ? value - 0.5 : value;
        setRating(finalValue === rating ? 0 : finalValue);
    };

    const handleAddItem = async (searchResultItem: any) => {
        try {
            const token = await getSpotifyToken();
            const type = searchResultItem.type === 'track' ? 'song' : 'album';

            if (type === 'album') {
                const response = await fetch(`https://api.spotify.com/v1/albums/${searchResultItem.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fullAlbumData = await response.json();
                await addAlbumComplex(fullAlbumData);
            } else {
                const fullTrackData = await SpotifyTrackById(searchResultItem.id, token);

                console.log("Full track data:", fullTrackData);
                await addSongToDatabase(fullTrackData || searchResultItem);
            }
        } catch (err) {
            console.error("Error adding item:", err);
            toast({ title: "Failed to add item", variant: "destructive" });
        } 
    };

    const handleSubmit = async () => {
        if (!selectedItem || rating === 0) return;
        setIsSubmitting(true);

        try {
            await handleAddItem(selectedItem);
            if (selectedItem.type === 'album') {
                await addUpdateRatingAlbum(selectedItem.id, user.accountId, rating);
                if (review.trim()) {
                    await addReviewAlbum(selectedItem.id, user.accountId, review);
                }
            } else {
                await addUpdateRatingSong(selectedItem.id, user.accountId, rating);
                if (review.trim()) {
                    await addReviewSong(selectedItem.id, user.accountId, review);
                }
            }

            onClose();
        } catch (error) {
            console.error("Failed to log:", error);
        } finally {
            setIsSubmitting(false);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
                drag="y"
                dragConstraints={{ top: 0 }}
                onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="relative w-full max-w-lg bg-dark-1 rounded-t-[32px] p-6 shadow-2xl border-t border-white/10 touch-none flex flex-col max-h-[90vh]"
            >
                <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto mb-6 shrink-0" />

                <div className="flex justify-between items-center mb-6 shrink-0" onPointerDown={e => e.stopPropagation()}>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Quick Log</h2>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6 overflow-y-auto custom-scrollbar pb-4" onPointerDown={e => e.stopPropagation()}>
                    {/* 1. SELECTION AREA (PlaylistPage Style Search) */}
                    {!selectedItem ? (
                        <div className="relative">
                            <div className="relative w-full p-2">
                                <Search 
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
                                    size={18} 
                                />
                                <Input
                                    autoFocus
                                    placeholder="Search for songs or albums..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white/10 border-none pl-12 pr-12 h-14 rounded-full text-md focus:bg-white/20 transition-all focus-visible:ring-emerald-500/50 w-full"
                                />
                                {isSearching && (
                                    <div className="absolute right-4 top-0 bottom-0 flex items-center">
                                        <Loader2 className="animate-spin text-emerald-500" size={18} />
                                    </div>
                                )}
                            </div>

                            {/* Results Dropdown (PlaylistPage result item style) */}
                            {searchResults.length > 0 && (
                                <div className="mt-2 bg-dark-2 border border-white/10 rounded-2xl overflow-hidden shadow-2xl divide-y divide-white/5">
                                    {searchResults.map((result) => (
                                        <div 
                                            key={result.id} 
                                            onClick={() => handleSelect(result)}
                                            className="flex items-center gap-4 p-3 hover:bg-white/5 cursor-pointer transition-colors group"
                                        >
                                            <div className="relative shrink-0">
                                                <img 
                                                    src={result.album_cover_url || '/assets/icons/music-placeholder.png'} 
                                                    className="w-12 h-12 rounded-md object-cover shadow-md" 
                                                    alt={result.title} 
                                                />
                                                {result.type === 'album' && (
                                                    <div className="absolute -top-1 -left-1 bg-emerald-500 text-[7px] font-black px-1 py-0.5 rounded text-black uppercase tracking-tighter">
                                                        Album
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-white text-sm font-bold truncate group-hover:text-emerald-400 transition-colors">
                                                    {result.title}
                                                </span>
                                                <span className="text-gray-500 text-xs truncate">
                                                    {result.artists?.map((a: any) => a.name).join(", ")}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* SELECTED ITEM (PlaylistPage Header-mini style) */
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 relative overflow-hidden group">
                            <img 
                                src={selectedItem.album_cover_url || '/assets/icons/music-placeholder.png'} 
                                className="w-16 h-16 rounded-xl shadow-lg object-cover" 
                                alt={selectedItem.title} 
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-white font-black truncate text-lg leading-tight">
                                    {selectedItem.title}
                                </span>
                                <span className="text-emerald-500 font-bold text-sm truncate uppercase tracking-wider">
                                    {selectedItem.artists?.map((a: any) => a.name).join(", ")}
                                </span>
                            </div>
                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-90"
                            >
                                <Edit2 size={16} /> 
                            </button>
                        </div>
                    )}

                    {/* 2. RATING AREA (Album Page Style) */}
                    <div className={`flex flex-col items-center gap-4 py-2 transition-all duration-500 ${!selectedItem ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100 blur-0'}`}>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Your Rating</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => {
                                const fillLevel = rating >= star ? 1 : rating >= star - 0.5 ? 0.5 : 0;
                                return (
                                    <button 
                                        key={star} 
                                        onClick={(e) => handleRatingClick(e, star)} 
                                        className="transition-transform active:scale-125 hover:scale-110"
                                    >
                                        <StarIcon fillLevel={fillLevel} sizeClass="w-11 h-11" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. REVIEW TEXT */}
                    <div className={`transition-all duration-500 p-2 ${!selectedItem ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100 blur-0'}`}>
                        <Textarea
                            placeholder="Write your thoughts (optional)..."
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white min-h-[120px] outline-none focus:ring-2 focus:ring-emerald-600/50 resize-none transition-all"
                        />
                    </div>

                    <Button
                        disabled={!selectedItem || rating === 0 || isSubmitting}
                        onClick={handleSubmit}
                        variant="default"
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/5 disabled:text-gray-600 text-black font-black py-4 rounded-2xl transition-all active:scale-[0.98] flex justify-center items-center shadow-lg shadow-emerald-500/20"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <span className="uppercase tracking-widest text-sm">Log</span>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default LogEntryModal;