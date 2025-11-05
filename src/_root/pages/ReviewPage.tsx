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
  addCommentToReview,
  timeAgo,
} from "@/lib/appwrite/api";
import LoaderMusic from "@/components/shared/loaderMusic";
import { Comment } from "@/types";




export default function ReviewPage() {
  const { id } = useParams(); // review id from URL
  const { user } = useUserContext();
  const navigate = useNavigate();

  const [review, setReview] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [openRepliesFor, setOpenRepliesFor] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");


  useEffect(() => {
    if (!id) return;
    loadReview();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    loadLikeStatus();
  }, [user, id]);

  const loadReview = async () => {
    const data = await getReviewById(id || "");
    setReview(data);
    setLikeCount(data?.likes || 0);
    setComments(data?.comments || []);

    if (!data) {
      setReview(data);
      setLikeCount(0);
    }
  };

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

  const handleAddComment = async () => {
    if (!user) return alert("You must be logged in to like reviews.");
    if (!id) return alert("can't add a comment to a non existant review");
    await addCommentToReview(id, user.accountId, commentInput);
    setCommentInput("");
    setShowCommentInput(false);
    loadReview();
  }


  const handleReply = async (parentId: string) => {
    if (!user) return alert("You must be logged in to reply.");
    if (!replyText.trim()) return;

    await addCommentToReview(id!, user.accountId, replyText, parentId);

    setReplyTo(null);
    setReplyText("");

    loadReview();
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
              <p className="text-gray-500 text-sm">{review.created_at}</p>
            </div>
          </div>

          <Link
            to={
              review.type == "song"
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
                {review.type == "song" ? "Song" : "Album"}
              </p>
            </div>
          </Link>

          {/* Review Text */}
          <p className="text-gray-100 text-lg mb-4">{review.text}</p>

          {/* Like Section */}
          <div className="flex items-center gap-2 mb-6 w-full">
            <button onClick={handleLikeClick} className="relative flex items-center">
              <Heart
                size={26}
                className={`transition-all duration-200 ${liked ? "text-transparent scale-110" : "text-gray-400 hover:text-red-400"
                  }`}
                fill={liked ? "red" : "none"}
              />
            </button>

            <span className="text-gray-300">{likeCount} likes</span>


            <span className="text-gray-500 text-sm ml-auto">
              {timeAgo(review.createdAt)}
            </span>
          </div>


          <h2 className="text-white font-semibold mb-3">Comments</h2>

          <div className="space-y-4 mb-6">
            {comments.length === 0 && (
              <p className="text-gray-500">No comments yet. Be the first!</p>
            )}



            {comments
              .filter((r) => !r.parentId)
              .map((c) => {
                const replies = comments.filter(r => r.parentId === c.commentId);
                return (<div>
                  <div key={c.commentId} className="flex items-start gap-3">
                    {/* Avatar */}
                    <Link to={`/profile/${c.creator.accountId}`}>
                      <img
                        src={c.creator?.imageUrl || defaultAvatar}
                        className="h-9 w-9 rounded-full object-cover border border-gray-700"
                      />
                    </Link>

                    {/* Comment Bubble */}
                    <div className="flex-1 bg-gray-800/40 border border-gray-700 rounded-xl p-3">
                      <p className="text-sm text-gray-200 leading-snug">
                        <Link to={`/profile/${c.creator.accountId}`}>
                          <span className="font-semibold text-white hover:underline cursor-pointer">
                            {c.creator?.username}
                          </span>{" "}
                        </Link>
                        {c.text}
                      </p>

                      {/* Meta Row */}
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{timeAgo(c.createdAt)}</span>
                        <button
                          className="hover:text-gray-300 transition cursor-pointer"
                          onClick={() => setReplyTo(c.commentId)}
                        >
                          Reply
                        </button>
                      </div>

                      {/* Reply Input Field */}
                      {replyTo === c.commentId && (
                        <div className="flex gap-2 mt-2 ml-1">
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-lg px-2 py-1 text-sm"
                          />
                          <button
                            onClick={() => handleReply(c.commentId)}
                            className="bg-green-500 hover:bg-green-400 text-black text-sm px-3 py-1 rounded-lg"
                          >
                            Send
                          </button>
                        </div>
                      )}

                    </div>

                  </div>
                  {/* Replies */}
                  {replies.length > 0 && (
                    <button
                      className="text-xs text-gray-400 hover:text-white ml-12"
                      onClick={() => setOpenRepliesFor(
                        openRepliesFor === c.commentId ? null : c.commentId
                      )}
                    >
                      {openRepliesFor === c.commentId
                        ? "Hide replies"
                        : `View ${replies.length} replies`}
                    </button>
                  )}

                  {openRepliesFor === c.commentId && replies.map((reply) => (
                    <div key={reply.commentId} className="flex gap-3 mt-3 ml-10">
                      <Link to={`/profile/${c.creator.accountId}`}>
                        <img
                          src={reply.creator?.imageUrl || defaultAvatar}
                          className="h-7 w-7 rounded-full border border-gray-700"
                        />
                      </Link>
                      <div className="bg-gray-800/30 border border-gray-700 p-2 rounded-xl">
                        <p className="text-sm text-gray-300">
                          <Link to={`/profile/${c.creator.accountId}`}>
                            <span className="font-semibold text-white hover:underline cursor-pointer">
                              {reply.creator?.username}
                            </span>
                          </Link>{" "}
                          {reply.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {timeAgo(reply.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}

                </div>)
              }

              )}
          </div>

          {/* Comment Input */}
          {!showCommentInput && (
            <button
              onClick={() => setShowCommentInput(true)}
              className="text-gray-400 hover:text-white"
            >
              Add a comment...
            </button>
          )}

          {/* Show input only when opened */}
          {showCommentInput && (
            <div className="flex gap-2 items-center mt-3">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 focus:border-gray-500"
              />
              <button
                onClick={handleAddComment}
                className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-xl font-medium"
              >
                Post
              </button>
            </div>
          )}
        </>)}
    </div>

  );
}
