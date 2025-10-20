import ReviewItemLibrary from "@/components/ReviewItemLibrary";
import LoaderMusic from "@/components/shared/loaderMusic";
import { useUserContext } from "@/lib/AuthContext";
import { getReviewed } from "@/lib/appwrite/api";
import { SongReview } from "@/types";
import { useEffect, useState } from "react";

const LibraryReviews = () => {
    const { user } = useUserContext();
    const [reviewed, setReviewed] = useState<SongReview[]>([]);
    const [loading, setLoading] = useState(true);


    const loadReviews = async () => {
        if (user?.accountId) {
            const newReviews = await getReviewed(user.accountId);
            setReviewed(newReviews);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, [user])
    return (
        <div className="song-container">
            <h1 className="text-4xl font-bold">Your Reviews</h1>
            {loading ? 
                (<LoaderMusic />): 
                ('')
            }
            {reviewed.map((s) => (
                <ReviewItemLibrary reviewId={s.reviewId} text={s.text} creator={s.creator} song={s.song} likes={s.likes} createdAt={s.createdAt} updatedAt={s.updatedAt} key={s.reviewId}/>
            ))}
            {!loading && reviewed.length == 0 ? (
            <p>No songs reviewed.</p>): 
            ('')
            }


        </div>
    )
}

export default LibraryReviews