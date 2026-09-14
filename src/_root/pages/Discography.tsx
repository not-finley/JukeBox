import { useEffect, useState } from 'react';
import { AlbumDetails } from '@/types';
import { Link, useParams } from 'react-router-dom';
import { DiscographyGridSkeleton } from '@/components/shared/PageSkeletons';
import { getSpotifyToken, getArtistDiscographyFromSpotify } from '@/lib/integrations/spotify';
import DiscographyItem from '@/components/DiscographyItem';
import { ArrowUp } from 'lucide-react'; // Icon for back to top button

const Discography = () => {
    const { id } = useParams();
    const [discography, setDiscography] = useState<AlbumDetails[] | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "album" | "single">("all");
    const [showTopButton, setShowTopButton] = useState(false);

    const CACHE_KEY = `discog_${id}`;
    const STATE_KEY = `state_${id}`;

    useEffect(() => {
        const fetchArtistDiscog = async () => {
            try {
                setLoading(true);

                // Check Session Storage first
                const cachedData = sessionStorage.getItem(CACHE_KEY);
                const cachedState = sessionStorage.getItem(STATE_KEY);

                if (cachedData) {
                    setDiscography(JSON.parse(cachedData));
                    if (cachedState) {
                        const { filter: savedFilter, scrollY } = JSON.parse(cachedState);
                        setFilter(savedFilter);
                        setTimeout(() => window.scrollTo(0, scrollY), 100);
                    }
                    setLoading(false);
                    return;
                }

                const token = await getSpotifyToken();
                const discog = await getArtistDiscographyFromSpotify(id || "", token);
                const sorted = discog.sort(
                    (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
                );

                setDiscography(sorted);
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(sorted));
            } catch (error) {
                console.error("Error:", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchArtistDiscog();
    }, [id]);

    // Track scroll position to toggle Back to Top button
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowTopButton(true);
            } else {
                setShowTopButton(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const updateAlbumTracks = (albumId: string, tracks: any[]) => {
        setDiscography(prev => {
            if (!prev) return null;
            const updated = prev.map(a => 
                a.albumId === albumId 
                ? { ...a, tracks, isLoaded: true } 
                : a
            );
            
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const handleNavigation = () => {
        const state = {
            filter: filter,
            scrollY: window.scrollY
        };
        sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    };

    const filteredDiscog = discography?.filter(a => {
        if (filter === "all") return true;
        if (filter === "album") return a.album_type === "album";
        if (filter === "single") return a.album_type === "single" || a.album_type === "ep";
        return true;
    });

    if (notFound) {
        return (
            <div className="common-container text-center text-gray-300">
                <h1 className="text-2xl font-semibold mb-2">Discography not found.</h1>
                <Link to={`/artist/${id}`} onClick={handleNavigation} className="text-emerald-400 hover:underline">
                    Back to Artist
                </Link>
            </div>
        );
    }

    return (
        <div className="common-container pb-20 relative">
            <div className="max-w-6xl w-full mx-auto">
                
                {/* Header Banner Section - Centered layout */}
                <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-gray-900 to-black p-6 sm:p-8 border border-white/5 shadow-2xl mb-8 flex flex-col items-center text-center">
                    
                    {/* Back link positioned cleanly or neatly centered */}
                    <Link 
                        to={`/artist/${id}`} 
                        onClick={handleNavigation} 
                        className="text-xs font-bold text-emerald-400 uppercase tracking-widest hover:underline mb-2 transition-colors"
                    >
                        ← Back to Artist
                    </Link>

                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-5">
                        Discography
                    </h1>

                    {/* Centered Filter Buttons */}
                    <div className="flex items-center justify-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                        {["all", "album", "single"].map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t as any)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    filter === t 
                                    ? "bg-emerald-500 text-black shadow-lg" 
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Container */}
                <div className="w-full">
                    {loading && <DiscographyGridSkeleton />}
                    
                    {!loading && filteredDiscog?.length === 0 && (
                        <p className="text-center text-gray-400 py-12 bg-gray-900/40 rounded-2xl border border-white/5 text-sm">
                            No releases found for this filter.
                        </p>
                    )}

                    {!loading && filteredDiscog?.map((album) => (
                        <div key={album.albumId} className="mb-6">
                            <DiscographyItem 
                                album={album} 
                                onUpdate={updateAlbumTracks}
                                handleNavigation={handleNavigation}
                            />
                        </div>
                    ))}
                </div>

            </div>

            {/* Floating Back to Top Button (Visible on mobile/all screens when scrolled down) */}
            {showTopButton && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-11 h-11 rounded-full bg-emerald-500 text-black shadow-2xl border border-white/10 hover:bg-emerald-400 transition-all active:scale-95 animate-fade-in"
                    aria-label="Back to top"
                >
                    <ArrowUp size={20} strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
};

export default Discography;