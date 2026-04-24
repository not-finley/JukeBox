import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useUserContext } from "@/lib/AuthContext";
import { LibraryPageSkeleton } from "@/components/shared/PageSkeletons";
import ReviewItemLibrary from "@/components/ReviewItemLibrary";
import { getReviewedWithLimit, getRatedWithLimit, getListenedWithLimit, getPlaylists } from "@/lib/supabase/api";
import { Listened, RatingGeneral, Review } from "@/types/index";
import { Plus, Music } from "lucide-react";
import StarIcon from '@/components/shared/StarIcon';
import { cn } from "@/lib/utils";

type LibraryTab = "reviews" | "ratings" | "listens" | "playlists";
type LibrarySort = "newest" | "oldest" | "rating";

function filterBySearchQuery(data: any[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return data;
  return data.filter((item) =>
    (item.name || item.title || "").toLowerCase().includes(q)
  );
}

function groupLibraryItems(
  items: any[],
  sortBy: LibrarySort,
  activeSection: LibraryTab
): Record<string, any[]> {
  if (items.length === 0) return {};

  const groups: Record<string, any[]> = {};

  if (sortBy === "rating" && activeSection === "ratings") {
    [5, 4, 3, 2, 1].forEach((star) => {
      const match = items.filter((item) => Math.floor(item.rating) === star);
      if (match.length > 0) groups[`${star} Stars`] = match;
    });
    return groups;
  }

  if (sortBy === "newest" || sortBy === "oldest") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    items.forEach((item) => {
      const itemDate = new Date(
        item.createdAt || item.rating_date || item.listen_date || Date.now()
      );
      const itemDay = new Date(
        itemDate.getFullYear(),
        itemDate.getMonth(),
        itemDate.getDate()
      ).getTime();

      const diffInDays = Math.round((today - itemDay) / oneDay);

      let label = "";
      if (diffInDays === 0) label = "Today";
      else if (diffInDays === 1) label = "Yesterday";
      else if (diffInDays <= 7) label = "This Week";
      else if (diffInDays <= 30) label = "This Month";
      else {
        label = itemDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    return groups;
  }

  return { "": items };
}

type LibrarySectionProps = {
  items: any[];
  renderItem: (item: any, idx: number) => ReactNode;
  gridClass: string;
  sectionType: string;
  showLoadMore?: boolean;
  sortBy: LibrarySort;
  activeSection: LibraryTab;
  onLoadMore: (type: string) => void;
  isFetchingMore: boolean;
};

/** Module-level so React does not remount the whole grid on every Library parent re-render (e.g. each search keystroke). */
function LibrarySection({
  items,
  renderItem,
  gridClass,
  sectionType,
  showLoadMore,
  sortBy,
  activeSection,
  onLoadMore,
  isFetchingMore,
}: LibrarySectionProps) {
  const grouped = groupLibraryItems(items, sortBy, activeSection);
  const keys = Object.keys(grouped);

  if (keys.length === 0) return null;

  return (
    <div className="space-y-12">
      {keys.map((groupLabel) => (
        <div key={groupLabel} className="space-y-6">
          {groupLabel && (
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500 whitespace-nowrap">
                {groupLabel}
              </h3>
              <div className="h-[1px] w-full bg-gray-800" />
            </div>
          )}
          <div className={gridClass}>
            {grouped[groupLabel].map((item: any, idx: number) => renderItem(item, idx))}
          </div>
        </div>
      ))}
      {showLoadMore && (
        <button
          type="button"
          onClick={() => onLoadMore(sectionType)}
          disabled={isFetchingMore}
          className="w-full py-4 mt-8 flex items-center justify-center gap-3 border border-gray-800 rounded-xl text-gray-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFetchingMore ? (
            <>
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            `Load More ${sectionType}`
          )}
        </button>
      )}
    </div>
  );
}

const Library = () => {
const { user } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const lastFetchedAccountId = useRef<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewed, setReviewed] = useState<Review[]>([]);
  const [rated, setRated] = useState<RatingGeneral[]>([]);
  const [listened, setListened] = useState<Listened[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  
  // These states now drive our API calls
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "rating">("newest");
  const [filterType, setFilterType] = useState<"all" | "song" | "album">("all");
  
  const [activeSection, setActiveSection] = useState<"reviews" | "ratings" | "listens" | "playlists">("reviews");
  const [offset, setOffset] = useState({ reviews: 0, ratings: 0, listens: 0 });
  const [hasMore, setHasMore] = useState({ reviews: true, ratings: true, listens: true });
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const LIMIT = 40;

  // Debounce search query to prevent excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!user?.accountId) {
      lastFetchedAccountId.current = null;
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const accountId = user.accountId;
    const isFirstFetchForUser = lastFetchedAccountId.current !== accountId;

    const loadInitialData = async () => {
      if (isFirstFetchForUser) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setOffset({ reviews: 0, ratings: 0, listens: 0 });

      try {
        const [r1, r2, r3, r4] = await Promise.all([
          getReviewedWithLimit(accountId, LIMIT, 0, sortBy, filterType, debouncedSearchQuery),
          getRatedWithLimit(accountId, LIMIT, 0, sortBy, filterType, debouncedSearchQuery),
          getListenedWithLimit(accountId, LIMIT, 0, sortBy as "newest" | "oldest", filterType, debouncedSearchQuery),
          getPlaylists(accountId),
        ]);

        setReviewed(r1);
        setRated(r2);
        setListened(r3);
        setPlaylists(r4);

        setHasMore({
          reviews: r1.length === LIMIT,
          ratings: r2.length === LIMIT,
          listens: r3.length === LIMIT,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
        lastFetchedAccountId.current = accountId;
      }
    };

    loadInitialData();
  }, [user?.accountId, sortBy, filterType, debouncedSearchQuery]);

  const loadMore = async (type: string) => {
    if (isFetchingMore) return;
    setIsFetchingMore(true);
    
    try {
      let newData: any[] = [];
      const currentOffset = offset[type as keyof typeof offset] + LIMIT;

      if (type === "reviews") {
        newData = await getReviewedWithLimit(user.accountId, LIMIT, currentOffset, sortBy, filterType, debouncedSearchQuery);
        setReviewed(prev => [...prev, ...newData]);
      } else if (type === "ratings") {
        newData = await getRatedWithLimit(user.accountId, LIMIT, currentOffset, sortBy, filterType, debouncedSearchQuery);
        setRated(prev => [...prev, ...newData]);
      } else if (type === "listens") {
        newData = await getListenedWithLimit(user.accountId, LIMIT, currentOffset, sortBy as "newest" | "oldest", filterType, debouncedSearchQuery);
        setListened(prev => [...prev, ...newData]);
      }

      setOffset(prev => ({ ...prev, [type]: currentOffset }));
      if (newData.length < LIMIT) {
        setHasMore(prev => ({ ...prev, [type]: false }));
      }
    } catch (error) {
      console.error("Error loading more:", error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const filteredReviews = reviewed;
  const filteredRated = rated;
  const filteredListened = listened;
  /** Match server search: only re-filter playlists when debounced query changes (no flash per keystroke). */
  const filteredPlaylists = useMemo(
    () => filterBySearchQuery(playlists, debouncedSearchQuery),
    [playlists, debouncedSearchQuery]
  );

  const SECTIONS = [
    { key: "reviews", label: "Reviews" },
    { key: "ratings", label: "Rated" },
    { key: "listens", label: "History" },
    { key: "playlists", label: "Playlists" },
  ];

  return (
    <div className="common-container w-full px-4 sm:px-8 lg:px-16 py-6">
      <div className="max-w-7xl w-full mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Library</h1>
            <p className="text-gray-400">Manage your reviews, ratings, and music history.</p>
          </div>

          <div className="flex gap-3 w-full md:max-w-md">
          <div className="relative w-full md:max-w-xs">
            <input 
              type="text"
              placeholder={`Search ${activeSection}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-800 text-white text-sm rounded-xl px-10 py-3 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
            <img 
              src="/assets/icons/search.svg" // Replace with your search icon path
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50"
              alt="search"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>
          <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-900 border border-gray-800 text-gray-400 text-xs rounded-xl px-3 focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              {activeSection === "ratings" && <option value="rating">Stars (High-Low)</option>}
            </select>
            </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex gap-8 border-b border-gray-800 mb-8 overflow-x-auto no-scrollbar">
          {SECTIONS.map(sec => (
            <button
              key={sec.key}
              onClick={() => {
                setActiveSection(sec.key as any);
                setSearchQuery(""); // Clear search when switching tabs for better UX
              }}
              className={`pb-4 text-sm font-semibold transition-all whitespace-nowrap ${
                activeSection === sec.key
                  ? "text-emerald-400 border-b-2 border-emerald-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        
        <div className="min-h-[50vh] w-full">
          {activeSection !== "playlists" && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              {["all", "song", "album"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type as any)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    filterType === type 
                      ? "bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                      : "bg-transparent border-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'song' ? 'Songs' : 'Albums'}
                </button>
              ))}
            </div>
          </div>)}

          {loading ? (
            <LibraryPageSkeleton section={activeSection} />
          ) : (
            <div className="relative">
              {refreshing && (
                <div className="sticky top-0 z-10 mb-4 flex justify-center sm:justify-end pointer-events-none">
                  <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-950/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-200 shadow-lg backdrop-blur-sm">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"
                      aria-hidden
                    />
                    Updating library
                  </div>
                </div>
              )}
              <div
                className={cn(
                  "transition-opacity duration-200",
                  refreshing && "opacity-[0.72] pointer-events-none"
                )}
              >
          {/* REVIEWS */}
          {activeSection === "reviews" && (
            filteredReviews.length > 0 ? (
              <LibrarySection
                sectionType="reviews"
                showLoadMore={hasMore.reviews}
                items={filteredReviews}
                gridClass="grid grid-cols-1 xl:grid-cols-2 gap-6"
                sortBy={sortBy}
                activeSection={activeSection}
                onLoadMore={loadMore}
                isFetchingMore={isFetchingMore}
                renderItem={(r: any) => <ReviewItemLibrary key={r.reviewId} review={r} />}
              />
            ) : (
              /* Search/Empty Logic */
              <p className="text-gray-500 text-center py-20">No reviews found.</p>
            )
          )}

          {/* RATINGS */}
          {activeSection === "ratings" && (
            filteredRated.length > 0 ? (
              <LibrarySection
                sectionType="ratings"
                items={filteredRated}
                gridClass="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                showLoadMore={hasMore.ratings}
                sortBy={sortBy}
                activeSection={activeSection}
                onLoadMore={loadMore}
                isFetchingMore={isFetchingMore}
                renderItem={(rating: any) => (
                  <Link 
                    key={`${rating.type}-${rating.id}`} 
                    to={rating.type === "song" ? `/song/${rating.id}` : `/album/${rating.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-900/40 border border-gray-800 hover:border-emerald-500/50 transition-all group"
                  >
                    <img 
                      src={rating.album_cover_url || "/assets/icons/music-placeholder.png"} 
                      className="w-14 h-14 rounded-lg object-cover" 
                      alt={rating.title}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate group-hover:text-emerald-400">
                        {rating.title}
                      </p>
                      
                      {/* UPDATED STAR DISPLAY */}
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(5)].map((_, starIndex) => {
                          const starValue = starIndex + 1;
                          // Determine fill: 1 for full, 0.5 for half, 0 for empty
                          const fillLevel = rating.rating >= starValue 
                            ? 1 
                            : rating.rating >= starValue - 0.5 
                              ? 0.5 
                              : 0;

                          return (
                            <StarIcon 
                              key={starIndex} 
                              fillLevel={fillLevel} 
                              sizeClass="w-3.5 h-3.5" // Small size for the library list
                            />
                          );
                        })}
                        {/* Optional: Add numeric text for clarity */}
                        <span className="text-[10px] text-gray-500 ml-1 font-bold">
                          {Number(rating.rating).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </Link>
                )}
              />
            ) : (
              <p className="text-gray-500 text-center py-20">No ratings found.</p>
            )
          )}

          {/* HISTORY (LISTENS) */}
          {activeSection === "listens" && (
            filteredListened.length > 0 ? (
              <LibrarySection
                sectionType="listens"
                showLoadMore={hasMore.listens}
                items={filteredListened}
                gridClass="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                sortBy={sortBy}
                activeSection={activeSection}
                onLoadMore={loadMore}
                isFetchingMore={isFetchingMore}
                renderItem={(item: any) => (
                  <Link key={`${item.type}-${item.id}`} to={item.type === "song" ? `/song/${item.id}` : `/album/${item.id}`} className="flex flex-col gap-3 group">
                    <img src={item.album_cover_url || "/assets/icons/music-placeholder.png"} className="w-full aspect-square object-cover rounded-2xl group-hover:scale-105 transition-transform shadow-lg" />
                    <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                  </Link>
                )}
              />
            ) : (
              <p className="text-gray-500 text-center py-20">No history found.</p>
            )
          )}

         {/* PLAYLISTS */}
        {activeSection === "playlists" && (
          filteredPlaylists.length === 0 && debouncedSearchQuery.trim().length > 0 ? (
            <p className="text-gray-500 italic text-center py-10">No matches found for "{debouncedSearchQuery}"</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              
              {/* Existing Playlists */}
              {filteredPlaylists.map(playlist => (
                <Link
                  key={playlist.playlistId}
                  to={`/playlist/${playlist.playlistId}`}
                  className="flex flex-col gap-3 group"
                >
                  <div className="relative overflow-hidden rounded-2xl aspect-square bg-gray-800">
                    {playlist.coverUrl ? (
                      <img
                        src={playlist.coverUrl}
                        className="w-full h-full object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20">
                        <Music size={48} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold truncate group-hover:text-emerald-400 transition-colors">
                      {playlist.name}
                    </p>
                    <span className="text-sm text-gray-400 ">
                        {playlist.albumCount > 0 ? (
                            <>
                                {playlist.albumCount} {playlist.albumCount === 1 ? 'album' : 'albums'}, {playlist.totalTracks} tracks
                            </>
                        ) : (
                            <>
                                {playlist.totalTracks} {playlist.totalTracks === 1 ? 'track' : 'tracks'}
                            </>
                        )}
                    </span>
                  </div>
                </Link>
              ))}

              {/* Persistent "Create New" Card */}
              {/* Only show this if the user isn't actively searching, or always if you prefer */}
              {debouncedSearchQuery.trim().length === 0 && (
                <Link
                  to="/create-playlist"
                  className="flex flex-col gap-3 group"
                >
                  <div className="relative aspect-square rounded-2xl border-2 border-dashed border-gray-800 bg-gray-900/20 group-hover:bg-gray-900/40 group-hover:border-emerald-500/50 transition-all flex flex-col items-center justify-center text-gray-500 group-hover:text-emerald-500">
                    <Plus size={40} strokeWidth={1.5} />
                    <span className="text-[10px] uppercase font-black tracking-widest mt-2">New Playlist</span>
                  </div>
                  <div>
                    <p className="text-white/40 text-sm font-semibold group-hover:text-emerald-400 transition-colors">
                      Create...
                    </p>
                    <p className="text-gray-600 text-xs">Custom collection</p>
                  </div>
                </Link>
              )}
            </div>
          )
        )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Library;