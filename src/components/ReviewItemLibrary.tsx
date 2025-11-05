import { Review } from "@/types";
import { useState } from "react";
import { Link } from "react-router-dom";

interface ReviewItemProps {
    review: Review;
}

const ReviewItemLibrary = ({ review }: ReviewItemProps) => {
    const [expanded, setExpanded] = useState(false);
    const toggleExpanded = () => setExpanded(!expanded);

    const isLong = review.text.length > 400;
    const displayText = !expanded && isLong ? review.text.slice(0, 400) + "..." : review.text;

    return (
        <Link to={`/review/${review.reviewId}`}>
        <li className="review-container flex flex-col sm:flex-row items-start gap-4 w-full max-w-screen-md bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors">

            {/* Album/Song cover + title */}
            <Link
                to={review.type === "song" ? `/song/${review.id}` : `/album/${review.id}`}
                className="flex-shrink-0 flex flex-col items-center sm:items-start"
            >
                <img
                    src={review.album_cover_url || "/assets/icons/music-placeholder.svg"}
                    alt={review.name}
                    className="h-24 w-24 sm:w-24 sm:h-24 rounded-md object-cover mb-2 sm:mb-0"
                />
                <p className="text-indigo-200 font-semibold text-center sm:text-left truncate max-w-[150px]">
                    {review.name}
                </p>
            </Link>

            {/* Review text */}
            <div className="flex-1 text-gray-200 text-sm">
                <p className="whitespace-pre-line">{displayText}</p>
                {isLong && (
                    <button
                        onClick={toggleExpanded}
                        className="mt-1 text-indigo-300 text-sm hover:text-indigo-400 font-medium"
                    >
                        {expanded ? "Show less" : "Read more"}
                    </button>
                )}

                {/* Date */}
                <p className="text-xs text-gray-400 mt-1">
                    {new Date(review.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    })}
                </p>
            </div>
        </li>
        </Link>
    );
};

export default ReviewItemLibrary;
