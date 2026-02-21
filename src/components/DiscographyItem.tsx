import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import LoaderMusic from '@/components/shared/loaderMusic';
import { getSpotifyToken } from '@/lib/appwrite/spotify';
import { ChevronDown, ChevronUp } from "lucide-react"; // Optional: for the mobile toggle icon

const DiscographyItem = ({ album, onUpdate, handleNavigation }: { album: any, onUpdate: (id: string, tracks: any[]) => void, handleNavigation: () => void }) => {
    const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '400px' });
    const [loadingTracks, setLoadingTracks] = useState(false);
    const [showTracksMobile, setShowTracksMobile] = useState(false);

    useEffect(() => {
        if (inView && !album.isLoaded && !loadingTracks) {
            fetchTracks();
        }
    }, [inView, album.isLoaded]);

    const fetchTracks = async () => {
        setLoadingTracks(true);
        try {
            const token = await getSpotifyToken();
            const resp = await fetch(`https://api.spotify.com/v1/albums/${album.albumId}/tracks?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (!resp.ok) throw new Error("Failed to fetch tracks");
            
            const data = await resp.json();
            const formattedTracks = data.items.map((t: any) => ({
                songId: t.id,
                title: t.name,
            }));

            onUpdate(album.albumId, formattedTracks);
        } catch (e) {
            console.error("Error fetching tracks:", e);
        } finally {
            setLoadingTracks(false);
        }
    };

    return (
        <div ref={ref} className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-10 bg-zinc-900/60 p-5 md:p-6 rounded-2xl shadow-lg hover:bg-zinc-800/80 transition-all duration-200 mb-6">
            
            {/* Left: Album Cover - Fixed width on desktop to prevent "too wide" bug */}
            <div className="w-full xs:w-2/3 md:w-[240px] lg:w-[300px] flex-shrink-0">
                <Link onClick={handleNavigation} to={`/album/${album.albumId}`} className="group relative block aspect-square">
                    <img 
                        src={album.album_cover_url} 
                        alt={album.title} 
                        className="w-full h-full rounded-xl shadow-lg object-cover group-hover:opacity-90 transition border border-white/5" 
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
                        <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl">
                            View Album
                        </span>
                    </div>
                </Link>
            </div>

            {/* Right: Info Section */}
            <div className="flex flex-col flex-1 w-full min-w-0">
                <div className="text-center md:text-left">
                    <Link onClick={handleNavigation} to={`/album/${album.albumId}`} className="text-2xl lg:text-3xl font-bold text-white hover:text-emerald-400 transition block truncate">
                        {album.title}
                    </Link>
                    
                    {/* Artists List */}
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                        {album.artists?.map((artist: any) => (
                            <span key={artist.id} className="text-[10px] uppercase tracking-wider bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">
                                {artist.name}
                            </span>
                        ))}
                    </div>

                    <p className="text-zinc-500 mt-3 mb-4 font-medium text-sm lg:text-base">
                        {album.release_date?.slice(0, 4)} • {album.album_type === 'album' ? 'LP' : 'Single/EP'}
                    </p>
                </div>

                {/* Tracklist Toggle for Mobile */}
                <button 
                    onClick={() => setShowTracksMobile(!showTracksMobile)}
                    className="md:hidden flex items-center justify-center gap-2 w-full py-2 mb-2 bg-white/5 rounded-lg text-zinc-400 text-sm"
                >
                    {showTracksMobile ? 'Hide Tracks' : 'Show Tracks'} 
                    {showTracksMobile ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>

                {/* Tracklist Container: Hidden on mobile unless toggled, always visible on MD+ */}
                <div className={`${showTracksMobile ? 'block' : 'hidden'} md:block bg-black/30 rounded-xl overflow-hidden`}>
                    <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {loadingTracks ? (
                            <div className="flex justify-center py-6"><LoaderMusic /></div>
                        ) : album.tracks?.length > 0 ? (
                            <ul className="text-zinc-300 text-sm divide-y divide-white/5 w-full">
                                {album.tracks.map((t: any, index: number) => (
                                    <li key={t.songId || index} className="w-full py-2 hover:bg-white/5 px-2 rounded-md transition flex group/track">
                                        <span className="flex-shrink-0 w-6 text-zinc-600 font-mono text-xs mt-1">{index + 1}</span>
                                        <Link onClick={handleNavigation} to={`/song/${t.songId}`} className="flex-1 truncate hover:text-emerald-400 transition text-left pr-4">
                                            {t.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-zinc-600 italic text-xs py-4 text-center">
                                {album.isLoaded ? "No tracks available" : "Loading tracks..."}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscographyItem;