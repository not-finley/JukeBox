import { addAlbumComplex, addListenedAlbum, addUpdateRatingAlbum, addUpdateRatingSong, deleteRaitingAlbum, deleteRaitingSong, getAlbumDetailsById, getAlbumTrackRatings, getAllRatingsOfAlbum, getRatingAlbum, hasListenedAlbum, removeListenedAlbum } from '@/lib/appwrite/api';
import { AlbumDetails, Track } from '@/types';
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { isMobile, isTablet } from "react-device-detect";
import { getSpotifyToken, SpotifyAlbumById } from '@/lib/appwrite/spotify';
import LoaderMusic from '@/components/shared/loaderMusic';
import { useUserContext } from '@/lib/AuthContext';
import { FaSpotify } from "react-icons/fa";
import ReviewItem from '@/components/ReviewItem';
import { Play } from 'lucide-react';
import { usePlayerContext } from '@/context/PlayerContext';


const Album = () => {
    const { id } = useParams();
    const { user } = useUserContext();
    const [album, setAlbum] = useState<AlbumDetails | null>(null);
    const [notFound, setNotFound] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [listened, setListened] = useState(true);
    const [globalRatings, setGlobalRatings] = useState<{ rating: number; count: number }[]>([]);
    const [globalAverage, setGlobalAverage] = useState(0);
    const [globalTotal, setGlobalTotal] = useState(0);
    const [songRatings, setSongRatings] = useState<number[]>([]);
    const { playTrack } = usePlayerContext();


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
            console.log(fetchedArtist);
        }
        catch (error) {
            setNotFound(true);
        }
    }


    const handleRating = async (value: number) => {
        if (value == rating) {
            setRating(0);
            await deleteRaitingAlbum(id ? id : '', user.accountId)
        } else {
            setRating(value);
            await addUpdateRatingAlbum(id ? id : '', user.accountId, value);
            setListened(true);
        }

        fetchGlobalRaiting();
    };

    const addUpdateRatingAlbumlocal = async () => {
        const num = await getRatingAlbum(id ? id : '', user.accountId);
        setRating(num);
    }


    const handleSongRating = async (value: number, trackIndex: number) => {
        if (value === songRatings[trackIndex]) {
            value = 0;
        }
        const newRatings = [...songRatings];
        newRatings[trackIndex] = value;
        setSongRatings(newRatings);

        if (value == 0) {
            await deleteRaitingSong(album?.tracks[trackIndex].songId || "", user.accountId);

        } else {
            await addUpdateRatingSong(album?.tracks[trackIndex].songId || "", user.accountId, value);
        }

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
                const ratings = await getAllRatingsOfAlbum(id || "");
                console.log(ratings)
            }
            const ratings = await getAlbumTrackRatings(id || "", user.accountId);

            const ratingsArray = fetchedAlbum?.tracks.map((t) => {
                const match = ratings?.find((r) => r.songId === t.songId);
                return match ? match.rating : 0;
            }
            );
            setSongRatings(ratingsArray || []);


        } catch (error) {
            console.error("Error fetching Album or reviews:", error);
        }


        setLoading(false);
    };

    const handlePlayPreview = (track: Track) => {
        playTrack(track);
    }

    const listenedClick = async () => {
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


    useEffect(() => {
        if (id) {
            fetchAlbum();
            fetchListened();
            addUpdateRatingAlbumlocal();
            fetchGlobalRaiting();
        }

    }, [id]);

    return (
        <div className="common-container">
            {notFound && <h1 className='text-2xl text-gray-300'>Album not found</h1>}
            {loading && (<LoaderMusic />)}
            {album && !loading &&
                (
                    <div className='w-full max-w-6xl'>
                        <div className="h-[35vh] relative w-full">
                            {/* Background image */}
                            <img
                                src={album.album_cover_url}
                                alt={album.title}
                                className="inset-0 w-full h-full object-cover brightness-75"
                            />

                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                            {/* Bottom-left content */}
                            <div className=" absolute bottom-4 left-4 flex items-end gap-4">
                                <img
                                    src={album.album_cover_url}
                                    alt={album.title}
                                    className="hidden xs:block w-40 h-40  object-cover rounded shadow-lg"
                                />
                                <div className="flex flex-col">
                                    <h3 className="text-gray-300 text-sm uppercase">Album</h3>
                                    <h1 className="text-4xl md:text-5xl xl:text-6xl font-black text-white">
                                        {album.title}
                                    </h1>
                                    {album.artists && (
                                        <p className="text-lg text-gray-300">{album?.release_date.slice(0, 4)} | By{" "}

                                            {album?.artists.map((a, i) => (
                                                <Link to={`/artist/${a.artist_id}`} key={a.id} className="hover:text-emerald-400">
                                                    {a.name}
                                                    {i < album.artists.length - 1 ? ", " : ""}
                                                </Link>
                                            ))}
                                        </p>
                                    )}
                                    {album.spotify_url && (
                                        <a
                                            href={album.spotify_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-black font-semibold py-2 px-4 rounded-lg shadow-md transition w-fit"
                                        >
                                            <FaSpotify className="text-xl" />
                                            <span>Listen on Spotify</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse lg:flex-row">
                            {/* Tracks */}
                            <section className="bg-black px-4 py-12 lg:w-3/5">
                                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">Tracks</h2>
                                <ul className="divide-y divide-gray-800">
                                    {album.tracks.map((track, index) => {
                                        const hasRating = songRatings[index] > 0;
                                        
                                        return (
                                            <li
                                                key={index}
                                                className="group grid grid-cols-[30px_1fr_auto] items-center gap-4 p-3 hover:bg-white/5 transition-all rounded-xl mt-1 mb-1"
                                            >
                                                {/* 1. Track Number or Play Icon */}
                                                <div className="relative w-6 h-6 flex-center">
                                                   {/* Show number by default, Play icon on hover */}
                                                    <span className="text-gray-500 group-hover:opacity-0 transition-opacity">
                                                    {index + 1}
                                                    </span>
                                                    <button 
                                                    onClick={() => handlePlayPreview({title: track.title, songId: track.songId, artist: album.artists[0].name, album_cover_url: album.album_cover_url, preview_url: track.preview_url})}
                                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 flex-center text-emerald-400"
                                                    >
                                                    <Play size={18} fill="currentColor" />
                                                    </button>
                                                </div>

                                                {/* 2. Title */}
                                                <Link to={`/song/${track.songId}`} className="flex flex-col min-w-0">
                                                    <span className="text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                                                        {track.title}
                                                    </span>
                                                </Link>

                                                {/* 3. Stars Logic */}
                                                <div className={`flex items-center gap-1 transition-all duration-300 ${
                                                    !isMobile && !isTablet 
                                                        ? `opacity-0 group-hover:opacity-100 ${hasRating ? 'opacity-100' : ''}` 
                                                        : 'opacity-100' 
                                                }`}>
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, starIndex) => {
                                                            const value = starIndex + 1;
                                                            const isActive = songRatings[index] >= value;
                                                            return (
                                                                <button
                                                                    key={value}
                                                                    type="button"
                                                                    onClick={() => handleSongRating(value, index)}
                                                                    className="transition-transform active:scale-125 hover:scale-110"
                                                                >
                                                                    <img
                                                                        src={isActive 
                                                                            ? "/assets/icons/cute-star_full.svg" 
                                                                            : "/assets/icons/cute-star.svg"
                                                                        }
                                                                        className={`w-5 h-5 md:w-6 md:h-6 transition-all ${
                                                                            isActive 
                                                                            ? 'drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]' 
                                                                            // If not active, we invert the black to white and dim it
                                                                            : 'invert opacity-20 group-hover:opacity-40 hover:!opacity-100'
                                                                        }`}
                                                                        />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                            {/* Ratings + Actions */}
                            <section className="bg-black px-4 py-12 lg:w-2/5 flex flex-col items-center justify-start">
                                {/* Ratings Summary */}
                                <div className="w-full flex items-center justify-between mb-6">
                                    <p className="text-2xl font-bold text-white">Ratings</p>

                                    {globalTotal > 0 && (<p className="text-gray-400 text-md">{globalTotal} listeners</p>)}
                                </div>

                                {globalTotal <= 0 && (<p className='text-lg text-gray-300'>No ratings yet  -  be the first!</p>)}


                                {/* Histogram */}
                                {globalTotal > 0 &&
                                    (
                                        <div className="flex items-center justify-center w-full">
                                            <div className="mr-9">
                                                <p className="text-2xl text-gray-200 text-center">{globalAverage.toFixed(1)}</p>
                                                <p className="text-sm text-gray-400 text-center">Stars</p>
                                            </div>
                                            <BarChart width={250} height={150} data={globalRatings}>
                                                <XAxis dataKey="rating" />
                                                <Bar dataKey="count" fill="#82ca9d" />
                                            </BarChart>
                                        </div>
                                    )}
                                {/* User Actions Card */}
                                <div className="mt-10 w-full max-w-sm rounded-2xl bg-gray-900/40 backdrop-blur-xl border border-gray-800 p-5 shadow-2xl transition-all hover:border-gray-700/50">
                                
                                <div className="flex gap-3">
                                    {/* Listened Toggle Button */}
                                    <Button 
                                    onClick={listenedClick}
                                    className={`flex-1 h-16 rounded-xl transition-all duration-300 active:scale-95 ${
                                        listened 
                                        ? "bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20" 
                                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                                    }`}
                                    >
                                    <div className="flex flex-col items-center gap-1">
                                        <img
                                        src={listened ? '/assets/icons/headphones-filled.svg' : '/assets/icons/headphones.svg'}
                                        className={`w-6 h-6 transition-transform ${listened ? 'scale-110' : ''}`}
                                        alt="headphones"
                                        />
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${listened ? 'text-emerald-400' : 'text-gray-400'}`}>
                                        {listened ? 'Listened' : 'Mark Listened'}
                                        </p>
                                    </div>
                                    </Button>

                                    {/* Review Link Button */}
                                    <Link 
                                    to={`/album/${album?.albumId}/add-review`}
                                    className="flex-1 h-16 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-all duration-300 active:scale-95 flex flex-col items-center justify-center gap-1 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                    >
                                        <img
                                        src='/assets/icons/pen-nib.svg'
                                        className="w-5 h-5 brightness-0" // Makes the icon black to contrast with emerald
                                        alt="review"
                                        />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-black">
                                        Write Review
                                        </p>
                                    </Link>
                                </div>

                                {/* Rating Bar */}
                                <div className="relative mt-3 group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="relative flex items-center justify-between px-4 h-12 bg-black/40 border border-white/5 rounded-xl backdrop-blur-md">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Your Rating</span>
                                    <div className="flex gap-1.5">
                                        {[...Array(5)].map((_, index) => {
                                        const value = index + 1;
                                        const isActive = rating >= value;
                                        return (
                                            <button
                                            key={value}
                                            type="button"
                                            className="transition-transform active:scale-125 hover:scale-110"
                                            onClick={() => handleRating(value)}
                                            >
                                            <img
                                                src={isActive 
                                                    ? "/assets/icons/cute-star_full.svg" 
                                                    : "/assets/icons/cute-star.svg"
                                                }
                                                className={`w-5 h-5 md:w-6 md:h-6 transition-all ${
                                                    isActive 
                                                    ? 'drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]' 
                                                    // If not active, we invert the black to white and dim it
                                                    : 'invert opacity-20 group-hover:opacity-40 hover:!opacity-100'
                                                }`}
                                            />
                                            </button>
                                        );
                                        })}
                                    </div>
                                    </div>
                                </div>
                                </div>
                            </section>



                        </div>
                        <section className=" bg-black px-4 py-12">
                            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">Reviews</h2>

                            {album?.reviews.length == 0 ? (<p className="text-center text-gray-300">No reviews yet - be the first to start the conversation!</p>) : ''}
                            {album?.reviews.map((r) => (
                                <ReviewItem reviewId={r.reviewId} text={r.text} creator={r.creator} album={r.album} likes={r.likes} createdAt={r.createdAt} updatedAt={r.updatedAt} key={r.reviewId} />
                            )
                            )}
                        </section>
                    </div>

                )
            }
        </div>
    )
}

export default Album