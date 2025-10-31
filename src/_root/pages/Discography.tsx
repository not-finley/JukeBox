import { useEffect, useState } from 'react';
import { getArtistDiscographyById, addFullDiscography, markDiscographyLoaded } from '@/lib/appwrite/api';
import { AlbumDetails } from '@/types';
import { Link, useParams } from 'react-router-dom';
import LoaderMusic from '@/components/shared/loaderMusic';
import { getSpotifyToken, getArtistDiscographyFromSpotify } from '@/lib/appwrite/spotify';

const Discography = () => {
    const { id } = useParams();
    const [discography, setDiscography] = useState<AlbumDetails[] | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(true);
    const [progressMessage, setProgressMessage] = useState("");
    const [filter, setFilter] = useState<"all" | "album" | "single">("all");



    useEffect(() => {
        const fetchArtistDiscog = async () => {
            try {
                setLoading(true);

                let fetchedDiscog = await getArtistDiscographyById(id || "");

                if (!fetchedDiscog) {
                    setProgressMessage("Fetching access token…");
                    const token = await getSpotifyToken();

                    setProgressMessage("Fetching discography from Spotify…");
                    const discog = await getArtistDiscographyFromSpotify(id || "", token);

                    setProgressMessage("Saving discography…");
                    await addFullDiscography(discog);

                    setProgressMessage("Marking as complete…");
                    await markDiscographyLoaded(id || "");

                    setProgressMessage("Finalizing…");
                    fetchedDiscog = await getArtistDiscographyById(id || "");
                }

                if (!fetchedDiscog) {
                    setNotFound(true);
                    return;
                }

                setProgressMessage("Sorting albums…");
                fetchedDiscog.sort(
                    (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
                );

                setDiscography(fetchedDiscog);
                setProgressMessage("Done!");
            } catch (error) {
                console.error("Error fetching artist discography:", error);
                setNotFound(true);
                setProgressMessage("Failed to load discography.");
            } finally {
                setLoading(false);
            }
        };


        if (id) fetchArtistDiscog();
    }, [id]);

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
                <Link to={`/artist/${id}`} className="text-indigo-400 hover:underline">
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
                {loading && progressMessage && <p className="text-center text-gray-400 mt-4">{progressMessage}</p>}
                {notFound && <p className="text-center text-gray-300">Discography not found</p>}

                {filteredDiscog?.map((album) => (
                    <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-start gap-10 bg-zinc-900/60 p-6 rounded-2xl shadow-lg hover:bg-zinc-800 transition-all duration-200 mb-5">
                        <Link
                            to={`/album/${album.albumId}`}
                            className="group lg:w-1/3 w-2/3 relative"
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
                        {album.artists.length > 0 && (
                            <div className="absolute top-4 left-4 bg-black bg-opacity-60 px-3 py-1 rounded-full shadow-md">
                                <p className="text-sm text-white">
                                    {album.artists.map(artist => artist.name).join(", ")}
                                </p>
                            </div>
                        )
                        }

                        {/* Album Details + Tracklist */}
                        <div className="flex flex-col flex-1 lg:w-1/3 w-full">
                            <Link
                                to={`/album/${album.albumId}`}
                                title={album.title}
                                className="text-3xl font-bold text-white hover:underline"
                            >{album.title}
                            </Link>

                            <p className="text-gray-400 mb-4">
                                {new Date(album.release_date).getFullYear()}
                            </p>

                            {album.tracks.length > 0 ? (
                                <ul className="text-gray-300 text-base divide-y divide-zinc-700/60 w-full">
                                    {album.tracks.map((t, index) => (
                                        <li
                                            key={t.songId}
                                            className="w-full py-2 hover:text-white transition flex"
                                        >
                                            {/* Track number */}
                                            <span className="flex-shrink-0 w-6 text-gray-400">{index + 1}.</span>

                                            {/* Track title fills remaining space */}
                                            <Link
                                                to={`/song/${t.songId}`}
                                                className="flex-1 truncate overflow-hidden hover:text-emerald-400 transition"
                                                title={t.title}
                                            >
                                                {t.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>

                            ) : (
                                <p className="text-gray-500 italic">No tracks found.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

export default Discography;
