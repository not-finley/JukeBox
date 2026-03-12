import { Link } from "react-router-dom";

import { useState } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ChevronDown, ChevronRight, Disc, Trash2 } from "lucide-react";

import PlayingVisualizer from "@/components/shared/PlayingVisualizer";
import { GripVertical } from "lucide-react";

import { usePlayerContext } from "@/context/PlayerContext";
import { getAlbumTracks } from "@/lib/appwrite/api";


const PlaylistEntry = ({ 
    item, 
    index, 
    isCurrent, 
    isPlaying, 
    onPlay, 
    isCreator, 
    onRemove,
}: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const isAlbum = item.type === 'album';
    const { currentTrack, togglePlay } = usePlayerContext();
    const [localTracks, setLocalTracks] = useState<any[]>(item.tracks || []);
    const [isLoading, setIsLoading] = useState(false);

    const isAlbumCurrent = item.tracks?.some((t: any) => currentTrack?.songId === t.songId);

    const handlePlayPause = (e: React.MouseEvent, itemIndex: number, trackIndex?: number) => {
        e.stopPropagation();
        
        // Determine if we are clicking a nested track or the main header
        const isNestedTrackClick = trackIndex !== undefined;

        if (isNestedTrackClick) {
            // Find the specific track being clicked
            const clickedTrack = item.tracks?.[trackIndex];
            const isThisSpecificTrackPlaying = currentTrack?.songId === clickedTrack?.songId;

            if (isThisSpecificTrackPlaying) {
                togglePlay(); // Pause/Resume current track
            } else {
                onPlay(itemIndex, trackIndex); // Switch to the specific track in the album
            }
        } else {
            // Main Header Logic (Song or Album)
            const isMainItemPlaying = isAlbum ? isAlbumCurrent : isCurrent;
            
            if (isMainItemPlaying) {
                togglePlay(); 
            } else {
                onPlay(itemIndex); 
            }
        }
    };

    const handleAlbumOpen = async () => {
        if (!isOpen && localTracks.length === 0) {
            setIsLoading(true);
            try {
                const tracks = await getAlbumTracks(item.albumId);
                setLocalTracks(tracks);
            } catch (error) {
                console.error("Failed to load tracks", error);
            } finally {
                setIsLoading(false);
            }
        }
        setIsOpen(!isOpen);
    };

    if (!isAlbum) {
        return (
            /* FIX 1: Defined explicit columns. On mobile we use 4 columns, on MD we use 5. 
               The '1fr' or '4fr' column handles the title and is set to shrink. */
            <div className={`grid gap-3 py-2 px-4 rounded-md transition-all group items-center 
                ${isCreator 
                    ? "grid-cols-[20px_24px_1fr_40px] md:grid-cols-[auto_16px_4fr_3fr_auto]" 
                    : "grid-cols-[24px_1fr] md:grid-cols-[16px_4fr_3fr]"} 
                hover:bg-white/10 mb-1`}>
                
                {isCreator && <div className="text-gray-600 px-1 flex-shrink-0"><GripVertical size={18} /></div>}
                
                <div className="text-gray-500 text-sm cursor-pointer flex-shrink-0" onClick={(e) => handlePlayPause(e, index)}>
                    {isCurrent ? <PlayingVisualizer isPaused={!isPlaying} /> : index + 1}
                </div>

                {/* FIX 2: min-w-0 is required for truncate to work inside a grid/flex container */}
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <img src={item.album_cover_url} className="w-10 h-10 rounded shadow-lg flex-shrink-0 object-cover" />
                    <div className="flex flex-col truncate min-w-0">
                        <Link to={`/song/${item.songId}`} className={`text-sm font-semibold truncate ${isCurrent ? 'text-emerald-500' : 'text-white'}`}>
                            {item.title}
                        </Link>
                        <span className="text-xs text-gray-500 truncate">
                            {item?.artist.map((a:any, i:number) => (
                                <Link to={`/artist/${a.artist_id}`} key={a.artist_id} className="hover:text-white">
                                    {a.name}{i < item.artist.length - 1 ? ", " : ""}
                                </Link>
                            ))}
                        </span>
                    </div>
                </div>

                {/* Hidden on mobile, takes up space on desktop */}
                <Link to={`/album/${item.albumId}`} className="hidden md:block text-sm text-gray-400 truncate">
                    {item.album?.title || "Single"}
                </Link>

                {/* FIX 3: Trash button now sits in its own fixed-width column (40px) */}
                {isCreator && (
                    <div className="flex justify-end">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} 
                            className="p-2 text-gray-500 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Nested Album Row
    return (
        <div className="flex flex-col mb-2 rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden group">
            <div 
                className={`grid gap-4 py-3 px-4 items-center hover:bg-white/5 cursor-pointer 
                    ${isCreator 
                        ? "grid-cols-[auto_16px_1fr_auto_auto]" // Added an extra 'auto' for the trash column
                        : "grid-cols-[16px_1fr_auto]"
                    }`}
                onClick={() => handleAlbumOpen()}
            >
                {/* 1. Drag Handle */}
                {isCreator && (
                    <div className="text-gray-600 hover:text-white transition-colors">
                        <GripVertical size={18} />
                    </div>
                )}

                {/* 2. Index */}

                <div className="text-gray-500 text-sm cursor-pointer" onClick={(e) => handlePlayPause(e, index)}>
                    {isAlbumCurrent ? <PlayingVisualizer isPaused={!isPlaying} /> : index + 1}
                </div>
            
                
                {/* 3. Album Identity */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                        <img src={item.album_cover_url} className="w-12 h-12 rounded shadow-lg object-cover" />
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-dark-1">
                            <Disc size={10} className="text-black" />
                        </div>
                    </div>
                    <div className="flex flex-col truncate">
                        <Link 
                            to={`/album/${item.albumId}`} 
                            onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking link
                            className={`text-sm font-bold truncate hover:underline ${isAlbumCurrent ? 'text-emerald-500' : 'text-white'}`}
                        >
                            {item.title}
                        </Link>
                        <span className="text-xs text-gray-500 font-medium">Album • {item?.artist.map((a:any, i:number) => (
                            <Link to={`/artist/${a.artist_id}`} key={a.artist_id} className="hover:text-white">
                            {a.name}
                            {i < item.artist.length - 1 ? ", " : ""}
                            </Link>
                        ))}</span>
                    </div>
                </div>

                {/* 4. Trash Can (Creator only) */}
                {isCreator && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(item.id);
                        }} 
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors md:opacity-0 group-hover:opacity-100"
                        aria-label="Remove album"
                    >
                        <Trash2 size={18} />
                    </button>
                )}

                {/* 5. Tracks Count & Chevron */}
                <div className="flex items-center gap-4 justify-self-end">
                    <span className="text-[10px] text-gray-500 font-black tracking-widest hidden md:block">
                        {item.trackCount || 0} TRACKS
                    </span>
                    <div className="text-gray-400">
                        {isOpen ? <ChevronDown size={20} className="text-emerald-500" /> : <ChevronRight size={20} />}
                    </div>
                </div>
            </div>

            {/* --- Nested Tracks Section --- */}
            {(isOpen || isLoading) && (
                <div className="bg-black/20 border-t border-white/5 ml-14 mr-4 mb-3 rounded-b-xl ...">
                    {isLoading ? (
                        <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
                    ) : localTracks.map((track: any, idx: number) => {
                        const isTrackCurrent = currentTrack?.songId === track.songId;
                        return (
                            <div key={track.songId} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg group/track transition-colors">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="text-gray-500 text-sm cursor-pointer" onClick={(e) => handlePlayPause(e, index, idx)}>
                                        {isTrackCurrent ?  <PlayingVisualizer isPaused={!isPlaying} /> :  <span className="text-[10px] text-gray-600 font-bold w-4">{idx + 1}</span>}
                                    </div>
                                    <Link 
                                        to={`/song/${track.songId}`} 
                                        className={`text-sm truncate font-medium ${isTrackCurrent ? 'text-emerald-500' : 'text-gray-300'} hover:text-emerald-400`}
                                    >
                                        {track.title}
                                    </Link>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={(e) => handlePlayPause(e, index, idx)}
                                    className="opacity-0 group-hover/track:opacity-100 h-8 w-8 p-0 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                >
                                    {isTrackCurrent && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PlaylistEntry;