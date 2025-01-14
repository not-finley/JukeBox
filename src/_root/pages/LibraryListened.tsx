import LoaderMusic from "@/components/shared/loaderMusic";
import { useUserContext } from "@/context/AuthContext";
import { getListened} from "@/lib/appwrite/api";
import { Listened } from "@/types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LibraryListened = () => {
    const { user } = useUserContext();
    const [listened, setListened] = useState<Listened[]>([]);
    const [loading, setLoading] = useState(true);


    const loadReviews = async () => {
        if (user?.accountId) {
            const newListened = await getListened(user.accountId);
            setListened(newListened);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, [user])
    return (
        <div className="song-container">
            <h1 className="text-4xl font-bold">Your Listens</h1>
            {loading ? 
                (<LoaderMusic />): 
                ('')
            }
            {listened.length > 0? (
                <div className='song-grid'>
                {listened.map((s) => (
                    <Link key={s.song.songId} to={`/song/${s.song.songId}`}>
                    <div className="song-card" key={s.song.songId}>
                        <img src={s.song.album_cover_url} alt={s.song.title} className="song-image" />
                        <p className="song-title">{s.song.title}</p>
                    </div>
                    </Link>
                ))}
            </div>
            ): ''}
            
            {!loading && listened.length == 0 ? (
            <p>No songs listened to.</p>): 
            ('')
            }


        </div>
    )
}

export default LibraryListened