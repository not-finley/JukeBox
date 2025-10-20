import LoaderMusic from "@/components/shared/loaderMusic";
import { useUserContext } from "@/lib/AuthContext";
import { getListened } from "@/lib/appwrite/api";
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
                (<LoaderMusic />) :
                ('')
            }
            {listened.length > 0 ? (
                <div className='song-grid'>
                    {listened.map((s) => {
                        if (s.type == "song") {
                            return (
                                <Link key={s.id} to={`/song/${s.id}`}>
                                    <div className="song-card" key={s.id}>
                                        <img src={s.album_cover_url || ""} alt={s.name} className="song-image" />
                                        <p className="song-title">{s.name}</p>
                                    </div>
                                </Link>
                            )
                        } else {
                            return (
                                <Link key={s.id} to={`/album/${s.id}`}>
                                    <div className="song-card" key={s.id}>
                                        <img src={s.album_cover_url || ""} alt={s.name} className="song-image" />
                                        <p className="song-title">{s.name}</p>
                                    </div>
                                </Link>
                            )
                        }
                    })
                    }
                </div>
            ) : ''}

            {!loading && listened.length == 0 ? (
                <p>No songs listened to.</p>) :
                ('')
            }


        </div>
    )
}

export default LibraryListened