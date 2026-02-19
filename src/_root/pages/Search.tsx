import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoaderMusic from "@/components/shared/loaderMusic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchUsers } from "@/lib/appwrite/api";
import { getSpotifyToken, searchSpotify, spotifySuggestions } from "@/lib/appwrite/spotify";
import { Loader2, X } from "lucide-react";

const FilterOptions = ["All", "Songs", "Albums", "Artists", "Users"] as const;
type SearchState = (typeof FilterOptions)[number];

const Search = () => {
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem("last_search_results");
    return saved ? JSON.parse(saved) : { songs: [], albums: [], artists: [], users: [], all: [] };
  });

  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem("last_search_query") || "");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem("recent_searches");
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchState>("All");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // PERSISTENCE: Save to localStorage whenever results or query change
  useEffect(() => {
    localStorage.setItem("last_search_results", JSON.stringify(results));
    localStorage.setItem("last_search_query", searchQuery);
  }, [results, searchQuery]);

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const filtered = [query, ...recentSearches.filter((q) => q !== query)].slice(0, 5);
    setRecentSearches(filtered);
    localStorage.setItem("recent_searches", JSON.stringify(filtered));
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    // Fix the "Ghosting": Close suggestions immediately
    setShowSuggestions(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    setLoading(true);
    saveRecentSearch(query);

    try {
      const spotifyToken = await getSpotifyToken();
      const [spotifyResults, userResults] = await Promise.all([
        searchSpotify(query, spotifyToken),
        searchUsers(query)
      ]);

      const mappedUsers = userResults.map(u => ({
        type: "user", id: u.id, name: u.username, image_url: u.avatar_url,
      }));

      setResults({
        all: [...mappedUsers, ...spotifyResults.sorted],
        songs: spotifyResults.unsorted.filter((item: any) => item.type === "track"),
        albums: spotifyResults.unsorted.filter((item: any) => item.type === "album"),
        artists: spotifyResults.unsorted.filter((item: any) => item.type === "artist"),
        users: userResults,
      });
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    setShowSuggestions(true); 
  };

  const handleSuggestionClick = (item: any) => {
    setShowSuggestions(false); // Clean up UI
    saveRecentSearch(item.name || item.title);
    navigate(`/${item.type === "track" ? "song" : item.type}/${item.id}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!val.trim()) {
      setSuggestions([]);
      return; // showSuggestions remains true to display Recents
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(async () => {
      setIsSuggestionsLoading(true);
      try {
        // Speed Optimization: Ensure your getSpotifyToken helper 
        // checks for an existing non-expired token before fetching a new one.
        const token = await getSpotifyToken(); 
        const { sorted } = await spotifySuggestions(val, token);
        
        // Only show suggestions if the user hasn't cleared the input while we were fetching
        if (val.trim()) {
          setSuggestions(sorted.slice(0, 5));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 300); // Slightly faster debounce
  };


  const handleClear = () => {
    setSearchQuery("");
    setSuggestions([]);
    setResults({ songs: [], albums: [], artists: [], users: [], all: [] });
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
        className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-all relative"
      >
        <div className="relative aspect-square w-full overflow-hidden shadow-lg">
          {/* --- TYPE BADGE --- */}
          {!isRound && (
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                {item.type === "track" ? "Song" : item.type}
              </p>
            </div>
          )}

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

        <div className="text-center w-full">
          <p className="text-white text-sm font-semibold truncate leading-tight">{title}</p>
          
          {/* --- METADATA DIFFERENTIATION --- */}
          <div className="flex flex-col items-center mt-1">
            {item.type === "track" && (
              <p className="text-gray-400 text-xs truncate max-w-full">
                Song • {item.artists?.map((a: any) => a.name).join(", ") || item.artist}
              </p>
            )}
            {item.type === "album" && (
              <p className="text-gray-400 text-xs truncate max-w-full">
                Album • {item.artist || item.artists?.[0]?.name}
              </p>
            )}
            {isRound && (
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                {item.type}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    // Force the outer container to never expand past 100vw
    <div className="common-container flex flex-col w-full max-w-full overflow-x-hidden min-h-screen pb-20">
      
      {/* 1. HEADER SECTION (Stays centered, padding-aware) */}
      <div className="w-full px-4 pt-6 sm:pt-10 mb-6">
        <h1 className="text-3xl sm:text-4xl font-black mb-6 text-white text-center">Search</h1>
        
        <div ref={searchContainerRef} className="relative w-full max-w-xl mx-auto">
          <div className="flex items-center bg-gray-900/50 border border-white/10 rounded-xl p-1.5 focus-within:border-emerald-500/50 transition-all">
            <div className="relative flex-1 flex items-center min-w-0">
              <Input
                type="text"
                value={searchQuery}
                onFocus={handleFocus}
                onChange={(e) => {handleInputChange(e)}}
                className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-10 w-full pr-10" // added padding-right
                placeholder="What do you want to review?"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    performSearch(searchQuery);
                    (e.target as HTMLInputElement).blur(); // Hide mobile keyboard
                  }
                }}
              />
              
              {/* Clear Button (X) */}
              {searchQuery && (
                <button 
                  onClick={handleClear}
                  className="absolute right-2 p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} /> 
                  {/* If you don't use Lucide, use: <img src="/assets/icons/close.svg" className="w-5 h-5" /> */}
                </button>
              )}
            </div>

            <Button 
              onClick={() => performSearch(searchQuery)} 
              className="bg-emerald-600 hover:bg-emerald-500 rounded-lg h-9 px-4 shrink-0 text-xs font-bold uppercase tracking-wider ml-1"
            >
              Go
            </Button>
          </div>

          {showSuggestions && (searchQuery.trim().length > 0 || recentSearches.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
              
              {/* CASE 1: Recent Searches (Input is empty) */}
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
                        performSearch(q); 
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer rounded-lg group"
                    >
                      <span className="text-gray-400 group-hover:text-white text-sm">{q}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CASE 2: API Suggestions (User is typing) */}
              {searchQuery.length > 0 && (
                <>
                  {isSuggestionsLoading && <div className="p-4 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500" size={16}/></div>}
                  
                  {!isSuggestionsLoading && suggestions.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleSuggestionClick(item)} 
                      className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-none"
                    >
                      <img src={item.image_url || "/assets/icons/default-music.svg"} className="w-10 h-10 object-cover rounded shrink-0" />
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

      {/* 2. TABS SECTION (The Mobile Scroll Fix) */}
      {results.all.length > 0 && (
        <div className="w-full sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-white/5">
          <div className="flex overflow-x-auto no-scrollbar py-3 px-4 gap-2 touch-pan-x">
            {FilterOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setActiveTab(opt)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === opt ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. RESULTS SECTION */}
      <div className="w-full px-4 mt-6">
        {loading ? (
          <div className="flex justify-center py-20"><LoaderMusic /></div>
        ) : results.all.length > 0 ? (
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-3 gap-y-6">
            {activeTab === "All" && results.all.map(renderCard)}
            {activeTab === "Songs" && results.songs.map(renderCard)}
            {activeTab === "Albums" && results.albums.map(renderCard)}
            {activeTab === "Artists" && results.artists.map(renderCard)}
            {activeTab === "Users" && results.users.map((u: any) => renderCard({ ...u, type: 'user' }))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <p className="text-gray-400">Try searching for an artist or song...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;