import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import defaultAvatar from "/assets/icons/profile-placeholder.svg";
import { AlbumReview, SongReview } from "@/types";
import { useUserContext } from "@/lib/AuthContext";
import {
  addLikeToReview,
  removeLikeFromReview,
  checkIfUserLikedReview,
} from "@/lib/appwrite/api";
import { Heart } from "lucide-react";

const ReviewItem = (
  review: SongReview | AlbumReview,
) => {
  const [showFull, setShowFull] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review.likes ?? 0);

  const { user } = useUserContext(); // logged-in user

  const toggleShowFull = () => setShowFull(!showFull);

  const MAX_LENGTH = 400;
  const isLong = review.text.length > MAX_LENGTH;

  useEffect(() => {
    const loadLikeStatus = async () => {
      if (!user) return;
      const hasLiked = await checkIfUserLikedReview(review.reviewId, user.accountId);
      setLiked(hasLiked);
    };
    loadLikeStatus();
  }, [user]);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) return alert("You must be logged in to like reviews.");

    if (liked) {
      const success = await removeLikeFromReview(review.reviewId, user.accountId);
      if (success) {
        setLiked(false);
        setLikeCount((prev) => prev - 1);
      }
    } else {
      const success = await addLikeToReview(review.reviewId, user.accountId);
      if (success) {
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    }
  };

  return (
    <Link to={`/review/${review.reviewId}`}>
      <li className="review-container flex items-start gap-4 mb-6">
        <Link
              to={`/profile/${review.creator.accountId}`}
            >
        <img
          src={review.creator.imageUrl || defaultAvatar}
          alt={review.creator.username}
          className="h-12 w-12 rounded-full object-cover border border-gray-700"
        />
        </Link>

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
                onClick={(e) => {
                  e.preventDefault();
                  toggleShowFull();
                }}
                className="ml-1 text-green-400 hover:text-green-300 font-medium"
              >
                {showFull ? "less" : "more"}
              </button>
            )}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            handleLikeClick(e);
          }}
          className="relative self-center flex items-center justify-center"
        >
          <Heart
            size={22}
            className={`transition-all duration-200 ${liked
                ? "text-transparent scale-110"
                : "text-gray-400 hover:text-red-400"
              }`}
            fill={liked ? "red" : "none"}
          />

          {/* Like count in top-right corner */}
          <span
            className="absolute -top-2 -right-3 text-xs text-gray-300 bg-black/60 px-1 rounded"
          >
            {likeCount}
          </span>
        </button>

      </li>
    </Link>
  );
};

export default ReviewItem;
