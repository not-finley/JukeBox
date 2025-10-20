import { SongReview } from '@/types';
import { useState } from 'react'
import { Link } from 'react-router-dom';

const ReviewItemLibrary = (review : SongReview ) => {
    const [longVis, setLongVis] = useState(false);
    const toggleLongVis = () => setLongVis(!longVis);

return (
    <li key={review.reviewId} className="review-container flex items-start gap-4 w-full max-w-screen-md -mb-4">
                <Link to={`/song/${review.song.songId}`}>
                <img
                    src={review.song.album_cover_url}
                    className="h-24 min-w-24"
                />
                <p className='mt-2'>{review.song.title}</p>
                </Link>
                <div>
                {!longVis && review.text.length > 400 ? (
                <p className="text-gray-200 text-sm w-fit">
                    {review.text.slice(0, 400)} ...
                    <button
                        onClick={toggleLongVis}
                        className="text-white hover:text-green-400"
                    >
                        more
                    </button>
                    </p>
                ) : (
                    <p className="text-gray-200 text-sm w-fit">{review.text}</p>
                )}
            </div>
    </li>
)
};

export default ReviewItemLibrary