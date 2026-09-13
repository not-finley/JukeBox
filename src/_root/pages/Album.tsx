import { addAlbumComplex, addListenedAlbum, addUpdateRatingAlbum, addUpdateRatingSong, deleteRatingAlbum, deleteRatingSong, getAlbumDetailsById, getAlbumTrackRatings, getAllRatingsOfAlbum, getRatingAlbum, hasListenedAlbum, removeListenedAlbum } from '@/lib/supabase/api';
import { AlbumDetails, Track } from '@/types';
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { getSpotifyToken, SpotifyAlbumById } from '@/lib/integrations/spotify';
import { AlbumDetailSkeleton } from '@/components/shared/PageSkeletons';
import { useUserContext } from '@/lib/AuthContext';
import { FaSpotify } from "react-icons/fa";
import ReviewItem from '@/components/ReviewItem';
import { Play, Pause, Plus } from 'lucide-react';
import { usePlayerContext } from '@/context/PlayerContext';
import PlayingVisualizer from '@/components/shared/PlayingVisualizer';
import AuthModal from '@/components/shared/AuthModal';
import PlaylistModal from "@/components/shared/PlaylistModal"
import Suggestions from '@/components/Suggestions';
import StarIcon from '@/components/shared/StarIcon';
import NotFound from '@/components/shared/NotFound';


