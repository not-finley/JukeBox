import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { DiscographyTracksSkeleton } from '@/components/shared/PageSkeletons';
import { getSpotifyToken } from '@/lib/integrations/spotify';
import { ChevronDown, ChevronUp } from "lucide-react";

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
        <div ref={ref} className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8 bg-gray-900/40 p-5 md:p-6 rounded-2xl shadow-xl border border-white/5 hover:bg-gray-900/60 hover:border-white/10 transition-all duration-300 backdrop-blur-md mb-6">
            
            {/* Left: Album Cover */}
            <div className="w-full max-w-[220px] md:w-[220px] lg:w-[260px] flex-shrink-0">
                <Link onClick={handleNavigation} to={`/album/${album.albumId}`} className="group relative block aspect-square">
                    <img 
                        src={album.album_cover_url} 
                        alt={album.title} 
                        className="w-full h-full rounded-xl shadow-2xl object-cover border border-white/10 group-hover:border-emerald-500/50 transition-all" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-xl backdrop-blur-xs">
                        <span className="bg-emerald-500 text-black text-xs font-bold px-4 py-2 rounded-xl shadow-lg uppercase tracking-wider">
                            View Album
                        </span>
                    </div>
                </Link>
            </div>

            {/* Right: Info Section */}
            <div className="flex flex-col flex-1 w-full min-w-0">
                <div className="text-center md:text-left">
                    <Link onClick={handleNavigation} to={`/album/${album.albumId}`} className="text-2xl lg:text-3xl font-black text-white hover:text-emerald-400 transition-colors block truncate tracking-tight">
                        {album.title}
                    </Link>
                    
                    {/* Release metadata & Type */}
                    <p className="text-gray-400 mt-1.5 font-medium text-xs sm:text-sm uppercase tracking-wider">
                        {album.release_date?.slice(0, 4)} • <span className="text-emerald-400 font-bold">{album.album_type === 'album' ? 'LP Album' : 'Single / EP'}</span>
                    </p>

                    {/* Artists List Pills */}
                    {album.artists?.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 justify-center md:justify-start mt-3">
                            {album.artists.map((artist: any) => (
                                <span key={artist.id} className="text-[10px] uppercase font-bold tracking-wider bg-black/40 text-gray-300 px-2.5 py-1 rounded-lg border border-white/5">
                                    {artist.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tracklist Toggle for Mobile */}
                <button 
                    onClick={() => setShowTracksMobile(!showTracksMobile)}
                    className="md:hidden flex items-center justify-center gap-2 w-full py-2.5 mt-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gray-300 text-xs font-bold uppercase tracking-wider transition-all"
                >
                    {showTracksMobile ? 'Hide Tracks' : 'Show Tracks'} 
                    {showTracksMobile ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>

                {/* Tracklist Container */}
                <div className={`${showTracksMobile ? 'block' : 'hidden'} md:block bg-black/40 border border-white/5 rounded-xl overflow-hidden mt-4`}>
                    <div className="p-2 max-h-[260px] overflow-y-auto custom-scrollbar">
                        {loadingTracks ? (
                            <DiscographyTracksSkeleton />
                        ) : album.tracks?.length > 0 ? (
                            <ul className="text-gray-200 text-sm divide-y divide-white/5 w-full">
                                {album.tracks.map((t: any, index: number) => (
                                    <li key={t.songId || index} className="w-full py-2 hover:bg-white/5 px-2.5 rounded-lg transition-colors flex items-center group/track">
                                        <span className="flex-shrink-0 w-6 text-gray-500 font-mono text-xs">{index + 1}</span>
                                        <Link onClick={handleNavigation} to={`/song/${t.songId}`} className="flex-1 truncate hover:text-emerald-400 transition-colors text-left pr-4 text-xs sm:text-sm font-medium">
                                            {t.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic text-xs py-4 text-center">
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