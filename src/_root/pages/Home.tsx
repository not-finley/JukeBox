import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoaderMusic from "@/components/shared/loaderMusic";
import { Activity, ISearchUser } from "@/types";
import { useUserContext } from "@/lib/AuthContext";
import { addFollow, getFollowerSuggestions, getRecentFollowedActivities, timeAgo } from "@/lib/appwrite/api";
import SuggestionsList from "@/components/SuggestionsList";

const PAGE_SIZE = 10;

const Home = () => {
  const { user } = useUserContext();
  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);
  const [filteredFeed, setFilteredFeed] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingFollowerSuggestions, setLoadingFollowerSuggestions] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<"all" | "review" | "rating" | "listen">("all");
  const [followerSuggestions, setFollowerSuggestions] = useState<ISearchUser[]>([])

  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  const navigate = useNavigate();


  const handleFollow = async (userId: string) => {
    try {
      await addFollow(userId, user.accountId);
      setFollowerSuggestions(prev => {
        const updated = prev.filter(u => u.id !== userId);
        localStorage.setItem("follower_suggestions", JSON.stringify(updated));
        return updated;
      });
    }
    catch (err) {
      console.error("Error following:", err);
    }

  }

  // Fetch activities
  const fetchFeed = useCallback(async (initial = false) => {
    if (!user?.accountId || loadingRef.current) return;
    if (!initial && !hasMoreRef.current) return;

    loadingRef.current = true;
    initial ? setLoading(true) : setLoadingMore(true);

    try {
      const data = await getRecentFollowedActivities(
        user.accountId,
        PAGE_SIZE,
        offsetRef.current
      );

      setActivityFeed(prev => (initial ? data : [...prev, ...data]));

      if (data.length < PAGE_SIZE) setHasMore(false);
      else offsetRef.current += PAGE_SIZE;
    } catch (err) {
      console.error("Error fetching feed:", err);
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      initial ? setLoading(false) : setLoadingMore(false);
    }
  }, [user?.accountId]);

  useEffect(() => {
    setLoadingFollowerSuggestions(true);
    const cached = localStorage.getItem("follower_suggestions");
    if (cached) setFollowerSuggestions(JSON.parse(cached));

    // async refresh
    getFollowerSuggestions(user.accountId).then(s => {
      setFollowerSuggestions(s);
      localStorage.setItem("follower_suggestions", JSON.stringify(s));
      setLoadingFollowerSuggestions(false);
    });
  }, [user?.accountId]);

  // Initial fetch
  useEffect(() => {
    offsetRef.current = 0;
    setActivityFeed([]);
    setFollowerSuggestions([]);
    setHasMore(true);
    fetchFeed(true);
  }, [user?.accountId, fetchFeed]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMoreRef.current) fetchFeed(false);
        });
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activityFeed, fetchFeed]);

  // Filter logic
  useEffect(() => {
    if (filter === "all") setFilteredFeed(activityFeed);
    else if (filter === "listen")
      setFilteredFeed(activityFeed.filter(a => a.type !== "review" && a.type !== "rating"));
    else setFilteredFeed(activityFeed.filter(a => a.type === filter));
  }, [filter, activityFeed]);

  const activityTypeToPastTense = (type: string) => {
    switch (type) {
      case "rating": return "rated";
      case "review": return "reviewed";
      default: return "listened to";
    }
  };

  if (loading) {
    return (
      <div className="common-container flex justify-center items-center min-h-[80vh]">
        <LoaderMusic />
      </div>
    );
  }

  if (activityFeed.length === 0) {
    return (
      <div className="common-container flex flex-col items-center justify-center text-center text-gray-300 min-h-[80vh]">
        <img
          src="/assets/icons/empty-state.svg"
          alt="Empty feed"
          className="w-32 h-32 mb-4 opacity-70"
        />
        <p className="text-lg font-semibold mb-2">Your feed is quiet...</p>
        <p className="text-gray-400 mb-6">Follow users to see their music activity.</p>
        <Link
          to="/search"
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium transition"
        >
          Discover People
        </Link>
      </div>
    );
  }

  return (
    <div className="common-container w-full px-4 sm:px-8 lg:px-16 py-6">

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-10 w-full max-w-7xl mx-auto">

        {/* LEFT COLUMN — Main Feed */}
        <div>

          {/* Header */}
          <div className="w-full max-w-2xl mb-8">
            <h1 className="text-2xl font-semibold text-white mb-1">
              Welcome back, {user?.name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="text-gray-400 text-sm">
              See what your friends have been up to lately.
            </p>
          </div>

          {/* Top Navigation */}
          <div className="flex gap-3 mb-6 max-w-2xl overflow-x-auto no-scrollbar py-2">
            {[
              { key: "all", label: "All" },
              { key: "review", label: "Reviews" },
              { key: "rating", label: "Ratings" },
              { key: "listen", label: "Listens" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === tab.key
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex max-w-2xl xl:hidden mb-10">
            <SuggestionsList
              suggestions={followerSuggestions}
              loading={loadingFollowerSuggestions}
              onFollow={handleFollow}
            />
          </div>

          {/* Activity Feed */}
          <div className="flex flex-col gap-6 w-full max-w-2xl mt-2">
            {filteredFeed.map((activity) => {
              const isReview = activity.type === "review";

              return (
                <div
                  key={activity.id}
                  className={`flex items-start gap-4 border-b border-gray-700 pb-4 animate-fadeIn ${isReview ? "cursor-pointer hover:bg-gray-900/40 transition" : ""
                    }`}
                  {...(isReview && {
                    onClick: () => navigate(`/review/${activity.id}`),
                  })}
                >
                  {/* User avatar */}
                  <Link
                    to={`/profile/${activity.userId}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={activity.profileUrl}
                      alt={activity.username}
                      className="w-12 h-12 rounded-full object-cover hover:opacity-90 transition"
                    />
                  </Link>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-1 text-gray-300">
                      <Link
                        to={`/profile/${activity.userId}`}
                        className="font-semibold hover:text-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {activity.username}
                      </Link>

                      <span className="text-gray-400 flex items-center gap-1">
                        {activityTypeToPastTense(activity.type)}
                      </span>

                      <Link
                        to={
                          activity.targetType === "song"
                            ? `/song/${activity.targetId}`
                            : `/album/${activity.targetId}`
                        }
                        className="hover:text-white font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {activity.targetName}
                      </Link>
                    </div>

                    {activity.text && (
                      <p className="text-gray-400 mt-2 italic">“{activity.text}”</p>
                    )}

                    {activity.rating && (
                      <div className="flex items-center mt-1" onClick={(e) => e.stopPropagation()}>
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${i < (activity.rating || 0) ? "text-yellow-400" : "text-gray-500"
                              }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-gray-500 text-sm mt-1">
                      {timeAgo(activity.date)}
                    </p>
                  </div>

                  {activity.album_cover_url && (
                    <Link
                      to={
                        activity.targetType === "song"
                          ? `/song/${activity.targetId}`
                          : `/album/${activity.targetId}`
                      }
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={activity.album_cover_url}
                        alt={activity.targetName}
                        className="w-20 h-20 rounded-md object-cover hover:opacity-90 transition"
                      />
                    </Link>
                  )}
                </div>
              );
            })}

            <div ref={sentinelRef} className="h-32 flex justify-center items-center">
              {loadingMore && <LoaderMusic />}
              {!hasMore && (
                <p className="text-gray-500 text-sm mt-2">No more activity</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Suggested content */}
        <div className="hidden xl:flex flex-col gap-6">

          {/* People You May Know */}
          <div className=" p-4 rounded-xl border border-gray-800">
            <h2 className="text-lg font-semibold mb-3">People you may know</h2>
            <div className="flex flex-col gap-4">
              {loadingFollowerSuggestions && (<LoaderMusic />)}
              {followerSuggestions.length == 0 && !loadingFollowerSuggestions && (<p className="text-gray-600">No suggestsions found.</p>)}
              {followerSuggestions.map(u => (
                <div className="flex items-center gap-3">
                  <Link to={`/profile/${u.id}`}><img src={u.avatar_url} className="w-10 h-10 rounded-full" /></Link>

                  <div className="flex-1">
                    <Link to={`/profile/${u.id}`}><p className="text-gray-200 font-medium hover:underline">{u.username}</p></Link>
                    <p className="text-gray-500 text-sm">{u.mutual_count} mutual follows</p>
                  </div>
                  <button onClick={() => handleFollow(u.id)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-md">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Albums */}
          <div className=" p-4 rounded-xl border border-gray-800">
            <h2 className="text-lg font-semibold mb-3">People with similar taste like these albums</h2>
            <p className="text-gray-600">Coming Soon.</p>
            <div className="grid grid-cols-3 gap-3">

            </div>
          </div>

        </div>
      </div>
    </div>
  );

};

export default Home;
