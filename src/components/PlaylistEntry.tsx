import { Link } from "react-router-dom";

import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ChevronDown, ChevronRight, Disc, Trash2 } from "lucide-react";

import PlayingVisualizer from "@/components/shared/PlayingVisualizer";
import { GripVertical } from "lucide-react";

import { usePlayerContext } from "@/context/PlayerContext";


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

    if (!isAlbum) {
        return (
            <div className={`grid gap-4 py-2 px-4 rounded-md transition-all group items-center ${isCreator ? "grid-cols-[auto_16px_4fr_3fr_auto]" : "grid-cols-[16px_4fr_3fr]"} hover:bg-white/10`}>
                {isCreator && <div className="text-gray-600 px-1"><GripVertical size={18} /></div>}
                <div className="text-gray-500 text-sm cursor-pointer" onClick={(e) => handlePlayPause(e, index)}>
                    {isCurrent ? <PlayingVisualizer isPaused={!isPlaying} /> : index + 1}
                </div>
                <div className="flex items-center gap-4 overflow-hidden">
                    <img src={item.album_cover_url} className="w-10 h-10 rounded shadow-lg" />
                    <div className="flex flex-col truncate">
                        <Link to={`/song/${item.songId}`} className={`text-sm font-semibold truncate ${isCurrent ? 'text-emerald-500' : 'text-white'}`}>
                            {item.title}
                        </Link>
                        <span className="text-xs text-gray-500">{item?.artist.map((a:any, i:number) => (
                            <Link to={`/artist/${a.artist_id}`} key={a.artist_id} className="hover:text-white">
                            {a.name}
                            {i < item.artist.length - 1 ? ", " : ""}
                            </Link>
                        ))}</span>
                    </div>
                </div>
                <Link to={`/album/${item.albumId}`}className="hidden md:block text-sm text-gray-400 truncate">
                    {item.album.title || "Single"}
                </Link>
                {isCreator && (
                    <button onClick={() => onRemove(item.id)} className="p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                    </button>
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
                onClick={() => setIsOpen(!isOpen)}
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
                            e.stopPropagation(); // VERY IMPORTANT: Prevents the album from opening when deleting
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
                        {item.tracks?.length || 0} TRACKS
                    </span>
                    <div className="text-gray-400">
                        {isOpen ? <ChevronDown size={20} className="text-emerald-500" /> : <ChevronRight size={20} />}
                    </div>
                </div>
            </div>

            {/* --- Nested Tracks Section --- */}
            {isOpen && (
                <div className="bg-black/20 border-t border-white/5 ml-14 mr-4 mb-3 rounded-b-xl animate-in fade-in slide-in-from-top-1 duration-200">
                    {item.tracks?.map((track: any, idx: number) => {
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