const Album = () => {
    const { id } = useParams();
    const { user, isAuthenticated } = useUserContext();
    const [album, setAlbum] = useState<AlbumDetails | null>(null);
    const [notFound, setNotFound] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [listened, setListened] = useState(true);
    const [globalRatings, setGlobalRatings] = useState<{ rating: number; count: number }[]>([]);
    const [globalAverage, setGlobalAverage] = useState(0);
    const [globalTotal, setGlobalTotal] = useState(0);
    const [songRatings, setSongRatings] = useState<number[]>([]);
    const { playAlbum, currentTrack, isPlaying, togglePlay } = usePlayerContext();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);


    const addAlbum = async () => {
        try {
            const spotifyToken: string = await getSpotifyToken();
            const spotifyAlbum = await SpotifyAlbumById(id || "", spotifyToken);
            if (!spotifyAlbum) {
                setNotFound(true);
                return;
            }

            await addAlbumComplex(spotifyAlbum);
            const fetchedArtist = await getAlbumDetailsById(id || "");
            setAlbum(fetchedArtist);
        }
        catch (error) {
            setNotFound(true);
        }
    }


    const handleRating = async (e: React.MouseEvent<HTMLButtonElement>, value: number) => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left; 
        const finalValue = x < rect.width / 2 ? value - 0.5 : value;

        if (finalValue == rating) {
            setRating(0);
            await deleteRatingAlbum(id ? id : '', user.accountId)
        } else {
            setRating(finalValue);
            await addUpdateRatingAlbum(id ? id : '', user.accountId, finalValue);
            setListened(true);
        }

        fetchGlobalRaiting();
    };

    const addUpdateRatingAlbumlocal = async () => {
        const num = await getRatingAlbum(id ? id : '', user.accountId);
        setRating(num);
    }


    const handleSongRating = async (e: React.MouseEvent<HTMLButtonElement>, value: number, trackIndex: number) => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left; 
        const finalValue = x < rect.width / 2 ? value - 0.5 : value;

        let newValue = finalValue;
        
        if (finalValue === songRatings[trackIndex]) {
            newValue = 0;
        }

        const newRatings = [...songRatings];
        newRatings[trackIndex] = newValue;
        setSongRatings(newRatings);

        if (newValue === 0) {
            await deleteRatingSong(album?.tracks[trackIndex].songId || "", user.accountId);
        } else {
            await addUpdateRatingSong(album?.tracks[trackIndex].songId || "", user.accountId, newValue);
        }
    };

    const handleAddToPlaylist = () => {
        if (!isAuthenticated) {
        setShowAuthModal(true);
        return;
        }
        setShowPlaylistModal(true);
    };


    const fetchGlobalRaiting = async () => {
        const { counts, average, total } = await getAllRatingsOfAlbum(id || '');

        setGlobalRatings(counts);
        setGlobalAverage(average);
        setGlobalTotal(total);
    };


    const fetchAlbum = async () => {
        try {
            const fetchedAlbum = await getAlbumDetailsById(id || "");
            if (!fetchedAlbum) {
                await addAlbum();
            } else {
                setAlbum(fetchedAlbum);
            }
            const ratings = await getAlbumTrackRatings(id || "", user.accountId);

            const ratingsArray = fetchedAlbum?.tracks.map((t) => {
                const match = ratings?.find((r) => r.songId === t.songId);
                return match ? match.rating : 0;
            });
            setSongRatings(ratingsArray || []);

        } catch (error) {
            console.error("Error fetching Album or reviews:", error);
        }

        setLoading(false);
    };

    const listenedClick = async () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        if (listened) {
            await removeListenedAlbum(album ? album.albumId : '', user.accountId)
            setListened(false);
        } else {
            await addListenedAlbum(album ? album.albumId : '', user.accountId)
            setListened(true);
        }
    }
    
    const fetchListened = async () => {
        try {
            const listenedtemp = await hasListenedAlbum(user.accountId, id || "")
            if (listenedtemp) {
                setListened(true);
            } else {
                setListened(false);
            }
        } catch (error) {
            console.log(error)
        }
    }

    const formatTrack = (track: any): Track => ({
        title: track.title,
        songId: track.songId,
        artist: album?.artists[0].name || "Unknown",
        album_cover_url: album?.album_cover_url || "",
        preview_url: track.preview_url,
        isrc: track.isrc
    });

    const handlePlayAlbum = () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        if (!album) return;
        const formattedTracks = album.tracks.map(formatTrack);
        playAlbum(formattedTracks);
    };

    useEffect(() => {
        if (id) {
            fetchAlbum();
            fetchGlobalRaiting();
            
            if (isAuthenticated && user?.accountId) {
                fetchListened();
                addUpdateRatingAlbumlocal();
            }
        }
    }, [id, isAuthenticated, user?.accountId]);

    if (loading) {
        return (
            <div className="common-container">
                <AlbumDetailSkeleton />
            </div>
        )
    }

    if (!album || notFound) {
        return <NotFound />
    }

    return (
        <div className="common-container pb-20">
            {album && !loading &&
                (
                    <div className='w-full max-w-6xl'>
                        {/* MOBILE-FRIENDLY HEADER BANNER */}
                        <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-gray-900 to-black p-4 sm:p-6 md:p-8 border border-white/5">
                            {/* Background image with high blur/dimming for mobile atmosphere */}
                            <div className="absolute inset-0 overflow-hidden opacity-30">
                                <img
                                    src={album.album_cover_url}
                                    alt={album.title}
                                    className="w-full h-full object-cover filter blur-xl scale-110"
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

                            {/* Header Content layout */}
                            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-5">
                                <img
                                    src={album.album_cover_url}
                                    alt={album.title}
                                    className="w-36 h-36 sm:w-44 sm:h-44 object-cover rounded-xl shadow-2xl border border-white/10 shrink-0"
                                />
                                <div className="flex flex-col text-center sm:text-left flex-1 min-w-0">
                                    <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Album</h3>
                                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white truncate tracking-tight">
                                        {album.title}
                                    </h1>
                                    {album.artists && (
                                        <p className="text-sm sm:text-base text-gray-300 mt-1">
                                            {album?.release_date?.slice(0, 4)} | By{" "}
                                            {album?.artists.map((a, i) => (
                                                <Link to={`/artist/${a.artist_id}`} key={a.id} className="hover:text-emerald-400 font-medium">
                                                    {a.name}
                                                    {i < album.artists.length - 1 ? ", " : ""}
                                                </Link>
                                            ))}
                                        </p>
                                    )}

                                    {/* Action Buttons Row */}
                                    <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                                        <Button
                                            onClick={handlePlayAlbum}
                                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-10 px-5 rounded-xl transition-all active:scale-95 shadow-lg"
                                        >
                                            <Play fill="black" size={16} />
                                            <span className="text-xs uppercase tracking-wider">Play</span>
                                        </Button>

                                        <Button
                                            onClick={handleAddToPlaylist}
                                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold h-10 px-4 rounded-xl transition-all active:scale-95 border border-white/10"
                                        >
                                            <Plus size={18} />
                                            <span className="text-xs uppercase tracking-wider">Add</span>
                                        </Button>

                                        {album.spotify_url && (
                                            <a
                                                href={album.spotify_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold h-10 px-4 rounded-xl transition-all active:scale-95 shadow-lg"
                                            >
                                                <FaSpotify size={18} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Body Layout */}
                        <div className="flex flex-col-reverse lg:flex-row gap-8 mt-6">
                            {/* Tracks Section */}
                            <section className="px-2 sm:px-0 lg:w-3/5">
                                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">Tracks</h2>
                                <div className="bg-gray-900/40 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-md">
                                    <ul className="divide-y divide-white/5">
                                        {album.tracks.map((track, index) => {
                                            const isCurrent = currentTrack?.songId === track.songId;
                                            const hasRating = songRatings[index] > 0;
                                            
                                            return (
                                                <li
                                                    key={index}
                                                    className="group flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 hover:bg-white/5 transition-all gap-2 sm:gap-4"
                                                >
                                                    {/* Left Side: Number/Play + Title */}
                                                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                        <div className="relative w-6 h-6 flex-shrink-0 flex items-center justify-center">
                                                            {isCurrent ? (
                                                                <div className="group-hover:opacity-0 transition-opacity">
                                                                    <PlayingVisualizer isPaused={!isPlaying} />
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-500 group-hover:opacity-0 transition-opacity text-xs font-medium">
                                                                    {index + 1}
                                                                </span>
                                                            )}

                                                            <button 
                                                                onClick={() => {
                                                                    if (!isAuthenticated) { setShowAuthModal(true); return; }
                                                                    if (isCurrent) { togglePlay(); } 
                                                                    else { playAlbum(album.tracks.map(formatTrack), index); }
                                                                }}
                                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-emerald-400 transition-opacity"
                                                            >
                                                                {isCurrent && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                                            </button>
                                                        </div>

                                                        <Link to={`/song/${track.songId}`} className="min-w-0 flex-1">
                                                            <span className={`text-sm font-medium block truncate sm:whitespace-normal sm:overflow-visible transition-colors ${
                                                                isCurrent ? 'text-emerald-400 font-bold' : 'text-white group-hover:text-emerald-400'
                                                            }`}>
                                                                {track.title}
                                                            </span>
                                                        </Link>
                                                    </div>

                                                    {/* Right Side: Star Rating (Responsive: Row-aligned on desktop, indented inline row on mobile) */}
                                                    <div className="flex items-center justify-between sm:justify-end gap-1 pl-9 sm:pl-0 shrink-0">
                                                        <div className="flex items-center gap-0.5">
                                                            {[...Array(5)].map((_, starIndex) => {
                                                                const starValue = starIndex + 1;
                                                                const fillLevel = songRatings[index] >= starValue ? 1 : songRatings[index] >= starValue - 0.5 ? 0.5 : 0;
                                                                return (
                                                                    <button
                                                                        key={starValue}
                                                                        type="button"
                                                                        onClick={(e) => handleSongRating(e, starValue, index)}
                                                                        className="active:scale-125 transition-transform p-0.5"
                                                                    >
                                                                        <StarIcon fillLevel={fillLevel} sizeClass="w-5 h-5" />
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        {hasRating && (
                                                            <span className="text-[10px] font-bold text-emerald-400 ml-1.5 w-6 text-right">
                                                                {songRatings[index]}★
                                                            </span>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </section>

                            {/* Ratings + Actions Sidebar */}
                            <section className="lg:w-2/5 flex flex-col items-center justify-start">
                                <div className="w-full flex items-center justify-between mb-4 px-2">
                                    <p className="text-xl font-bold text-white">Ratings</p>
                                    {globalTotal > 0 && (<p className="text-gray-400 text-xs">{globalTotal} listeners</p>)}
                                </div>

                                {globalTotal <= 0 && (
                                    <div className='w-full p-6 text-center bg-gray-900/40 rounded-2xl border border-white/5 mb-4'>
                                        <p className='text-sm text-gray-400'>No ratings yet — be the first!</p>
                                    </div>
                                )}

                                {globalTotal > 0 && (
                                    <div className="flex items-center justify-center w-full bg-gray-900/40 border border-white/5 p-4 rounded-2xl mb-4">
                                        <div className="mr-6 text-center">
                                            <p className="text-2xl font-black text-white">{globalAverage.toFixed(1)}</p>
                                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Average</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <BarChart width={200} height={120} data={globalRatings} barCategoryGap={2}>
                                                <XAxis dataKey="rating" ticks={[1, 2, 3, 4, 5]} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                                <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} />
                                            </BarChart>
                                        </div>
                                    </div>
                                )}

                                {/* User Actions Card */}
                                <div className="w-full rounded-2xl bg-gray-900/40 border border-white/5 p-4 shadow-xl">
                                    <div className="flex gap-3 mb-3">
                                        <Button 
                                            onClick={listenedClick}
                                            className={`flex-1 h-14 rounded-xl transition-all active:scale-95 ${
                                                listened 
                                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                                                : "bg-white/5 border border-white/10 text-gray-400"
                                            }`}
                                        >
                                            <div className="flex flex-col items-center gap-0.5">
                                                <img
                                                    src={listened ? '/assets/icons/headphones-filled.svg' : '/assets/icons/headphones.svg'}
                                                    className="w-5 h-5"
                                                    alt="headphones"
                                                />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">
                                                    {listened ? 'Listened' : 'Mark Listened'}
                                                </p>
                                            </div>
                                        </Button>

                                        <Link 
                                            to={`/album/${album?.albumId}/add-review`}
                                            className="flex-1 h-14 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 text-black font-bold"
                                        >
                                            <img src='/assets/icons/pen-nib.svg' className="w-4 h-4 brightness-0" alt="review" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Review</p>
                                        </Link>
                                    </div>

                                    {/* Rating Bar */}
                                    <div className="flex items-center justify-between px-4 h-12 bg-black/40 border border-white/5 rounded-xl">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Your Rating</span>
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, starIndex) => {
                                                const value = starIndex + 1;
                                                const fillLevel = rating >= value ? 1 : rating >= value - 0.5 ? 0.5 : 0;
                                                return (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={(e) => handleRating(e, value)}
                                                        className="active:scale-125 transition-transform p-0.5"
                                                    >
                                                        <StarIcon fillLevel={fillLevel} sizeClass="w-6 h-6" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Suggestions */}
                        <div className="mt-8">
                            <Suggestions currentAlbumId={album.albumId} artistId={album.artists[0]?.artist_id || ""} />
                        </div>

                        {/* Reviews Section */}
                        <section className="mt-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">Reviews</h2>
                            {album?.reviews.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm py-6 bg-gray-900/20 rounded-2xl border border-white/5">
                                    No reviews yet - be the first to start the conversation!
                                </p>
                            ) : null}
                            <div className="space-y-3">
                                {album?.reviews.map((r) => (
                                    <ReviewItem reviewId={r.reviewId} text={r.text} creator={r.creator} album={r.album} likes={r.likes} createdAt={r.createdAt} updatedAt={r.updatedAt} title={r.title} key={r.reviewId} />
                                ))}
                            </div>
                        </section>

                        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
                        <PlaylistModal 
                            isOpen={showPlaylistModal} 
                            onClose={() => setShowPlaylistModal(false)} 
                            itemId={id || ''} 
                            type="album"
                        />
                    </div>
                )
            }
        </div>
    )
}

export default Album;