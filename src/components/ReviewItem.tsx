import { useState } from "react";
import { Link } from "react-router-dom";
import defaultAvatar from "/assets/icons/profile-placeholder.svg"; 
import { AlbumReview, SongReview } from "@/types";

const ReviewItem = (review: SongReview | AlbumReview) => {
  const [showFull, setShowFull] = useState(false);
  const toggleShowFull = () => setShowFull(!showFull);

  const MAX_LENGTH = 400;
  const isLong = review.text.length > MAX_LENGTH;

  return (
    <li className="review-container flex items-start gap-4 mb-6">
      <img
        src={review.creator.imageUrl || defaultAvatar}
        alt={review.creator.username}
        className="h-12 w-12 rounded-full object-cover border border-gray-700"
      />
      <div className="flex-1">
        <p className="text-gray-400 text-sm mb-1">
          Reviewed by{" "}
          <Link
            to={`/profile/${review.creator.accountId}`}
            className="underline text-white hover:text-green-400"
          >
            {review.creator.username}
          </Link>
        </p>

        <p className="text-gray-200 text-sm">
          {isLong && !showFull
            ? `${review.text.slice(0, MAX_LENGTH)}...`
            : review.text}
          {isLong && (
            <button
              onClick={toggleShowFull}
              className="ml-1 text-green-400 hover:text-green-300 font-medium"
            >
              {showFull ? "less" : "more"}
            </button>
          )}
        </p>
      </div>
    </li>
  );
};

export default ReviewItem;