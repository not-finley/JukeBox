import LoaderMusic from "@/components/shared/loaderMusic";
import { getLastWeekPopularSongs } from "@/lib/appwrite/api";
import { Song } from "@/types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";


const TopTracks = () => {
    const [popularSongs, setPopularSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchTopTracks = async () => {
        try { 
        const topSongs = await getLastWeekPopularSongs();
        setPopularSongs(topSongs);
        }
        catch(error) {
        console.log(error);
        }
    }
    fetchTopTracks();
    setLoading(false);
    }, []);


    return (
        <div className="song-container">
            <h1 className="text-4xl font-bold">Top Tracks</h1>

            <div className="song-grid">
                {popularSongs.map((s) => (
                    <Link key={s.songId} to={`/song/${s.songId}`}>
                        <div className="song-card" key={s.songId}>
                            <img src={s.album_cover_url} alt={s.title} className="song-image" />
                            <p className="song-title">{s.title.length >30? s.title.slice(0,30) + "...": s.title}</p>
                        </div>
                    </Link>
                ))}
            </div>
            {loading ? (
            <LoaderMusic />): ''}
        </div>
    )
}

export default TopTracks