import { Link } from "react-router-dom";
import { Activity } from "@/types";
import { timeAgo } from "@/lib/supabase/api";

interface FeedCardProps {
  activity: Activity;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReviewClick: () => void;
  activityTypeToPastTense: (type: string) => string;
}

export const FeedCard = ({
  activity,
  isExpanded,
  onToggleExpand,
  onReviewClick,
  activityTypeToPastTense,
}: FeedCardProps) => {
  const isAggregated = (activity as Activity & { isAggregated?: boolean }).isAggregated;
  const groupedActivities =
    (activity as Activity & { groupedActivities?: Activity[] }).groupedActivities || [];
  const primaryLink =
    activity.targetType === "song" ? `/song/${activity.targetId}` : `/album/${activity.targetId}`;

  return (
    <div
      onClick={() => {
        if (activity.type === "review") onReviewClick();
      }}
      className={`flex flex-col border border-gray-800/80 rounded-xl bg-gray-900/40 p-4 transition-all duration-200 ${
        activity.type === "review" ? "hover:border-gray-700 hover:bg-gray-900/70 cursor-pointer" : ""
      } shadow-md`}
    >
      {/* Top User Info Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Link to={`/profile/${activity.userId}`} onClick={(e) => e.stopPropagation()}>
            <img
              src={activity.profileUrl || "/assets/icons/profile-placeholder.svg"}
              alt={activity.username}
              className="w-6 h-6 rounded-full object-cover border border-gray-700"
            />
          </Link>
          <div className="flex items-center gap-1.5 text-xs">
            <Link
              to={`/profile/${activity.userId}`}
              className="font-bold text-gray-200 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {activity.username}
            </Link>
            <span className="text-gray-500">
              {isAggregated ? "juked an album" : activityTypeToPastTense(activity.type).toLowerCase()}
            </span>
          </div>
        </div>
        <span className="text-gray-500 text-[10px] uppercase tracking-wider">
          {timeAgo(activity.date)}
        </span>
      </div>

      {/* Main Content Row: Thumbnail + Details (Letterboxd Style) */}
      <div className="flex gap-3.5 items-start">
        {/* Album / Song Thumbnail */}
        <Link
          to={primaryLink}
          className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden border border-gray-800 bg-black/40 group"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={activity.album_cover_url || "/assets/icons/empty-state.svg"}
            alt={activity.targetName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Details & Review Text */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col mb-1">
            <Link
              to={primaryLink}
              className="font-bold text-white hover:text-emerald-400 text-sm sm:text-base truncate transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {activity.targetName}
            </Link>
          </div>

          {/* Rating Stars */}
          {activity.rating && (
            <div className="flex gap-0.5 mb-1.5">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${
                    i < (activity.rating || 0) ? "text-yellow-400" : "text-gray-700"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          )}

          {/* Review or Log Text Snippet */}
          {activity.text && (
            <p className="text-gray-300 text-xs sm:text-sm italic leading-relaxed line-clamp-2">
              &ldquo;{activity.text}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Aggregated Batch Section (If Juked multiple tracks) */}
      {isAggregated && groupedActivities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-800/60">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="flex items-center justify-between w-full text-xs text-emerald-400 hover:text-emerald-300 font-medium py-1"
          >
            <span>{groupedActivities.length} tracks rated</span>
            <span>{isExpanded ? "Hide" : "Show"}</span>
          </button>

          {isExpanded && (
            <div className="mt-2 space-y-1.5 pl-2 border-l border-emerald-500/30">
              {groupedActivities.map((g, idx) => (
                <div key={g.id || idx} className="flex items-center justify-between text-xs py-1">
                  <Link
                    to={`/song/${g.targetId}`}
                    className="text-gray-300 hover:text-white truncate max-w-[200px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {g.targetName}
                  </Link>
                  <span className="text-gray-500 text-[10px]">
                    {g.rating ? `${g.rating} ★` : "Listened"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};