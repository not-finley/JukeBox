import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoaderMusic from "@/components/shared/loaderMusic";
import { Activity, ISearchUser } from "@/types";
import { useUserContext } from "@/lib/AuthContext";
import { addFollow, getFollowerSuggestions, getRecentFollowedActivities, timeAgo } from "@/lib/appwrite/api";
import SuggestionsList from "@/components/SuggestionsList";

const PAGE_SIZE = 10;

const Home = () => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);
  const [filteredFeed, setFilteredFeed] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingFollowerSuggestions, setLoadingFollowerSuggestions] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<"all" | "review" | "rating" | "listen">("all");
  const [followerSuggestions, setFollowerSuggestions] = useState<ISearchUser[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);


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
    // You might need to adjust the filter logic to handle 'grouped' activities
    else if (filter === "listen")
      setFilteredFeed(activityFeed.filter(a => a.type !== "review" && a.type !== "rating" && a.type !== "grouped"));
    else setFilteredFeed(activityFeed.filter(a => a.type === filter || (a.type === "grouped" && a.groupedActivities?.some(g => g.type === filter))));
  }, [filter, activityFeed]); 
  
  const activityTypeToPastTense = (type: string) => {
    switch (type) {
      case "rating": return "Rated";
      case "review": return "Reviewed";
      default: return "Listened to";
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
    <div className="common-container w-full px-0 sm:px-8 lg:px-16 py-6">

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-10 w-full max-w-7xl mx-auto">

        {/* LEFT COLUMN — Main Feed */}
        <div className="w-full">

          {/* Header */}
          <div className="w-full max-w-2xl px-4 mb-8">
            <h1 className="text-2xl font-semibold text-white mb-1">
              Welcome back, {user?.name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="text-gray-400 text-sm">
              See what your friends have been up to lately.
            </p>
          </div>

          {/* Top Navigation */}
          <div className="flex gap-3 mb-6 max-w-2xl overflow-x-auto no-scrollbar py-2 px-4">
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
            const isAggregated = (activity as any).isAggregated;
            const isExpanded = isAggregated && expandedGroup === activity.id;
            const groupedActivities = (activity as any).groupedActivities || [];
            const primaryLink = activity.targetType == "song"? `/song/${activity.targetId}`: `/album/${activity.targetId}`;

            return (
              <div
                // onClick={() => {activity.type == "review"? navigate(`/review/${activity.id}`) : ""}}
                key={activity.id}
                className = { `flex flex-col border border-gray-700 rounded-2xl overflow-hidden bg-gray-900/40 transition-all cur duration-300 ${ activity.type == "review" ? "hover:cursor-pointer" : ""}`}
              >
                {/* 1. HEADER: Standardized for both types */}
                <div className="flex items-center gap-3 p-4 bg-gray-900/60 backdrop-blur-sm z-10">
                  <Link to={`/profile/${activity.userId}`}>
                    <img
                      src={activity.profileUrl}
                      alt={activity.username}
                      className="w-10 h-10 rounded-full object-cover border border-gray-700"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-1.5">
                      <Link to={`/profile/${activity.userId}`} className="font-bold text-white hover:underline">
                        {activity.username}
                      </Link>
                      <span className="text-gray-400 text-sm">
                        {isAggregated ? "Juked" : activityTypeToPastTense(activity.type)}
                      </span>
                      <Link to={primaryLink} className="font-semibold text-emerald-400 hover:text-emerald-300 truncate">
                        {activity.targetName}
                      </Link>
                    </div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider">{timeAgo(activity.date)}</p>
                  </div>
                  
                  {isAggregated && (
                    <button
                      onClick={() => setExpandedGroup(isExpanded ? null : activity.id)}
                      className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                    >
                      {/* Simple toggle icon */}
                      <svg 
                        className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-emerald-400' : 'text-gray-400'}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* 2. MAIN CONTENT AREA */}
                <div className="relative w-full aspect-square sm:aspect-[6/5] min-h-[300px] overflow-hidden flex items-center justify-center">
                  
                  {/* BACKGROUND IMAGE (The Blur Target) */}
                  <img
                    src={activity.album_cover_url || ""}
                    alt={activity.targetName}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                      isExpanded ? 'scale-110 blur-xl brightness-[0.3]' : 'scale-100 blur-0 brightness-100'
                    }`}
                    onClick={() => setExpandedGroup(isExpanded ? null : activity.id)}
                  />

                  {/* OVERLAY: Review Text (Visible when NOT expanded) */}
                  {!isExpanded && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-20">
                        {activity.rating && (
                          <div className="flex gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < (activity.rating || 0) ? "text-yellow-400" : "text-gray-600/50"}>★</span>
                            ))}
                          </div>
                        )}
                        {activity.text && (
                          <p className="text-white text-lg font-medium italic leading-tight drop-shadow-md">
                            “{activity.text}”
                          </p>
                        )}
                    </div>
                  )}

                  {/* OVERLAY: Tracklist (Visible ONLY when expanded) */}
                  <div 
                    className={`absolute inset-0 z-20 flex flex-col p-6 transition-all duration-500 transform ${
                      isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="mb-4">
                      <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest">Full Activity</h4>
                      <p className="text-gray-400 text-xs">Recently played and rated songs</p>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {groupedActivities.map((g: Activity, idx: number) => {
                      // Determine if this was a combined action
                      // In our new backend, 'listen' is the baseline, but 'rating' is the upgrade
                      const hasRating = !!g.rating;
                      
                      return (
                        <div 
                          key={g.id} 
                          style={{ transitionDelay: `${idx * 40}ms` }}
                          className={`flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 transition-all duration-500 ${
                            isExpanded ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Subtle Track Number */}
                            <span className="text-white/30 text-xs font-mono w-4">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                             <Link to={`/song/${g.targetId}`} className="font-medium text-white hover:text-emerald-300 text-sm truncate">
                              {g.targetName}
                            </Link>
                          </div>

                          <div className="flex shrink-0 items-center gap-3 bg-black/20 py-1 px-3 rounded-full border border-white/5">
                            {/* Always show Listen icon if it's in this group */}
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                              {!hasRating && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Listened</span>}
                            </div>

                            {/* Show Rating if available */}
                            {hasRating && (
                              <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                                <span className="text-yellow-400 text-xs font-bold">{g.rating}</span>
                                <span className="text-yellow-400/50 text-[10px]">★</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                    <button
                      onClick={() => setExpandedGroup(null)}
                      className="mt-4 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold backdrop-blur-md transition"
                    >
                      Back to Review
                    </button>
                  </div>
                </div>
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
