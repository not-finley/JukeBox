import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoaderMusic from "@/components/shared/loaderMusic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchUsers } from "@/lib/appwrite/api";
import { getSpotifyToken, searchSpotify, spotifySuggestions } from "@/lib/appwrite/spotify";

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
    setLoading(true);
    setShowSuggestions(false);

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

  const renderCard = (item: any) => {
    const isRound = item.type === "artist" || item.type === "user";
    const linkPath = item.type === "track" ? "song" : item.type === "user" ? "profile" : item.type;
    const title = item.title || item.name || item.username;
    const img = item.image_url || item.album_cover_url || item.avatar_url;

    return (
      <Link 
        key={`${item.type}-${item.id}`} 
        to={`/${linkPath}/${item.id}`}
        className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-all"
      >
        <div className="relative aspect-square w-full overflow-hidden shadow-lg">
          <img
            src={img || "/assets/icons/default-music.svg"}
            alt={title}
            className={`object-cover w-full h-full transition-transform duration-300 group-hover:scale-110 ${isRound ? "rounded-full" : "rounded-lg"}`}
          />
        </div>
        <div className="text-center w-full">
          <p className="text-white text-sm font-semibold truncate leading-tight">{title}</p>
          {item.artists && (
            <p className="text-gray-400 text-xs truncate mt-1">
              {item.artists.map((a: any) => a.name).join(", ")}
            </p>
          )}
          {!item.artists && <p className="text-gray-500 text-xs capitalize mt-1">{item.type}</p>}
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

  const handleSuggestionClick = (item: any) => {
    const linkPath = item.type === "track" ? "song" : item.type;
    setShowSuggestions(false);
    setSearchQuery(""); // Clear search on navigate
    navigate(`/${linkPath}/${item.id}`);
  };

  return (
    <div className="common-container max-w-7xl mx-auto px-4 pb-20">
      {/* Header Section */}
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-4xl font-black mb-3 tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Search
        </h1>
        
        {/* Search Bar Container */}
        <div ref={searchContainerRef} className="relative w-full max-w-2xl group">
          <div className="flex items-center bg-gray-900 border-2 border-gray-800 rounded-2xl p-1 focus-within:border-emerald-500/50 transition-all shadow-2xl">
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
              className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg h-12"
              placeholder="Songs, artists, or friends..."
              onKeyDown={(e) => e.key === "Enter" && performSearch(searchQuery)}
            />
            <Button onClick={() => performSearch(searchQuery)} className="bg-emerald-600 hover:bg-emerald-500 rounded-xl px-6 h-10">
              Search
            </Button>
          </div>

          {/* Improved Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-14 left-0 w-full bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl z-[60] overflow-hidden backdrop-blur-xl">
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSuggestionClick(item)}
                  className="flex items-center gap-4 p-3 hover:bg-white/5 cursor-pointer border-b border-gray-900 last:border-none"
                >
                  <img src={item.image_url || item.album_cover_url} className={`w-10 h-10 object-cover ${item.type === 'artist' ? 'rounded-full' : 'rounded'}`} />
                  <div>
                    <p className="text-sm font-bold text-white leading-none">{item.name || item.title}</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">{item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Results Grid */}
      {loading ? (
        <div className="flex-center py-20"><LoaderMusic /></div>
      ) : results.all.length > 0 ? (
        <div className="space-y-10">
          {/* Persistent Tabs */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-2 sticky top-0 bg-black/50 backdrop-blur-md z-40">
            {FilterOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setActiveTab(opt)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === opt ? "bg-emerald-600 text-white" : "bg-gray-900 text-gray-400 hover:bg-gray-800"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {activeTab === "All" && results.all.map(renderCard)}
            {activeTab === "Songs" && results.songs.map(renderCard)}
            {activeTab === "Albums" && results.albums.map(renderCard)}
            {activeTab === "Artists" && results.artists.map(renderCard)}
            {activeTab === "Users" && results.users.map(u => renderCard({ ...u, type: 'user' }))}
          </div>
        </div>
      ) : (
        /* Empty State with Trending */
        <div className="flex flex-col items-center justify-center py-10">
          <img src="/assets/icons/search.svg" className="w-20 h-20 opacity-20 mb-4" />
          <p className="text-gray-500 font-medium">Search for something new...</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-lg">
            {["Taylor Swift", "The Weeknd", "Drake", "SZA", "Kendrick Lamar"].map(t => (
              <button
                key={t}
                onClick={() => { setSearchQuery(t); performSearch(t); }}
                className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300 hover:border-emerald-500 transition-all"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;