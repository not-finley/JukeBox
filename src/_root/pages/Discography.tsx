import { useEffect, useState } from 'react';
import { AlbumDetails } from '@/types';
import { Link, useParams } from 'react-router-dom';
import LoaderMusic from '@/components/shared/loaderMusic';
import { getSpotifyToken, getArtistDiscographyFromSpotify } from '@/lib/appwrite/spotify';

const Discography = () => {
    const { id } = useParams();
    const [discography, setDiscography] = useState<AlbumDetails[] | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "album" | "single">("all");

    const CACHE_KEY = `discog_${id}`;
    const STATE_KEY = `state_${id}`;

    useEffect(() => {
        const fetchArtistDiscog = async () => {
            try {
                setLoading(true);

                // Check Session Storage first
                const cachedData = sessionStorage.getItem(CACHE_KEY);
                const cachedState = sessionStorage.getItem(STATE_KEY);

                if (cachedData) {
                    setDiscography(JSON.parse(cachedData));
                    if (cachedState) {
                        const { filter: savedFilter, scrollY } = JSON.parse(cachedState);
                        setFilter(savedFilter);
                        // Small timeout to allow the DOM to render before scrolling
                        setTimeout(() => window.scrollTo(0, scrollY), 100);
                    }
                    setLoading(false);
                    return; // Exit early if we have cache
                }

                const token = await getSpotifyToken();
                const discog = await getArtistDiscographyFromSpotify(id || "", token);
                const sorted = discog.sort(
                    (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
                );

                setDiscography(sorted);
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(sorted));
            } catch (error) {
                console.error("Error:", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchArtistDiscog();
    }, [id]);

    const handleNavigation = () => {
        const state = {
            filter: filter,
            scrollY: window.scrollY
        };
        sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    };

    const filteredDiscog = discography?.filter(a => {
        if (filter === "all") return true;
        if (filter === "album") return a.album_type === "album";
        if (filter === "single") return a.album_type === "single" || a.album_type === "ep";
        return true;
    });


    if (notFound) {
        return (
            <div className="common-container text-center text-gray-300">
                <h1 className="text-2xl font-semibold mb-2">Discography not found.</h1>
                <Link to={`/artist/${id}`} onClick={handleNavigation} className="text-indigo-400 hover:underline">
                    Back to Artist
                </Link>
            </div>
        );
    }



    return (
        <div className="flex flex-col w-full items-center min-h-[calc(100dvh-145px)]">
            {/* Sticky Header */}
            <div className="sticky top-20 w-10/12 rounded-lg shadow-xl md:top-0 z-50 px-4 lg:px-6 transition-all duration-300 py-1 bg-slate-900/30 backdrop-blur-md lg:bg-transparent">
                <div className='items-center flex justify-center w-full '>
                    <Link
                        to={`/artist/${id}`}
                        onClick={handleNavigation}
                        className="absolute left-6 text-gray-400 hover:text-white transition text-sm underline-offset-4 hover:underline"
                    >
                        ← Back
                    </Link>
                    <h1 className="text-2xl lg:text-4xl font-bold text-white">Discography</h1>
                </div>

                <div className="flex justify-center gap-4 my-6">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-1 rounded-full text-sm font-medium transition 
            ${filter === "all" ? "bg-emerald-500 text-white" : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"}`}
                    >
                        All
                    </button>

                    <button
                        onClick={() => setFilter("album")}
                        className={`px-4 py-1 rounded-full text-sm font-medium transition 
            ${filter === "album" ? "bg-emerald-500 text-white" : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"}`}
                    >
                        Albums
                    </button>

                    <button
                        onClick={() => setFilter("single")}
                        className={`px-4 py-1 rounded-full text-sm font-medium transition 
            ${filter === "single" ? "bg-emerald-500 text-white" : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"}`}
                    >
                        Singles
                    </button>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 w-full overflow-auto px-5 py-5 lg:px-8 lg:p-14 custom-scrollbar">
                {loading && <LoaderMusic />}
                {notFound && <p className="text-center text-gray-300">Discography not found</p>}

                {filteredDiscog?.map((album) => (
                    /* 1. Added 'mx-auto' to ensure the card stays centered in the scrollable view */
                    <div key={album.albumId} className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center lg:items-start gap-10 bg-zinc-900/60 p-6 rounded-2xl shadow-lg hover:bg-zinc-800 transition-all duration-200 mb-8">
                        
                        {/* Left: Album Cover */}
                        <div className="lg:w-1/3 w-2/3 flex flex-col gap-3">
                            <Link
                                onClick={handleNavigation}
                                to={`/album/${album.albumId}`}
                                className="group relative block"
                            >
                                <img
                                    src={album.album_cover_url}
                                    alt={album.title}
                                    className="w-full rounded-xl shadow-lg object-cover group-hover:opacity-90 transition"
                                />
                                <span className="absolute bottom-3 right-3 bg-green-500 hover:bg-green-400 text-white text-xs font-semibold px-3 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition">
                                    View Album
                                </span>
                            </Link>

                            {/* 2. Moved Artist Names here, under the cover, or inside the info section for better flow */}
                            {album.artists.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                                    {album.artists.map(artist => (
                                        <span key={artist.id} className="text-xs bg-zinc-800 text-gray-400 px-2 py-1 rounded-md border border-zinc-700">
                                            {artist.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Album Details + Tracklist */}
                        <div className="flex flex-col flex-1 w-full text-center lg:text-left">
                            <Link
                                onClick={handleNavigation}
                                to={`/album/${album.albumId}`}
                                className="text-3xl font-bold text-white hover:text-emerald-400 transition"
                            >
                                {album.title}
                            </Link>

                            <p className="text-gray-500 mb-6 font-medium">
                                {new Date(album.release_date).getFullYear()} • {album.album_type === 'album' ? 'LP' : 'Single/EP'}
                            </p>

                            {/* Tracklist Container */}
                            <div className="bg-black/20 rounded-xl p-4">
                                {album.tracks.length > 0 ? (
                                    <ul className="text-gray-300 text-base divide-y divide-zinc-700/40 w-full">
                                        {album.tracks.map((t, index) => (
                                            <li key={t.songId} className="w-full py-2.5 hover:bg-white/5 px-2 rounded-lg transition flex group/track">
                                                <span className="flex-shrink-0 w-8 text-gray-500 font-mono text-sm">{index + 1}</span>
                                                <Link
                                                    onClick={handleNavigation}
                                                    to={`/song/${t.songId}`}
                                                    className="flex-1 truncate hover:text-emerald-400 transition"
                                                >
                                                    {t.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 italic text-sm">No tracks found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

export default Discography;
