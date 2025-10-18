import { addAlbumComplex, getAlbumDetailsById } from '@/lib/appwrite/api';
import { AlbumDetails } from '@/types';
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis } from 'recharts';
import { IoMenu } from "react-icons/io5";
import { Button, buttonVariants } from '@/components/ui/button';
import { getSpotifyToken, SpotifyAlbumById } from '@/lib/appwrite/spotify';


const Album = () => {
    const { id } = useParams();
    const [album, setAlbum] = useState<AlbumDetails | null>(null);
    const [notFound, setNotFound] = useState<boolean>(false);


    const addAlbum = async () => {
        try {
            const spotifyToken: string = await getSpotifyToken();
            const spotifyAlbum = await SpotifyAlbumById(id || "", spotifyToken);
            if (!spotifyAlbum) {
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

    const raitingdata = [
        { rating: "1", count: 3 },
        { rating: "2", count: 5 },
        { rating: "3", count: 12 },
        { rating: "4", count: 20 },
        { rating: "5", count: 7 },
    ];


    const fetchAlbum = async () => {
        try {
            const fetchedAlbum = await getAlbumDetailsById(id || "");
            if (!fetchedAlbum) {
                await addAlbum();
            } else {
                setAlbum(fetchedAlbum);
            }
        } catch (error) {
            console.error("Error fetching Album or reviews:", error);
        }
    };

    useEffect(() => {
        if (id) {
            fetchAlbum();
        }

    }, [id]);

    return (
        <div className="common-container">
            {album &&
                (
                    <div className='w-full max-w-6xl'>
                        <div className="sticky top-0 h-[35vh] z-0">
                            <div className="relative w-full h-full">
                                {/* Background image */}
                                <img
                                    src={album.album_cover_url}
                                    alt={album.title}
                                    className="inset-0 w-full h-full object-cover brightness-75"
                                />

                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                                {/* Bottom-left content */}
                                <div className="absolute bottom-4 left-4 flex items-end gap-4">
                                    <img
                                        src={album.album_cover_url}
                                        alt={album.title}
                                        className="w-32 h-32 object-cover rounded shadow-lg"
                                    />
                                    <div className="flex flex-col">
                                        <h3 className="text-gray-300 text-sm uppercase">Album</h3>
                                        <h1 className="text-4xl md:text-5xl xl:text-6xl font-black text-white">
                                            {album.title}
                                        </h1>
                                        {album.artists && (
                                            <p className="text-lg text-gray-300">By{" "}
                                                {album?.artists.map((a, i) => (
                                                    <Link to={`/artist/${a.artist_id}`} key={a.id} className="hover:text-white">
                                                        {a.name}
                                                        {i < album.artists.length - 1 ? ", " : ""}
                                                    </Link>
                                                ))}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse lg:flex-row">
                            {/* Tracks */}
                            <section className="relative bg-black px-4 py-12 lg:w-3/5">
                                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">Tracks</h2>
                                <ul>
                                    {album.tracks.map((track, index) => (
                                        <li
                                            key={index}
                                            className="flex justify-between items-center bg-gray-800 rounded p-3 mb-2 hover:bg-gray-700 transition"
                                        >
                                            <div className="flex gap-3 items-center">
                                                <span className="text-gray-400">{index + 1}</span>
                                                <Link to={`/song/${track.song_id}`} className="text-white">{track.title}</Link>
                                            </div>
                                            <button><IoMenu /></button>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* Ratings + Actions */}
                            <section className="relative bg-black px-4 py-12 lg:w-2/5 flex flex-col items-center justify-start">

                                {/* User Actions */}
                                <div className="w-full max-w-sm bg-gray-800 rounded-lg p-4 mb-6">
                                    <div className="flex gap-2 mt-2">
                                        <Button className="shad-button_primary w-1/2" >
                                            <div className="flex-col flex-center">
                                                <img
                                                    width={25}
                                                    src={'/assets/icons/headphones-filled.svg'}
                                                />
                                                <p className="tiny-medium text-black">remove</p>
                                            </div>
                                        </Button>

                                        <Link className={`${buttonVariants({ variant: "default" })} shad-button_primary w-1/2`}
                                            to={`/album/${album?.albumId}/add-review`}
                                        // key="add-review"
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
                                                    // onClick={() => handleRating(value)}
                                                    // onMouseEnter={() => handleHover(value)}
                                                    // onMouseLeave={() => setHover(0)}
                                                    >
                                                        <img
                                                            //src={hover >= value || rating >= value? '/assets/icons/star_full.svg' : '/assets/icons/star_empty.svg'}
                                                            //src={hover >= value? '/assets/icons/star_full.svg' : rating >= value? '/assets/icons/star_full_bg.svg' : '/assets/icons/star_empty.svg'}
                                                            // src={hover > 0 ? (hover >= value ? '/assets/icons/star_full.svg' : '/assets/icons/star_empty.svg') : rating >= value ? '/assets/icons/star_full.svg' : '/assets/icons/star_empty.svg'}
                                                            className="h-4/6 w-10"
                                                        />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Ratings Summary */}
                                <div className="w-full flex items-center justify-between mb-6">
                                    <p className="text-2xl font-bold text-white">Ratings</p>
                                    <p className="text-gray-400 text-md">1k listeners</p>
                                </div>

                                {/* Histogram */}
                                <div className="flex items-center justify-center w-full">
                                    <div className="mr-9">
                                        <p className="text-2xl text-gray-200 text-center">3.9</p>
                                        <p className="text-sm text-gray-400 text-center">Stars</p>
                                    </div>
                                    <BarChart width={250} height={200} data={raitingdata}>
                                        <XAxis dataKey="rating" />
                                        <Bar dataKey="count" fill="#82ca9d" />
                                    </BarChart>
                                </div>
                            </section>
                        </div>

                        <section className="relative h-96 bg-black px-4 py-12">
                            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">Reviews</h2>
                            <div className="bg-gray-900 rounded-lg p-4 mb-4">
                                <p className="text-white">"Loved the production quality!"</p>
                                <span className="text-sm text-gray-400">– User123</span>
                            </div>
                        </section>
                    </div>)
            }
        </div >
    )
}

export default Album