import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FeedCard } from "@/components/FeedCard";
import { ChevronDown, Library, Search, TrendingUp } from "lucide-react";
import {
  FeedLoadMoreSkeleton,
  FollowerColumnSkeleton,
  HomeFeedSkeleton,
  HomeTrendingPanelSkeleton,
} from "@/components/shared/PageSkeletons";
import { Activity, AlbumActivity, ISearchUser, SongActivity } from "@/types";
import { useUserContext } from "@/lib/AuthContext";
import {
  addFollow,
  getFollowerSuggestions,
  aggregateFeedActivities,
  fetchFollowFeedRpcBatch,
  fetchFollowedActivitiesLegacyPage,
  getTrendingAlbums,
  getTrendingSongs,
} from "@/lib/supabase/api";
import SuggestionsList from "@/components/SuggestionsList";

const PAGE_SIZE = 10;
/** Raw rows per RPC page. Smaller batches re-aggregate faster; card count can still change when jukes merge across batches. */
const RPC_BATCH = 48;

const followerCacheKey = (accountId: string) => `follower_suggestions_${accountId}`;

const Home = () => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingFollowerSuggestions, setLoadingFollowerSuggestions] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [followerSuggestions, setFollowerSuggestions] = useState<ISearchUser[]>([]);
  const [suggestionsError, setSuggestionsError] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [trendingAlbums, setTrendingAlbums] = useState<AlbumActivity[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<SongActivity[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingOpen, setTrendingOpen] = useState(false);

  const offsetRef = useRef(0);
  const rpcCursorRef = useRef<{ ts: string; key: string } | null>(null);
  const rpcRawAccumulatedRef = useRef<Activity[]>([]);
  const useLegacyFeedRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const handleFollow = async (userId: string) => {
    if (!user?.accountId) return;
    try {
      await addFollow(userId, user.accountId);
      setFollowerSuggestions((prev) => {
        const updated = prev.filter((u) => u.id !== userId);
        if (user.accountId) {
          localStorage.setItem(followerCacheKey(user.accountId), JSON.stringify(updated));
        }
        return updated;
      });
    } catch (err) {
      console.error("Error following:", err);
    }
  };

  const fetchFeed = useCallback(
    async (initial = false) => {
      if (!user?.accountId || loadingRef.current) return;
      if (!initial && !hasMoreRef.current) return;

      loadingRef.current = true;
      initial ? setLoading(true) : setLoadingMore(true);
      setFeedError(null);

      try {
        let handled = false;

        if (!useLegacyFeedRef.current) {
          const batch = await fetchFollowFeedRpcBatch(
            user.accountId,
            initial ? null : rpcCursorRef.current,
            RPC_BATCH
          );

          if (batch !== null) {
            if (initial) {
              rpcRawAccumulatedRef.current = batch.rawActivities;
            } else {
              rpcRawAccumulatedRef.current = [...rpcRawAccumulatedRef.current, ...batch.rawActivities];
            }
            rpcCursorRef.current = batch.nextCursor;

            const aggregated = aggregateFeedActivities(rpcRawAccumulatedRef.current);
            setActivityFeed(aggregated);
            setHasMore(batch.nextCursor !== null);
            handled = true;
          } else if (!initial) {
            setFeedError("Could not load more.");
            setHasMore(false);
            handled = true;
          } else {
            useLegacyFeedRef.current = true;
          }
        }

        if (!handled && useLegacyFeedRef.current) {
          const data = await fetchFollowedActivitiesLegacyPage(
            user.accountId,
            PAGE_SIZE,
            initial ? 0 : offsetRef.current
          );
          setActivityFeed((prev) => (initial ? data : [...prev, ...data]));
          if (data.length < PAGE_SIZE) setHasMore(false);
          else offsetRef.current += PAGE_SIZE;
        }
      } catch (err) {
        console.error("Error fetching feed:", err);
        setFeedError("We could not load your feed. Try again.");
        if (initial) setActivityFeed([]);
        setHasMore(false);
      } finally {
        loadingRef.current = false;
        initial ? setLoading(false) : setLoadingMore(false);
      }
    },
    [user?.accountId]
  );

  useEffect(() => {
    if (!user?.accountId) {
      setFollowerSuggestions([]);
      setLoadingFollowerSuggestions(false);
      setSuggestionsError(false);
      return;
    }

    setSuggestionsError(false);
    setLoadingFollowerSuggestions(true);

    const cacheKey = followerCacheKey(user.accountId);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setFollowerSuggestions(JSON.parse(cached));
      } catch {
        /* ignore invalid cache */
      }
    }

    getFollowerSuggestions(user.accountId)
      .then((s) => {
        setFollowerSuggestions(s);
        localStorage.setItem(cacheKey, JSON.stringify(s));
      })
      .catch((err) => {
        console.error(err);
        setSuggestionsError(true);
      })
      .finally(() => setLoadingFollowerSuggestions(false));
  }, [user?.accountId]);

  useEffect(() => {
    let cancelled = false;
    setTrendingLoading(true);
    Promise.all([getTrendingAlbums(6), getTrendingSongs(6)])
      .then(([albums, songs]) => {
        if (!cancelled) {
          setTrendingAlbums(albums);
          setTrendingSongs(songs);
        }
      })
      .catch((e) => console.error("Trending load failed:", e))
      .finally(() => {
        if (!cancelled) setTrendingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    offsetRef.current = 0;
    rpcCursorRef.current = null;
    rpcRawAccumulatedRef.current = [];
    useLegacyFeedRef.current = false;
    setActivityFeed([]);
    setHasMore(true);
    setFeedError(null);
    fetchFeed(true);
  }, [user?.accountId, fetchFeed]);

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

  const activityTypeToPastTense = (type: string) => {
    switch (type) {
      case "rating":
        return "Rated";
      case "review":
        return "Reviewed";
      default:
        return "Listened to";
    }
  };

  const retryFeed = () => {
    offsetRef.current = 0;
    rpcCursorRef.current = null;
    rpcRawAccumulatedRef.current = [];
    useLegacyFeedRef.current = false;
    setHasMore(true);
    setFeedError(null);
    fetchFeed(true);
  };

  if (loading) {
    return <HomeFeedSkeleton />;
  }

  if (feedError && activityFeed.length === 0) {
    return (
      <div className="common-container flex flex-col items-center justify-center text-center text-gray-300 min-h-[80vh] px-4">
        <p className="text-lg font-semibold mb-2 text-white">Something went wrong</p>
        <p className="text-gray-400 mb-6 max-w-md">{feedError}</p>
        <button
          type="button"
          onClick={retryFeed}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium transition"
        >
          Try again
        </button>
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

  const trendingBlock = (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
      <div className="flex items-center gap-2 p-4 pb-3">
        <button
          type="button"
          onClick={() => setTrendingOpen((o) => !o)}
          className="flex flex-1 min-w-0 items-center gap-2 text-left rounded-lg -m-1 p-1 hover:bg-gray-800/60 transition-colors"
          aria-expanded={trendingOpen}
          aria-controls="home-trending-panel"
          id="home-trending-toggle"
        >
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
              trendingOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          />
          <h2 className="text-lg font-semibold text-white truncate">Trending now</h2>
        </button>
        <Link
          to="/trending"
          className="text-xs text-emerald-400 hover:text-emerald-300 shrink-0 py-1"
          onClick={(e) => e.stopPropagation()}
        >
          See all
        </Link>
      </div>
      {trendingOpen && (
        <div className="px-4 pb-4" id="home-trending-panel" role="region" aria-labelledby="home-trending-toggle">
          {trendingLoading ? (
            <HomeTrendingPanelSkeleton />
          ) : (
            <div className="space-y-5">
              {trendingAlbums.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Albums</p>
                  <div className="grid grid-cols-3 gap-2">
                    {trendingAlbums.map((a) => (
                      <Link
                        key={a.albumId}
                        to={`/album/${a.albumId}`}
                        className="group block rounded-lg overflow-hidden border border-gray-800 bg-gray-950/50 hover:border-emerald-600/50 transition"
                      >
                        <div className="aspect-square relative">
                          <img
                            src={a.albumCoverUrl || "/assets/icons/empty-state.svg"}
                            alt={a.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] text-gray-300 line-clamp-2 p-1.5 group-hover:text-white">
                          {a.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {trendingSongs.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Songs</p>
                  <div className="grid grid-cols-3 gap-2">
                    {trendingSongs.map((s) => (
                      <Link
                        key={s.songId}
                        to={`/song/${s.songId}`}
                        className="group block rounded-lg overflow-hidden border border-gray-800 bg-gray-950/50 hover:border-emerald-600/50 transition"
                      >
                        <div className="aspect-square relative">
                          <img
                            src={s.albumCoverUrl || "/assets/icons/empty-state.svg"}
                            alt={s.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] text-gray-300 line-clamp-2 p-1.5 group-hover:text-white">
                          {s.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {!trendingLoading && trendingAlbums.length === 0 && trendingSongs.length === 0 && (
                <p className="text-gray-600 text-sm">No trending items yet.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

 return (
  <div className="w-full px-0 sm:px-0 lg:px-16 py-4 sm:py-6 pb-24">
    <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 lg:gap-10 w-full max-w-7xl mx-auto">
      <div className="w-full">
        
        {/* Welcome Section */}
        <div className="w-full max-w-2xl px-2 sm:px-4 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-white mb-1">
            Welcome back, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
            See what your friends have been up to lately.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/library"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/80 text-gray-200 text-xs sm:text-sm hover:bg-gray-700 border border-gray-700 transition"
            >
              <Library className="w-3.5 h-3.5 text-emerald-400" />
              Library
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/80 text-gray-200 text-xs sm:text-sm hover:bg-gray-700 border border-gray-700 transition"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              Search
            </Link>
            <Link
              to="/trending"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/80 text-gray-200 text-xs sm:text-sm hover:bg-gray-700 border border-gray-700 transition"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Trending
            </Link>
          </div>
        </div>

        {feedError && (
          <div className="max-w-2xl mx-auto mb-4 rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-amber-100/90">{feedError}</p>
            <button
              type="button"
              onClick={retryFeed}
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* MOBILE OPTIMIZATION: Collapsible Widget Drawer for Mobile View */}
        <div className="flex max-w-2xl xl:hidden mb-6 px-2 sm:px-4 flex-col gap-3">
          <details className="group rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
            <summary className="flex items-center justify-between p-3.5 text-sm font-medium text-gray-300 cursor-pointer select-none hover:bg-gray-800/50">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Suggestions & Trending
              </span>
              <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-gray-400" />
            </summary>
            <div className="p-3.5 pt-0 border-t border-gray-800/50 space-y-4 mt-2">
              <SuggestionsList
                suggestions={followerSuggestions}
                loading={loadingFollowerSuggestions}
                onFollow={handleFollow}
              />
              {suggestionsError && (
                <p className="text-xs text-gray-500">Could not load suggestions.</p>
              )}
              {trendingBlock}
            </div>
          </details>
        </div>

        {/* Feed List Items */}
        <div className="flex flex-col gap-2 w-full max-w-2xl mx-auto px-2 sm:px-0 mt-2">
          {activityFeed.map((activity) => (
            <FeedCard
              key={activity.id}
              activity={activity}
              isExpanded={expandedGroup === activity.id}
              onToggleExpand={() =>
                setExpandedGroup(expandedGroup === activity.id ? null : activity.id)
              }
              onReviewClick={() => navigate(`/review/${activity.id}`)}
              activityTypeToPastTense={activityTypeToPastTense}
            />
          ))}

          <div ref={sentinelRef} className="h-24 flex justify-center items-center">
            {loadingMore && <FeedLoadMoreSkeleton />}
            {!hasMore && <p className="text-gray-500 text-xs sm:text-sm mt-2">No more activity</p>}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden xl:flex flex-col gap-6 sticky top-6 h-fit">
        <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/40">
          <h2 className="text-lg font-semibold mb-3">People you may know</h2>
          <div className="flex flex-col gap-4">
            {loadingFollowerSuggestions && <FollowerColumnSkeleton />}
            {suggestionsError && <p className="text-sm text-gray-500">Could not load suggestions.</p>}
            {followerSuggestions.length === 0 && !loadingFollowerSuggestions && !suggestionsError && (
              <p className="text-gray-600 text-sm">No suggestions found.</p>
            )}
            {followerSuggestions.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Link to={`/profile/${u.id}`}>
                  <img
                    src={u.avatar_url || "/assets/icons/profile-placeholder.svg"}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${u.id}`}>
                    <p className="text-gray-200 font-medium hover:underline truncate text-sm">
                      {u.username}
                    </p>
                  </Link>
                  <p className="text-gray-500 text-xs">{u.mutual_count ?? 0} mutual follows</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleFollow(u.id)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-md shrink-0"
                >
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>

        {trendingBlock}
      </div>
    </div>
  </div>
);
};

export default Home;
