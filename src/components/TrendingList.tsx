import { Link } from "react-router-dom";
import { timeAgo } from "@/lib/appwrite/api";

interface TrendingListProps {
    title: string;
    items: any[];
    type: "songs" | "albums" | "reviews";
}

const TrendingList = ({ title, items, type }: TrendingListProps) => {
    return (
        <div className="common-container max-w-7xl mx-auto px-4 py-10">
        <div className="mb-10 flex items-center gap-4">
            <Link to="/trending" className="text-gray-500 hover:text-white transition-colors">
            &larr; Back
            </Link>
            <h1 className="text-4xl font-bold text-white tracking-tight">
            <span className="text-emerald-500">#</span> {title}
            </h1>
        </div>

        {/* Dynamic Layouts */}
        {type === "songs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((song, index) => (
                <Link to={`/song/${song.songId}`} key={song.songId} 
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-900/40 border border-gray-800 hover:border-emerald-500/50 transition-all group">
                <span className="text-gray-600 font-bold w-6">{index + 1}</span>
                <img src={song.albumCoverUrl} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate group-hover:text-emerald-400">{song.title}</p>
                    <p className="text-gray-500 text-sm">{song.playCount} plays</p>
                </div>
                </Link>
            ))}
            </div>
        )}

        {type === "albums" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {items.map((album) => (
                <Link to={`/album/${album.albumId}`} key={album.albumId} className="group">
                <div className="relative aspect-square overflow-hidden rounded-2xl mb-3 shadow-lg">
                    <img src={album.albumCoverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <p className="text-white font-bold truncate">{album.title}</p>
                <p className="text-gray-500 text-xs">{album.playCount} listeners</p>
                </Link>
            ))}
            </div>
        )}

        {type === "reviews" && (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {items.map((review) => (
                <div key={review.reviewId} className="break-inside-avoid p-6 rounded-2xl border border-gray-800 bg-gray-900/40 hover:border-emerald-500/30 transition-all">
                <div className="flex justify-between items-center mb-4">
                    <Link to={`/profile/${review.userId}`} className="font-bold text-emerald-400">@{review.username}</Link>
                    <span className="text-gray-500 text-xs">{timeAgo(review.createdAt)}</span>
                </div>
                <p className="text-gray-200 italic mb-4">"{review.reviewText}"</p>
                <Link to={review.targetType === "song" ? `/song/${review.targetId}` : `/album/${review.targetId}`} 
                        className="flex items-center gap-3 p-2 rounded-lg bg-black/40">
                    <img src={review.albumCoverUrl} className="w-10 h-10 rounded shadow-md" />
                    <span className="text-xs font-semibold text-white truncate">{review.targetName}</span>
                </Link>
                </div>
            ))}
            </div>
        )}
        </div>
    );
};

export default TrendingList;