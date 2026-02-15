import { createContext, useContext, useState, useEffect, useRef } from "react";
import { Track } from "@/types/index";

type PlayerContextType = {
    currentTrack: Track | null;
    setCurrentTrack: React.Dispatch<React.SetStateAction<Track | null>>;
    playTrack: (track: Track) => void;
    isPlaying: boolean;
    togglePlay: () => void;
    progress: number;
    seek: (val: number) => void;
    volume: number;
    setVolume: (val: number) => void;
    queue: Track[]; 
    playAlbum: (tracks: Track[], startIndex?: number) => void;
    skipNext: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [queue, setQueue] = useState<Track[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(0.5);
    
    // We use a ref so the Audio object persists across re-renders
    const audioRef = useRef<HTMLAudioElement>(new Audio());

    useEffect(() => {
        audioRef.current.crossOrigin = "anonymous";
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => {
            if (queue.length > 0) {
                skipNext();
            } else {
                setIsPlaying(false);
            }
        };

        audio.addEventListener("ended", handleEnded);
        return () => audio.removeEventListener("ended", handleEnded);
    }, [queue, currentTrack]);

    // Handle Track Changes & Playback
    useEffect(() => {
        const audio = audioRef.current;

        if (!currentTrack?.preview_url) {
            audio.pause();
            audio.removeAttribute("src");
            audio.load();
            setIsPlaying(false);
            setProgress(0);
            return;
        }

        // FULL cleanup of previous request
        audio.pause();
        audio.removeAttribute("src");
        audio.load();

        // small delay prevents ORB spam detection
        const timeout = setTimeout(() => {
            audio.src = currentTrack.preview_url;
            
            audio.volume = volume;

            const onCanPlay = () => {
                audio.play()
                    .then(() => setIsPlaying(true))
                    .catch(() => setIsPlaying(false));
            };

            audio.addEventListener("canplay", onCanPlay, { once: true });
        }, 120); // magic anti-thrash number

        return () => clearTimeout(timeout);
    }, [currentTrack]);

    useEffect(() => {
    const audio = audioRef.current;

    if (currentTrack && 'mediaSession' in navigator) {
        // 1. Update the Metadata
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTrack.title,
                artist: currentTrack.artist,
                album:  "Unknown Album",
                artwork: [
                    { src: currentTrack.album_cover_url, sizes: '96x96',   type: 'image/png' },
                    { src: currentTrack.album_cover_url, sizes: '128x128', type: 'image/png' },
                    { src: currentTrack.album_cover_url, sizes: '192x192', type: 'image/png' },
                    { src: currentTrack.album_cover_url, sizes: '256x256', type: 'image/png' },
                    { src: currentTrack.album_cover_url, sizes: '384x384', type: 'image/png' },
                    { src: currentTrack.album_cover_url, sizes: '512x512', type: 'image/png' },
                ]
            });

            // 2. Sync playback state
            navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

            // 3. Add Action Handlers (Physical Buttons)
            navigator.mediaSession.setActionHandler('play', () => {
                togglePlay();
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                togglePlay();
            });
            
            // Optional: Seek handlers
            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                const skipTime = details.seekOffset || 10;
                audio.currentTime = Math.max(audio.currentTime - skipTime, 0);
            });
            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                const skipTime = details.seekOffset || 10;
                audio.currentTime = Math.min(audio.currentTime + skipTime, audio.duration);
            });
        }
    }, [currentTrack, isPlaying]);

    // Sync Volume
    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);

    // Progress Tracking & Event Listeners
    useEffect(() => {
        const audio = audioRef.current;
        const updateProgress = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener("timeupdate", updateProgress);
        audio.addEventListener("ended", handleEnded);
        
        return () => {
            audio.removeEventListener("timeupdate", updateProgress);
            audio.removeEventListener("ended", handleEnded);
        };
    }, []);

    const playTrack = (track: Track) => {
        if (currentTrack?.songId === track.songId) {
            togglePlay();
        } else {
            setQueue([]); // Clear queue if playing a single track
            setCurrentTrack(track);
        }
    };

    const playAlbum = (tracks: Track[], startIndex = 0) => {
        if (tracks.length === 0) return;
        setQueue(tracks.slice(startIndex + 1)); // Set the rest of the album as queue
        setCurrentTrack(tracks[startIndex]);
    };

    const skipNext = () => {
        if (queue.length > 0) {
            const nextTrack = queue[0];
            setQueue(prev => prev.slice(1)); // Remove the track we're about to play
            setCurrentTrack(nextTrack);
        }
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            if (currentTrack) {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const seek = (val: number) => {
        const audio = audioRef.current;
        if (audio.duration) {
            audio.currentTime = (val / 100) * audio.duration;
            setProgress(val);
        }
    };

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('nexttrack', queue.length > 0 ? skipNext : null);
        }
    }, [queue]);

    return (
        <PlayerContext.Provider value={{ 
            currentTrack, 
            setCurrentTrack, // Added this so the close button works
            playTrack, 
            isPlaying, 
            togglePlay, 
            progress, 
            seek, 
            volume, 
            setVolume,
            queue,
            playAlbum,
            skipNext
        }}>
            {children}
        </PlayerContext.Provider>
    );
};

// This is the missing piece! 
export const usePlayerContext = () => {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error("usePlayerContext must be used within a PlayerProvider");
    }
    return context;
};