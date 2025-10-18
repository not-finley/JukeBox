import LoaderMusic from "@/components/shared/loaderMusic";
import { useUserContext } from "@/lib/AuthContext";
import { getRated} from "@/lib/appwrite/api";
import { Rating } from "@/types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LibraryRatings = () => {
    const { user } = useUserContext();
    const [rated, setRated] = useState<Rating[]>([]);
    const [loading, setLoading] = useState(true);


    const loadReviews = async () => {
        if (user?.accountId) {
            const newReviews = await getRated(user.accountId);
            setRated(newReviews);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, [user])
    return (
        <div className="song-container">
            <h1 className="text-4xl font-bold">Your Ratings</h1>
            {loading ? 
                (<LoaderMusic />): 
                ('')
            }
            {rated.length > 0? (
                <div className="raiting-grid">
                {rated.map((s) => (
                    <li key={s.ratingId} className="flex w-full bg-emerald-600 rounded-md justify-center items-center p-2 hover:bg-emerald-500">
                        <Link to={`/song/${s.song.songId}`} className="flex-col items-center justify-center w-16">
                        <img
                            src={s.song.album_cover_url}
                            className="h-16 m-1"
                        />
                        </Link>
                        <div className="flex-col text-left items-center justify-normal">
                        <p className="text-sm pl-5">{s.song.title.length >28? s.song.title.slice(0,28) + "...": s.song.title}</p>
                        <div className="flex mx-3">
                            {[...Array(5)].map((_, index) => {
                                const value = (index + 1);
                                return (
                                <img 
                                    key={s.ratingId + value}
                                    src={s.rating >= value? '/assets/icons/star_full.svg' : '/assets/icons/star_empty.svg'}
                                    className="w-8 m-1"
                                />
                                );
                            })}
                        </div>
                        </div>  
                    </li>
            ))}
            </div>)
            :''}
            {!loading && rated.length == 0 ? (
            <p>No songs rated.</p>): 
            ('')
            }


        </div>
    )
}

export default LibraryRatings