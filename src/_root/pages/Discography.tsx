import { useEffect, useState } from 'react';
import { getArtistDiscographyById } from '@/lib/appwrite/api';
import { AlbumDetails } from '@/types';
import { Link, useParams } from 'react-router-dom';
import LoaderMusic from '@/components/shared/loaderMusic';

const Discography = () => {
    const { id } = useParams();
    const [discography, setDiscography] = useState<AlbumDetails[] | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArtistDiscog = async () => {
            try {
                const fetchedDiscog = await getArtistDiscographyById(id || "");
                if (!fetchedDiscog) {
                    // get it from spotify
                    setNotFound(true);
                } else {
                    fetchedDiscog.sort(
                        (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
                    );
                    setDiscography(fetchedDiscog);
                }
            } catch (error) {
                console.error("Error fetching artist discography:", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchArtistDiscog();
    }, [id]);


    if (loading) {
        return (
            <div className="common-container">
                <LoaderMusic />
            </div>
        );
    }


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
        <div className="common-container">
            <div className="sticky top-4 left-0 flex items-center justify-center mb-8 w-full bg-zinc-900/60 backdrop-blur-md z-10 px-4 py-2 rounded-xl">
                <Link
                    to={`/artist/${id}`}
                    className="absolute left-6 text-gray-400 hover:text-white transition text-sm underline-offset-4 hover:underline"
                >
                    ← Back to Artist
                </Link>
                <h1 className="text-2xl md:text-4xl font-bold text-white">Discography</h1>
            </div>

            {discography?.map((album) => (
                <div
                    key={album.albumId}
                    className="w-full max-w-6xl flex flex-col md:flex-row items-start gap-10 bg-zinc-900/60 p-6 rounded-2xl shadow-lg hover:bg-zinc-800 transition-all duration-200"
                >
                    {/* Album Cover */}
                    <Link
                        to={`/album/${album.albumId}`}
                        className="group md:w-1/3 w-full relative"
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

                    {/* Album Details + Tracklist */}
                    <div className="flex flex-col flex-1">
                        <h2 className="text-3xl font-bold text-white">{album.title}</h2>
                        <p className="text-gray-400 mb-4">
                            {new Date(album.release_date).getFullYear()}
                        </p>

                        {album.tracks.length > 0 ? (
                            <ul className="text-gray-300 text-base space-y-2 divide-y divide-zinc-700/60">
                                {album.tracks.map((t, index) => (
                                    <li
                                        key={t.songId}
                                        className="flex justify-between items-center py-2 hover:text-white transition"
                                    >
                                        <Link
                                            to={`/song/${t.songId}`}
                                            className="truncate hover:text-indigo-400 transition"
                                        >
                                            {index + 1}. {t.title}
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
    );
};

export default Discography;
