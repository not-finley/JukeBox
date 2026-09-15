import { Link } from "react-router-dom";
import { Activity } from "@/types";
import { timeAgo } from "@/lib/supabase/api";
import StarIcon from '@/components/shared/StarIcon';
import defaultAvatar from "/assets/icons/profile-placeholder.svg";

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
      {/* Top User Info Bar (Compact & Full Width) */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link to={`/profile/${activity.userId}`} onClick={(e) => e.stopPropagation()} className="shrink-0">
            <img
              src={activity.profileUrl || defaultAvatar}
              alt={activity.username}
              className="w-8 h-8 rounded-full object-cover border border-gray-700"
              onError={(e) => {
                  (e.target as HTMLInputElement).src = defaultAvatar;
              }}
            />
          </Link>
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <Link
              to={`/profile/${activity.userId}`}
              className="font-bold text-gray-200 hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {activity.username}
            </Link>
            <span className="text-gray-500 shrink-0">
              {isAggregated ? "juked an album" : activityTypeToPastTense(activity.type).toLowerCase()}
            </span>
            <span className="text-gray-600 px-1">•</span>
            <span className="text-gray-500 text-[10px] uppercase tracking-wider shrink-0">
              {timeAgo(activity.date)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Entire block wrapped in Link to song/album */}
      <Link
        to={primaryLink}
        className="flex gap-3.5 items-center group cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Album / Song Thumbnail */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden border border-gray-800 bg-black/40">
          <img
            src={activity.album_cover_url || "/assets/icons/empty-state.svg"}
            alt={activity.targetName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Details, Stars & Review Text making full use of horizontal space */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {activity.text ? (
            // Layout WITH review text (stacked content)
            <div className="flex flex-col">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="font-bold text-white group-hover:text-emerald-400 text-md sm:text-base truncate transition-colors">
                  {activity.targetName}
                </span>

                {activity.rating && (
                  <div className="flex gap-1 shrink-0">
                    {[...Array(5)].map((_, i) => {
                      const ratingValue = activity.rating || 0;
                      const fillLevel = Math.max(0, Math.min(1, ratingValue - i));
                      return <StarIcon key={i} fillLevel={fillLevel} sizeClass="w-5 h-5" />;
                    })}
                  </div>
                )}
              </div>

              <p className="text-gray-300 text-xs sm:text-sm italic leading-relaxed line-clamp-2 mt-1">
                &ldquo;{activity.text}&rdquo;
              </p>
            </div>
          ) : (
            // Layout WITHOUT review text (vertically centered use of space)
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-white group-hover:text-emerald-400 text-md sm:text-base truncate transition-colors">
                {activity.targetName}
              </span>

              {activity.rating && (
                <div className="flex gap-1 shrink-0">
                  {[...Array(5)].map((_, i) => {
                    const ratingValue = activity.rating || 0;
                    const fillLevel = Math.max(0, Math.min(1, ratingValue - i));
                    return <StarIcon key={i} fillLevel={fillLevel} sizeClass="w-5 h-5" />;
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Link>

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
                <div key={g.id || idx} className="flex items-center justify-between text-[12px] py-1">
                  <Link
                    to={`/song/${g.targetId}`}
                    className="text-gray-300 hover:text-white truncate max-w-[280px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {g.targetName}
                  </Link>
                  <span className="text-gray-500 text-[12px]">
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