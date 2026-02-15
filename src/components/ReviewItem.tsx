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
import AuthModal from "@/components/shared/AuthModal"; // Import your modal

const ReviewItem = (review: SongReview | AlbumReview) => {
  const [showFull, setShowFull] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review.likes ?? 0);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { user, isAuthenticated } = useUserContext();

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
  }, [user, review.reviewId]);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // 1. DISABLE LIKE FOR GUESTS - Trigger Modal
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

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
    <>
      <Link to={`/review/${review.reviewId}`}>
        <li className="review-container flex items-start gap-4 mb-6 p-4 rounded-xl border border-gray-800 bg-gray-900/20 hover:border-gray-700 transition-all">
          <Link to={`/profile/${review.creator.accountId}`}>
            <img
              src={review.creator.imageUrl || defaultAvatar}
              alt={review.creator.username}
              className="h-12 w-12 rounded-full object-cover border border-gray-700"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = defaultAvatar;
              }}
            />
          </Link>

          <div className="flex-1">
            <p className="text-gray-400 text-sm mb-1">
              Reviewed by{" "}
              <Link
                to={`/profile/${review.creator.accountId}`}
                className="underline text-white hover:text-emerald-400" 
              >
                {review.creator.username}
              </Link>
            </p>

            <p className="text-gray-200 text-sm leading-relaxed">
              {isLong && !showFull
                ? `${review.text.slice(0, MAX_LENGTH)}...`
                : review.text}
              {isLong && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleShowFull();
                  }}
                  className="ml-2 text-emerald-500 hover:text-emerald-400 font-semibold"
                >
                  {showFull ? "show less" : "read more"}
                </button>
              )}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              handleLikeClick(e);
            }}
            className="relative self-center flex items-center justify-center p-2 group"
          >
            <Heart
              size={22}
              className={`transition-all duration-300 ${
                liked
                  ? "text-red-500 scale-110 fill-red-500"
                  : "text-gray-500 group-hover:text-red-400"
              }`}
            />

            <span className="absolute -top-1 -right-1 text-[10px] font-bold text-gray-400 bg-dark-3 px-1.5 py-0.5 rounded-full border border-gray-800">
              {likeCount}
            </span>
          </button>
        </li>
      </Link>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default ReviewItem;