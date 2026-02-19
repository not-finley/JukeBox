import { Review } from "@/types";
import { useState } from "react";
import { Link } from "react-router-dom";
import { timeAgo } from "@/lib/appwrite/api"; // Assuming timeAgo is available here too

interface ReviewItemProps {
    review: Review;
}

const ReviewItemLibrary = ({ review }: ReviewItemProps) => {
    const [expanded, setExpanded] = useState(false);
    
    // Prevent the click from navigating to the review page when clicking "Read More"
    const toggleExpanded = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpanded(!expanded);
    };

    const isLong = review.text.length > 250;
    const displayText = !expanded && isLong ? review.text.slice(0, 250) + "..." : review.text;

    return (
        <div className="flex flex-col gap-3 p-5 rounded-2xl bg-gray-900/40 border border-gray-800 hover:border-emerald-500/30 transition-all group relative">
            
            {/* Top Row: User & Date & Likes */}
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-1">
                        {review.type} Review
                    </span>
                    <span className="text-gray-400 text-[11px]">
                        {timeAgo(review.createdAt)}
                    </span>
                </div>

                {/* Like Count Badge (Matches Trending "Latest Buzz") */}
                <div className="flex items-center gap-1.5 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                    <span className="text-pink-500 text-xs">❤️</span>
                    <span className="text-pink-500 text-xs font-bold">{review.likes || 0}</span>
                </div>
            </div>

            {/* Middle: The Review Text */}
            <Link to={`/review/${review.reviewId}`} className="block">
                <p className="text-gray-200 text-sm leading-relaxed italic italic-font">
                    "{displayText}"
                </p>
                {isLong && (
                    <button
                        onClick={toggleExpanded}
                        className="mt-2 text-emerald-400 text-xs hover:text-emerald-300 font-semibold"
                    >
                        {expanded ? "Show less" : "Read more"}
                    </button>
                )}
            </Link>

            {/* Bottom: Music Reference Card (Matches Trending style) */}
            <Link 
                to={review.type === "song" ? `/song/${review.id}` : `/album/${review.id}`}
                className="flex items-center gap-3 mt-2 p-2 rounded-xl bg-black/30 hover:bg-black/50 border border-gray-800/50 transition-colors"
            >
                <img
                    src={review.album_cover_url || "/assets/icons/music-placeholder.png"}
                    alt={review.name}
                    className="h-12 w-12 rounded-lg object-cover shadow-sm"
                />
                <div className="flex flex-col min-w-0">
                    <p className="text-emerald-400 text-xs font-bold truncate">
                        {review.name}
                    </p>
                    <p className="text-gray-500 text-[10px] uppercase font-medium">
                        View {review.type}
                    </p>
                </div>
            </Link>
        </div>
    );
};

export default ReviewItemLibrary;