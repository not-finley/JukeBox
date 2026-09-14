import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SearchGridSkeleton, SearchSuggestionsSkeleton } from "@/components/shared/PageSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchUsers } from "@/lib/supabase/api";
import { getSpotifyToken, searchSpotifyByType, spotifySuggestions } from "@/lib/integrations/spotify";
import { X, Disc, Mic, Music, Users } from "lucide-react";

// Letterboxd-style category options (Removed "All")
const Categories = [
  { label: "Songs", value: "track", icon: Music },
  { label: "Albums", value: "album", icon: Disc },
  { label: "Artists", value: "artist", icon: Mic },
  { label: "Users", value: "user", icon: Users },
] as const;

type CategoryType = (typeof Categories)[number]["value"];

const Search = () => {
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [activeCategory, setActiveCategory] = useState<CategoryType>(() => {
    return (localStorage.getItem("last_search_category") as CategoryType) || "track";
  });

  const [results, setResults] = useState<any[]>(() => {
    const saved = localStorage.getItem("last_search_results");
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem("last_search_query") || "");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem("recent_searches");
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // PERSISTENCE
  useEffect(() => {
    localStorage.setItem("last_search_results", JSON.stringify(results));
    localStorage.setItem("last_search_query", searchQuery);
    localStorage.setItem("last_search_category", activeCategory);
  }, [results, searchQuery, activeCategory]);

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const filtered = [query, ...recentSearches.filter((q) => q !== query)].slice(0, 5);
    setRecentSearches(filtered);
    localStorage.setItem("recent_searches", JSON.stringify(filtered));
  };

  const performSearch = async (query: string, category: CategoryType) => {
    if (!query.trim()) return;

    setShowSuggestions(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    setLoading(true);
    saveRecentSearch(query);

    try {
      if (category === "user") {
        const userResults = await searchUsers(query);
        const mappedUsers = userResults.map(u => ({
          type: "user", id: u.id, name: u.username, image_url: u.avatar_url,
        }));
        setResults(mappedUsers);
      } else {
        const spotifyToken = await getSpotifyToken();
        // Target only the specific type requested (e.g., 'track', 'album', or 'artist')
        const spotifyResults = await searchSpotifyByType(query, category, spotifyToken);
        setResults(spotifyResults);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: CategoryType) => {
    setActiveCategory(category);
    // If there's an active query, automatically re-run search for the new category
    if (searchQuery.trim()) {
      performSearch(searchQuery, category);
    }
  };

  const handleFocus = () => {
    setShowSuggestions(true); 
  };

  const handleSuggestionClick = (item: any) => {
    setShowSuggestions(false);
    saveRecentSearch(item.name || item.title);
    navigate(`/${item.type === "track" ? "song" : item.type}/${item.id}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(async () => {
      setIsSuggestionsLoading(true);
      try {
        if (activeCategory !== "user") {
          const token = await getSpotifyToken(); 
          const { sorted } = await spotifySuggestions(val, token, activeCategory);
          if (val.trim()) {
            setSuggestions(sorted.filter((item: any) => item.type === activeCategory).slice(0, 5));
          }
        } else {
          const userResults = await searchUsers(val);
          setSuggestions(userResults.slice(0, 5).map(u => ({
            type: "user", id: u.id, name: u.username, image_url: u.avatar_url
          })));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 300);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSuggestions([]);
    setResults([]);
    setShowSuggestions(false);
  };

  const renderCard = (item: any) => {
    const isRound = item.type === "artist" || item.type === "user";
    const linkPath = item.type === "track" ? "song" : item.type === "user" ? "profile" : item.type;
    const title = item.title || item.name || item.username;
    
    const img = item.image_url || item.album_cover_url || item.avatar_url || "/assets/icons/default-music.svg";
    const fallback = isRound ? "/assets/icons/profile-placeholder.svg" : "/assets/icons/default-music.svg";

    return (
      <Link 
        key={`${item.type}-${item.id}`} 
        to={`/${linkPath}/${item.id}`}
        className="group flex flex-col items-center gap-3 p-3 sm:p-4 rounded-xl hover:bg-white/5 transition-all relative min-w-0 w-full"
      >
        <div className="relative aspect-square w-full overflow-hidden shadow-lg bg-gray-900 rounded-lg">
          <img
            src={img}
            alt={title}
            className={`object-cover w-full h-full transition-transform duration-300 group-hover:scale-110 ${isRound ? "rounded-full" : "rounded-lg"}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== window.location.origin + fallback) {
                target.src = fallback;
              }
            }}
          />
        </div>

        <div className="text-center w-full min-w-0">
          <p className="text-white text-xs sm:text-sm font-semibold truncate leading-tight w-full">{title}</p>
          <div className="flex flex-col items-center mt-1 w-full min-w-0">
            {item.type === "track" && (
              <p className="text-gray-400 text-[11px] sm:text-xs truncate w-full">
                {item.artists?.map((a: any) => a.name).join(", ") || item.artist}
              </p>
            )}
            {item.type === "album" && (
              <p className="text-gray-400 text-[11px] sm:text-xs truncate w-full">
                {item.artist || item.artists?.[0]?.name}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex flex-col w-full max-w-full overflow-x-hidden min-h-0">
      
      {/* 1. LETTERBOXD-STYLE CATEGORY SELECTOR & HEADER */}
      <div className="w-full px-2 sm:px-0 pt-2 sm:pt-4 mb-6">
        <h1 className="text-3xl sm:text-4xl font-black mb-6 text-white text-center">Search</h1>
        
        {/* Category Picker Tabs */}
        <div className="flex justify-center gap-2 mb-4 overflow-x-auto no-scrollbar">
          {Categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" 
                    : "bg-gray-900/80 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5"
                }`}
              >
                <Icon size={14} />
                {cat.label}
              </button>
            );
          })}
        </div>

        <div ref={searchContainerRef} className="relative w-full max-w-xl mx-auto">
          <div className="flex items-center bg-gray-900/50 border border-white/10 rounded-xl p-1.5 focus-within:border-emerald-500/50 transition-all">
            <div className="relative flex-1 flex items-center min-w-0">
              <Input
                type="text"
                value={searchQuery}
                onFocus={handleFocus}
                onChange={handleInputChange}
                className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-10 w-full pr-10 text-white"
                placeholder={`Search for ${activeCategory === 'track' ? 'a song' : activeCategory}...`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    performSearch(searchQuery, activeCategory);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
              
              {searchQuery && (
                <button 
                  onClick={handleClear}
                  className="absolute right-2 p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <Button 
              onClick={() => performSearch(searchQuery, activeCategory)} 
              className="bg-emerald-600 hover:bg-emerald-500 rounded-lg h-9 px-4 shrink-0 text-xs font-bold uppercase tracking-wider ml-1"
            >
              Go
            </Button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (searchQuery.trim().length > 0 || recentSearches.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
              {searchQuery.length === 0 && recentSearches.length > 0 && (
                <div className="p-2">
                  <div className="flex justify-between items-center px-3 py-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Recent Searches</p>
                    <button 
                      onClick={() => {setRecentSearches([]); localStorage.removeItem("recent_searches")}}
                      className="text-[10px] text-gray-400 hover:text-white"
                    >
                      Clear All
                    </button>
                  </div>
                  {recentSearches.map((q) => (
                    <div 
                      key={q} 
                      onClick={() => { 
                        setSearchQuery(q); 
                        performSearch(q, activeCategory); 
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer rounded-lg group"
                    >
                      <span className="text-gray-400 group-hover:text-white text-sm">{q}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length > 0 && (
                <>
                  {isSuggestionsLoading && <SearchSuggestionsSkeleton />}
                  
                  {!isSuggestionsLoading && suggestions.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleSuggestionClick(item)} 
                      className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-none"
                    >
                      <img src={item.image_url || item.album_cover_url || "/assets/icons/default-music.svg"} className="w-10 h-10 object-cover rounded shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.name || item.title}</p>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase">{item.type}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. RESULTS SECTION */}
      <div className="w-full mt-6 pb-6">
        {loading ? (
          <div className="v-full py-8"><SearchGridSkeleton /></div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-3 gap-y-6 w-full">
            {results.map(renderCard)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <p className="text-gray-400">Search for {activeCategory === 'track' ? 'songs' : activeCategory}...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;