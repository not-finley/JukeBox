import { X, Play, Pause, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { usePlayerContext } from '@/context/PlayerContext';
import { useNavigate } from 'react-router-dom';

export const PreviewPlayer = () => {
    const { 
        currentTrack, 
        isPlaying, 
        togglePlay, 
        progress, 
        seek, 
        volume, 
        setVolume,
        setCurrentTrack,
        skipNext, 
        queue
    } = usePlayerContext();

    // If no track is playing, don't render the bar at all
    if (!currentTrack) return null;

    const handleClose = () => {
        if (setCurrentTrack) setCurrentTrack(null);
    };

    const navigate = useNavigate();

    const handleTitleClick = () => {
        navigate(`/song/${currentTrack.songId}`);
    };

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="sticky bottom-20 left-4 right-4 z-[100] animate-in slide-in-from-bottom-4 duration-300 hover:cursor-pointer" onClick={handleTitleClick}>
            <div className="bg-gray-900/10 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex flex-col gap-2 shadow-2xl max-w-4xl mx-auto">
                
                <div className="flex items-center gap-4">
                    <img 
                        src={currentTrack.album_cover_url} 
                        className="w-12 h-12 rounded-lg object-cover shadow-lg" 
                        alt={currentTrack.title} 
                    />
                    
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                            Preview Mode
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Play/Pause Button toggles context state */}
                        <button 
                            onClick={(e) => {
                                handleAction(e);
                                togglePlay();
                            }} 
                            className="p-2.5 bg-white text-black rounded-full hover:scale-105 transition-transform active:scale-95"
                        >
                            {isPlaying ? (
                                <Pause size={20} fill="black" />
                            ) : (
                                <Play size={20} fill="black" className="ml-0.5" />
                            )}
                        </button>

                        {queue.length > 0 && (
                                <button 
                                    onClick={(e) => {
                                        handleAction(e);
                                        skipNext();
                                    }}
                                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors active:scale-90"
                                    title="Skip to next"
                                >
                                    <SkipForward size={22} fill="white" />
                                </button>
                        )}

                        <div className="hidden sm:flex items-center gap-2 px-2 border-l border-white/10">
                            <button onClick={(e) => {
                                        handleAction(e);
                                        setVolume(volume === 0 ? 0.5 : 0)
                                    }}>
                                {volume === 0 ? (
                                    <VolumeX size={18} className="text-gray-400" />
                                ) : (
                                    <Volume2 size={18} className="text-gray-400" />
                                )}
                            </button>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.01" 
                                value={volume} 
                                onClick={handleAction}
                                onMouseDown={handleAction} 
                                onChange={(e) => setVolume(Number(e.target.value))}
                                className="w-16 h-1 accent-white cursor-pointer" 
                            />
                        </div>

                        <button 
                        
                            onClick={(e) => {
                                        handleAction(e);
                                        handleClose();
                                    }}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* The Progress Bar Slider - Linked to Context Seek */}
                <div className="relative w-full h-1 group px-1 mb-1">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onClick={handleAction}
                        onMouseDown={handleAction} 
                        onChange={(e) => seek(Number(e.target.value))}
                        className="absolute inset-0 w-full h-1 bg-transparent appearance-none cursor-pointer z-10 accent-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    {/* Visual track (The green bar) */}
                    <div 
                        className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-100" 
                        style={{ width: `${progress}%` }} 
                    />
                    {/* Background track */}
                    <div className="w-full h-1 bg-gray-800 rounded-full" />
                </div>
            </div>
        </div>
    );
};