import { Review } from '@/types';
import { useState } from 'react'
import { Link } from 'react-router-dom';

const ReviewItem = (review : Review ) => {
    const [longVis, setLongVis] = useState(false);
    const toggleLongVis = () => setLongVis(!longVis);

    return (
        <li className="review-container flex items-start gap-4 mb-6">
        <img
            src={review.creator.imageUrl}
            alt={review.creator.username}
            className="h-10 w-10 rounded-full"
        />
        <div>
            <p>
            Reviewed by{" "}
            <Link to={`/profile/${review.creator.accountId}`} className="underline">
                {review.creator.username}
            </Link>
            </p>
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
    );
};

export default ReviewItem