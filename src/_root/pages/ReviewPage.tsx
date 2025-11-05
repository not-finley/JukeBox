import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import defaultAvatar from "/assets/icons/profile-placeholder.svg";
import { useUserContext } from "@/lib/AuthContext";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";



import {
  addLikeToReview,
  removeLikeFromReview,
  checkIfUserLikedReview,
  getReviewById,
} from "@/lib/appwrite/api";
import LoaderMusic from "@/components/shared/loaderMusic";


const comments: any = [];


export default function ReviewPage() {
  const { id } = useParams(); // review id from URL
  const { user } = useUserContext();
  const navigate = useNavigate();

  const [review, setReview] = useState<any>(null);
  // const [comments, setComments] = useState<any[]>([]);
  // const [commentInput, setCommentInput] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    loadReview();
    // loadComments();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    loadLikeStatus();
  }, [user, id]);

  const loadReview = async () => {
    const data = await getReviewById(id || "");
    setReview(data);
    setLikeCount(data?.likes || 0);

    if (!data) {
      setReview(data);
      setLikeCount(0);
    }
  };

  // const loadComments = async () => {
  //   return;
  // };

  const loadLikeStatus = async () => {
    const hasLiked = await checkIfUserLikedReview(id!, user.accountId);
    setLiked(hasLiked);
  };

  const handleLikeClick = async () => {
    if (!user) return alert("You must be logged in to like reviews.");

    if (liked) {
      const success = await removeLikeFromReview(id!, user.accountId);
      if (success) {
        setLiked(false);
        setLikeCount((n) => n - 1);
      }
    } else {
      const success = await addLikeToReview(id!, user.accountId);
      if (success) {
        setLiked(true);
        setLikeCount((n) => n + 1);
      }
    }
  };




  return (

    <div className=" min-h-[calc(100dvh-145px)] w-full max-w-2xl mx-auto px-4 py-6">
      {!review && (
        <LoaderMusic />
      )}
      {review && (
        <>
          {/* Back */}
          <button onClick={() => {
            if (window.history.length > 2) navigate(-1);
            else navigate(`${review.type == "song" ? `/album/${review.id}` : `/song/${review.id}`}`);
          }} className="text-gray-400 hover:text-white mb-4 inline-block">
            ← Back
          </button>

          {/* Review Header */}
          <div className="flex items-center gap-3 mb-4">
            <Link
              to={`/profile/${review.creator.accountId}`}
            >
              <img
                src={review.creator?.imageUrl || defaultAvatar}
                alt=""
                className="h-12 w-12 rounded-full object-cover border border-gray-700"
              />
            </Link>
            <div>
              <Link
                to={`/profile/${review.creator.accountId}`}
                className="underline text-white hover:text-green-400"
              >
                <p className="text-gray-300 font-semibold hover:text-green-400">
                  {review.creator?.username}
                </p>
              </Link>
              <p className="text-gray-500 text-sm">{review.created_at?.slice(0, 10)}</p>
            </div>
          </div>

          <Link
            to={
              review.type === "song"
                ? `/song/${review.id}`
                : `/album/${review.id}`
            }
            className="flex items-center gap-3 mb-4 hover:opacity-80 transition"
          >
            <img
              src={review.album_cover_url}
              alt={review.name}
              className="w-16 h-16 rounded-md object-cover border border-gray-700"
            />
            <div>
              <p className="text-white font-semibold">{review.name}</p>
              <p className="text-gray-400 text-sm">
                {review.targetType === "song" ? "Song" : "Album"}
              </p>
            </div>
          </Link>

          {/* Review Text */}
          <p className="text-gray-100 text-lg mb-4">{review.text}</p>

          {/* Like Section */}
          <div className="flex items-center gap-2 mb-6">
            <button onClick={handleLikeClick} className="relative flex items-center">
              <Heart
                size={26}
                className={`transition-all duration-200 ${liked ? "text-transparent scale-110" : "text-gray-400 hover:text-red-400"
                  }`}
                fill={liked ? "red" : "none"}
              />
            </button>
            <span className="text-gray-300">{likeCount} likes</span>
          </div>

          {/* Comments */}
          <h2 className="text-white font-semibold mb-2">Comments</h2>

          <div className="space-y-3 mb-6">
            {comments.length === 0 && (
              <p className="text-gray-500">No comments yet. Be the first!</p>
            )}

            {comments.map((c: any) => (
              <div key={c.id} className="flex items-start gap-3">
                <img
                  src={c.user?.imageUrl || defaultAvatar}
                  className="h-8 w-8 rounded-full object-cover border border-gray-700"
                />
                <div>
                  <p className="text-gray-200 text-sm">
                    <span className="font-semibold text-white">
                      {c.user?.username}
                    </span>{" "}
                    {c.comment_text}
                  </p>
                  <p className="text-gray-500 text-xs">{c.created_at.slice(0, 10)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          {/* <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 text-white rounded px-3 py-2"
        />
        <button
          onClick={handleAddComment}
          className="bg-green-500 hover:bg-green-400 text-black px-4 rounded"
        >
          Post
        </button>
      </div> */}
        </>)}
    </div>

  );
}
