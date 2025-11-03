import { addAlbumComplex, addListenedAlbum, addUpdateRatingAlbum, addUpdateRatingSong, deleteRaitingAlbum, deleteRaitingSong, getAlbumDetailsById, getAlbumTrackRatings, getAllRatingsOfAlbum, getRatingAlbum, hasListenedAlbum, removeListenedAlbum } from '@/lib/appwrite/api';
import { AlbumDetails } from '@/types';
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis } from 'recharts';
import { Button, buttonVariants } from '@/components/ui/button';
import { getSpotifyToken, SpotifyAlbumById } from '@/lib/appwrite/spotify';
import LoaderMusic from '@/components/shared/loaderMusic';
import { useUserContext } from '@/lib/AuthContext';
import { FaSpotify } from "react-icons/fa";
import ReviewItem from '@/components/ReviewItem';


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
                                <ul className="divide-y divide-gray-700">
                                    {album.tracks.map((track, index) => (
                                        <li
                                            key={index}
                                            className="grid grid-cols-[40px_1fr_auto_5px] items-center bg-gray-800 p-3 hover:bg-gray-700 transition rounded-md mt-1 mb-1"
                                        >
                                            {/* Track number */}
                                            <span className="text-gray-400">{index + 1}</span>

                                            {/* Title */}
                                            <Link to={`/song/${track.songId}`} className="text-white truncate">
                                                {track.title}
                                            </Link>

                                            {/* Stars */}
                                            <div className="flex gap-1 justify-center">
                                                {[...Array(5)].map((_, starIndex) => {
                                                    const value = starIndex + 1;
                                                    return (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            onClick={() => handleSongRating(value, index)}
                                                        >
                                                            <img
                                                                src={
                                                                    songRatings[index] >= value
                                                                        ? "/assets/icons/cute-star_full.svg"
                                                                        : "/assets/icons/cute-star.svg"
                                                                }
                                                                className="h-4/6 w-7"
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </li>
                                    ))}
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
                                {/* User Actions */}
                                <div className="mt-10 w-full max-w-sm bg-gray-800 rounded-lg p-4 ">
                                    <div className="flex gap-2 mt-2">
                                        <Button className="shad-button_primary w-1/2"
                                            onClick={listenedClick}
                                        >
                                            <div className="flex-col flex-center">
                                                <img
                                                    width={25}
                                                    src={listened ? '/assets/icons/headphones-filled.svg' : '/assets/icons/headphones.svg'}
                                                />
                                                <p className="tiny-medium text-black">{listened ? 'remove' : 'Listened'}</p>
                                            </div>
                                        </Button>

                                        <Link className={`${buttonVariants({ variant: "default" })} shad-button_primary w-1/2`}
                                            to={`/album/${album?.albumId}/add-review`}
                                            key="add-review"
                                        >
                                            <div className="flex-col flex-center">
                                                <img
                                                    width={22.5}
                                                    src='/assets/icons/pen-nib.svg'
                                                />
                                                <p className="tiny-medium text-black">Review</p>
                                            </div>
                                        </Link>
                                    </div>
                                    <div className="bg-emerald-500 w-full h-10 rounded-md mt-2 justify-center flex items-center">
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, index) => {
                                                const value = (index + 1);
                                                return (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        className="text-2xl text-black hover:text-gray-50"
                                                        onClick={() => handleRating(value)}
                                                    >
                                                        <img
                                                            //src={hover >= value || rating >= value? '/assets/icons/star_full.svg' : '/assets/icons/star_empty.svg'}
                                                            //src={hover >= value? '/assets/icons/star_full.svg' : rating >= value? '/assets/icons/star_full_bg.svg' : '/assets/icons/star_empty.svg'}
                                                            src={rating >= value ? '/assets/icons/cute-star_full.svg' : '/assets/icons/cute-star.svg'}
                                                            className="h-4/6 w-10"
                                                        />
                                                    </button>
                                                );
                                            })}
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