import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Edit2, X, Search, Loader2 } from "lucide-react";
import { getSpotifyToken, searchSpotify, SpotifyTrackById } from "@/lib/integrations/spotify";
import { addUpdateRatingAlbum, addUpdateRatingSong, addAlbumComplex, addSongToDatabase, addReviewAlbum, addReviewSong } from "@/lib/supabase/api";
import { useUserContext } from "@/lib/AuthContext";
import StarIcon from "@/components/shared/StarIcon";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

const LogEntryModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { user } = useUserContext();
    
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Handle Keyboard and Body Scroll Lock
    useEffect(() => {
        if (!isOpen) return;

        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';

        const handleVisualResize = () => {
            const viewport = window.visualViewport;
            if (!viewport) return;
            
            // Calculate how much space the keyboard is taking
            const offset = window.innerHeight - viewport.height;
            setKeyboardHeight(offset > 0 ? offset : 0);

            // If keyboard is open, ensure active element is visible
            if (offset > 0 && document.activeElement) {
                setTimeout(() => {
                    document.activeElement?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 100);
            }
        };

        window.visualViewport?.addEventListener("resize", handleVisualResize);
        
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            window.visualViewport?.removeEventListener("resize", handleVisualResize);
        };
    }, [isOpen]);

    // 2. Debounced Search Logic
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
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleRatingClick = (e: React.MouseEvent, value: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const finalValue = x < rect.width / 2 ? value - 0.5 : value;
        setRating(finalValue === rating ? 0 : finalValue);
    };

    const handleSubmit = async () => {
        if (!selectedItem || rating === 0) return;
        setIsSubmitting(true);
        try {
            const token = await getSpotifyToken();
            if (selectedItem.type === 'album') {
                const response = await fetch(`https://api.spotify.com/v1/albums/${selectedItem.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fullAlbumData = await response.json();
                await addAlbumComplex(fullAlbumData);
                await addUpdateRatingAlbum(selectedItem.id, user.accountId, rating);
                if (review.trim()) await addReviewAlbum(selectedItem.id, user.accountId, review);
            } else {
                const fullTrackData = await SpotifyTrackById(selectedItem.id, token);
                await addSongToDatabase(fullTrackData || selectedItem);
                await addUpdateRatingSong(selectedItem.id, user.accountId, rating);
                if (review.trim()) await addReviewSong(selectedItem.id, user.accountId, review);
            }
            onClose();
        } catch (error) {
            toast({ title: "Failed to log entry", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end overflow-hidden">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => {
                    if (keyboardHeight === 0) onClose();
                    else (document.activeElement as HTMLElement)?.blur();
                }} 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
                drag={keyboardHeight === 0 ? "y" : false} // Disable drag when typing
                dragConstraints={{ top: 0 }}
                onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                style={{ 
                    maxHeight: `calc(100dvh - ${keyboardHeight}px - 10px)`,
                    paddingBottom: keyboardHeight > 0 ? 0 : 'env(safe-area-inset-bottom)'
                }}
                className="relative w-full max-w-lg mx-auto bg-dark-1 rounded-t-[32px] shadow-2xl border-t border-white/10 flex flex-col overflow-hidden"
            >
                {/* Drag Handle */}
                <div className="w-full py-4 shrink-0 cursor-grab active:cursor-grabbing">
                    <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto" />
                </div>

                {/* Header */}
                <div className="px-6 flex justify-between items-center mb-4 shrink-0">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Quick Log</h2>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Form Content */}
                <div 
                    ref={scrollContainerRef}
                    className="px-6 pb-8 space-y-6 overflow-y-auto custom-scrollbar flex-1"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {/* Search / Selection Section */}
                    {!selectedItem ? (
                        <div className="relative">
                            <div className="relative w-full mt-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <Input
                                    placeholder="Search songs or albums..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white/10 border-none pl-12 pr-12 h-14 rounded-full text-md focus:bg-white/20 transition-all w-full"
                                />
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="animate-spin text-emerald-500" size={18} />
                                    </div>
                                )}
                            </div>

                            {searchResults.length > 0 && (
                                <div className="mt-2 bg-dark-2 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                                    {searchResults.map((result) => (
                                        <div key={result.id} onClick={() => handleSelect(result)} className="flex items-center gap-4 p-3 hover:bg-white/5 cursor-pointer">
                                            <img src={result.album_cover_url || '/assets/icons/music-placeholder.png'} className="w-12 h-12 rounded-md object-cover" alt="" />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-white text-sm font-bold truncate">{result.title}</span>
                                                <span className="text-gray-500 text-xs truncate">{result.artists?.map((a: any) => a.name).join(", ")}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                            <img src={selectedItem.album_cover_url || '/assets/icons/music-placeholder.png'} className="w-16 h-16 rounded-xl object-cover" alt="" />
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-white font-black truncate text-lg">{selectedItem.title}</span>
                                <span className="text-emerald-500 font-bold text-sm truncate uppercase">{selectedItem.artists?.[0]?.name}</span>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 bg-white/10 rounded-full text-white"><Edit2 size={16} /></button>
                        </div>
                    )}

                    {/* Rating Section */}
                    <div className={`flex flex-col items-center gap-4 transition-all ${!selectedItem ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Your Rating</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => {
                                const fillLevel = rating >= star ? 1 : rating >= star - 0.5 ? 0.5 : 0;
                                return (
                                    <button key={star} onClick={(e) => handleRatingClick(e, star)} className="active:scale-125 transition-transform">
                                        <StarIcon fillLevel={fillLevel} sizeClass="w-11 h-11" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Review Section */}
                    <div className={`transition-all ${!selectedItem ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
                        <Textarea
                            placeholder="Add a review..."
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            className="w-full bg-white/5 border-white/10 rounded-2xl p-4 text-white min-h-[120px] focus:ring-emerald-500/50 resize-none"
                        />
                    </div>

                    <Button
                        disabled={!selectedItem || rating === 0 || isSubmitting}
                        onClick={handleSubmit}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-7 rounded-2xl shadow-lg shadow-emerald-500/10"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <span className="uppercase tracking-widest">Log</span>}
                    </Button>
                </div>
                
                {/* Keyboard Spacer */}
                <div style={{ height: keyboardHeight }} className="transition-[height] duration-100" />
            </motion.div>
        </div>
    );
};

export default LogEntryModal;