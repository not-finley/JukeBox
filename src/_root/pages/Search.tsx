import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoaderMusic from "@/components/shared/loaderMusic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchUsers } from "@/lib/appwrite/api";
import { getSpotifyToken, searchSpotify, spotifySuggestions } from "@/lib/appwrite/spotify";
import { X } from "lucide-react";

const FilterOptions = ["All", "Songs", "Albums", "Artists", "Users"] as const;
type SearchState = (typeof FilterOptions)[number];

const Search = () => {
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState({
    songs: [] as any[],
    albums: [] as any[],
    artists: [] as any[],
    users: [] as any[],
    all: [] as any[],
  });
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchState>("All");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    // 1. KILL the pending debounced suggestion timer immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 2. Hide suggestions and start loading
    setShowSuggestions(false);
    setLoading(true);
    

    try {
      const spotifyToken = await getSpotifyToken();
      const [spotifyResults, userResults] = await Promise.all([
        searchSpotify(query, spotifyToken),
        searchUsers(query)
      ]);

      const mappedUsers = userResults.map(u => ({
        type: "user",
        id: u.id,
        name: u.username,
        image_url: u.avatar_url,
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
  
  // Consolidate the image source
  const img = item.image_url || item.album_cover_url || item.avatar_url || "/assets/icons/default-music.svg";
  const fallback = isRound ? "/assets/icons/profile-placeholder.svg" : "/assets/icons/default-music.svg";

  return (
    <Link 
      key={`${item.type}-${item.id}`} 
      to={`/${linkPath}/${item.id}`}
      className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-all"
    >
      <div className="relative aspect-square w-full overflow-hidden shadow-lg">
        <img
          src={img}
          key={img} // Resets the element if the URL changes
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
        {item.artists ? (
          <p className="text-gray-400 text-xs truncate mt-1">
            {item.artists.map((a: any) => a.name).join(", ")}
          </p>
        ) : (
          <p className="text-gray-500 text-xs capitalize mt-1">{item.type}</p>
        )}
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
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
                  
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(async () => {
                    const token = await getSpotifyToken();
                    const { sorted } = await spotifySuggestions(val, token);
                    setSuggestions(sorted.slice(0, 5));
                    setShowSuggestions(true);
                  }, 400);
                }}
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

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
              {suggestions.map((item) => (
                <div key={item.id} onClick={() => navigate(`/${item.type === "track" ? "song" : item.type}/${item.id}`)} className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-none">
                  <img src={item.image_url || "/assets/icons/default-music.svg"} className="w-10 h-10 object-cover rounded shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.name || item.title}</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase">{item.type}</p>
                  </div>
                </div>
              ))}
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
            {activeTab === "Users" && results.users.map(u => renderCard({ ...u, type: 'user' }))}
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