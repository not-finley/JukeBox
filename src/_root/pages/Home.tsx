import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import LoaderMusic from "@/components/shared/loaderMusic";
import { Activity } from "@/types";
import { useUserContext } from "@/lib/AuthContext";
import { getRecentFollowedActivities, timeAgo } from "@/lib/appwrite/api";

const PAGE_SIZE = 10;

const Home = () => {
  const { user } = useUserContext();
  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  // Fetch activities
  const fetchFeed = useCallback(async (initial = false) => {
  if (!user?.accountId || loadingRef.current) return;

  if (!initial && !hasMore) return; // use latest hasMore state

  loadingRef.current = true;
  initial ? setLoading(true) : setLoadingMore(true);

  try {
    console.log(`Fetching ${initial ? "initial" : "more"} feed. Offset:`, offsetRef.current);
    const data = await getRecentFollowedActivities(
      user.accountId,
      PAGE_SIZE,
      offsetRef.current
    );

    setActivityFeed(prev => initial ? data : [...prev, ...data]);

    if (data.length < PAGE_SIZE) {
      setHasMore(false);
    } else {
      offsetRef.current += PAGE_SIZE;
    }
  } catch (err) {
    console.error("Error fetching feed:", err);
    setHasMore(false);
  } finally {
    loadingRef.current = false;
    initial ? setLoading(false) : setLoadingMore(false);
  }
}, [user?.accountId]);

  // Initial fetch when user changes
  useEffect(() => {
    offsetRef.current = 0;
    setActivityFeed([]);
    setHasMore(true);
    fetchFeed(true);
  }, [user?.accountId, fetchFeed]);



  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMoreRef.current) {
            console.log("🎯 Sentinel is visible! Scroll reached the bottom.");
            fetchFeed(false);
          }
        });
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activityFeed, fetchFeed]);

  const activityTypeToPastTense = (type: string) => {
    switch (type) {
      case "rating": return "rated";
      case "review": return "reviewed";
      default: return "listened to";
    }
  };

  if (loading) {
    return (
      <div className="common-container flex justify-center items-center ">
        <LoaderMusic />
      </div>
    );
  }

  if (activityFeed.length === 0) {
    return (
      <div className="common-container flex flex-col items-center justify-center text-center text-gray-300">
        <p className="text-lg mb-3">Your feed is quiet...</p>
        <p className="text-gray-400 mb-6">Discover users with similar taste.</p>
        <Link
          to="/search"
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium transition"
        >
          Find Users to Follow
        </Link>
      </div>
    );
  }

  return (
    <div className="common-container flex flex-col items-center w-full px-4 sm:px-8 lg:px-16 py-6">
      <div className="flex flex-col gap-6 w-full max-w-2xl">
        {activityFeed.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 border-b border-gray-700 pb-4">
            <Link to={`/profile/${activity.userId}`}>
              <img
                src={activity.profileUrl}
                alt={activity.username}
                className="w-12 h-12 rounded-full object-cover hover:opacity-90 transition"
              />
            </Link>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-1 text-gray-300">
                <Link to={`/profile/${activity.userId}`} className="font-semibold hover:text-white">
                  {activity.username}
                </Link>
                <span className="text-gray-400">{activityTypeToPastTense(activity.type)}</span>
                <Link
                  to={activity.targetType === "song" ? `/song/${activity.targetId}` : `/album/${activity.targetId}`}
                  className="hover:text-white font-medium"
                >
                  {activity.targetName}
                </Link>
              </div>
              {activity.text && <p className="text-gray-400 mt-2 italic">“{activity.text}”</p>}
              {activity.rating && (
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-sm ${i < (activity.rating ||  0) ? "text-yellow-400" : "text-gray-500"}`}>
                      ★
                    </span>
                  ))}
                </div>
              )}
              <p className="text-gray-500 text-sm mt-1">{timeAgo(activity.date)}</p>
            </div>
            {activity.album_cover_url && (
              <Link to={activity.targetType === "song" ? `/song/${activity.targetId}` : `/album/${activity.targetId}`}>
                <img
                  src={activity.album_cover_url}
                  alt={activity.targetName}
                  className="w-20 h-20 rounded-md object-cover hover:opacity-90 transition"
                />
              </Link>
            )}
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        <div
          ref={sentinelRef}
          className="h-32 flex justify-center items-center"
        >
          {loadingMore && <LoaderMusic />}
          {!hasMore && <p className="text-gray-500 text-sm mt-2">No more activity</p>}
        </div>

      </div>
    </div>
  );
};

export default Home;
