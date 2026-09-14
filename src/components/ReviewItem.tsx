import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import defaultAvatar from "/assets/icons/profile-placeholder.svg";
import { AlbumReview, SongReview } from "@/types";
import { useUserContext } from "@/lib/AuthContext";
import {
  addLikeToReview,
  removeLikeFromReview,
  checkIfUserLikedReview,
} from "@/lib/supabase/api";
import { Heart } from "lucide-react";
import AuthModal from "@/components/shared/AuthModal";

const ReviewItem = (review: SongReview | AlbumReview) => {
  const [showFull, setShowFull] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review.likes ?? 0);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { user, isAuthenticated } = useUserContext();

  const toggleShowFull = () => setShowFull(!showFull);

  const MAX_LENGTH = 350;
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

  // Optional: format date nicely if review.createdAt exists
  const formattedDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <>
      <Link to={`/review/${review.reviewId}`} className="block">
        <li className="group relative flex flex-col sm:flex-row items-start gap-4 p-5 rounded-2xl border border-white/5 bg-gray-900/40 hover:bg-gray-900/60 hover:border-white/10 transition-all backdrop-blur-md shadow-lg">
          
          {/* Creator Avatar */}
          <Link 
            to={`/profile/${review.creator.accountId}`} 
            onClick={(e) => e.stopPropagation()} 
            className="shrink-0"
          >
            <img
              src={review.creator.imageUrl || defaultAvatar}
              alt={review.creator.username}
              className="h-11 w-11 rounded-full object-cover border border-white/10 group-hover:border-emerald-500/50 transition-colors"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = defaultAvatar;
              }}
            />
          </Link>

          {/* Review Content Area */}
          <div className="flex-1 min-w-0 w-full">
            {/* Header: Username, Timestamp, & Like button for mobile */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/profile/${review.creator.accountId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-bold text-white hover:text-emerald-400 transition-colors"
                >
                  {review.creator.username}
                </Link>
                {formattedDate && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-xs text-gray-400">{formattedDate}</span>
                  </>
                )}
              </div>
            </div>

            {/* Review Title */}
            {review.title && (
              <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-emerald-400 transition-colors">
                {review.title}
              </h3>
            )}

            {/* Review Body Text */}
            <p className="text-gray-300 text-sm leading-relaxed break-words">
              {isLong && !showFull
                ? `${review.text.slice(0, MAX_LENGTH)}...`
                : review.text}
              {isLong && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleShowFull();
                  }}
                  className="ml-2 text-emerald-400 hover:text-emerald-300 font-semibold text-xs uppercase tracking-wider"
                >
                  {showFull ? "Show less" : "Read more"}
                </button>
              )}
            </p>
          </div>

          {/* Like Button Section */}
          <div className="self-end sm:self-center flex items-center shrink-0 mt-2 sm:mt-0">
            <button
              onClick={handleLikeClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-all group/btn active:scale-95"
            >
              <Heart
                size={18}
                className={`transition-all duration-300 ${
                  liked
                    ? "text-red-500 fill-red-500 scale-110"
                    : "text-gray-400 group-hover/btn:text-red-400"
                }`}
              />
              <span className={`text-xs font-bold ${liked ? "text-red-400" : "text-gray-400"}`}>
                {likeCount}
              </span>
            </button>
          </div>

        </li>
      </Link>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default ReviewItem;