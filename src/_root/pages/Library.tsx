import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUserContext } from "@/lib/AuthContext";
import LoaderMusic from "@/components/shared/loaderMusic";
import ReviewItemLibrary from "@/components/ReviewItemLibrary";
import { getReviewedWithLimit, getRatedWithLimit, getListenedWithLimit, getPlaylists } from "@/lib/appwrite/api";
import { Listened, RatingGeneral, Review } from "@/types/index";
import { Plus, Music } from "lucide-react";

const Library = () => {
  const { user } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // 1. New State
  const [reviewed, setReviewed] = useState<Review[]>([]);
  const [rated, setRated] = useState<RatingGeneral[]>([]);
  const [listened, setListened] = useState<Listened[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<"reviews" | "ratings" | "listens" | "playlists">("reviews");

  useEffect(() => {
    if (!user?.accountId) return;
    const load = async () => {
      setLoading(true);
      const [r1, r2, r3, r4] = await Promise.all([
        getReviewedWithLimit(user.accountId, 50),
        getRatedWithLimit(user.accountId, 100),
        getListenedWithLimit(user.accountId, 100),
        getPlaylists(user.accountId)
      ]);
      setReviewed(r1);
      setRated(r2);
      setListened(r3);
      setPlaylists(r4);
      setLoading(false);
    };
    load();
  }, [user]);

  // 2. Filter Logic: Only show items that match name or text
  const filteredReviews = reviewed.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRated = rated.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredListened = listened.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlaylists = playlists.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="common-container flex justify-center items-center min-h-[80vh]"><LoaderMusic /></div>;

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

          {/* 3. SEARCH INPUT UI */}
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

        {/* ---- CONTENT SECTIONS (using filtered variables) ---- */}
        <div className="min-h-[50vh]">
          
          {/* REVIEWS */}
          {activeSection === "reviews" && (
            filteredReviews.length === 0 ? (
              /* Case 1: Search returned nothing */
              searchQuery.length > 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-gray-500 italic">No matches found for "{searchQuery}"</p>
                </div>
              ) : (
                /* Case 2: The list is actually empty (No reviews created yet) */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-dark-3 p-6 rounded-full mb-4">
                    <img src="/assets/icons/pen-nib.svg" className="w-10 h-10 opacity-20 invert" alt="No reviews" />
                  </div>
                  <p className="text-gray-400 font-medium">You haven't written any reviews yet.</p>
                  <Link to="/search" className="text-emerald-500 text-sm mt-2 hover:underline">
                    Explore music to start reviewing
                  </Link>
                </div>
              )
            ) : (
              /* Case 3: We have reviews to show */
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredReviews.map(r => <ReviewItemLibrary key={r.reviewId} review={r} />)}
              </div>
            )
          )}

          {/* RATINGS */}

          {activeSection === "ratings" && (
            filteredRated.length === 0 ? (
              searchQuery.length > 0 ? (
                <p className="text-gray-500 italic text-center py-10">No matches found for "{searchQuery}"</p>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-dark-3 p-6 rounded-full mb-4">
                    <span className="text-4xl opacity-20">★</span>
                  </div>
                  <p className="text-gray-400 font-medium">No ratings yet.</p>
                  <Link to="/trending" className="text-emerald-500 text-sm mt-2 hover:underline">
                    Rate your first track
                  </Link>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRated.map((rating, i) => (
                  <Link 
                    key={i} 
                    to={rating.type === "song" ? `/song/${rating.id}` : `/album/${rating.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-900/40 border border-gray-800 hover:border-emerald-500/50 transition-all group"
                  >
                    <img
                      src={rating.album_cover_url || "/assets/icons/music-placeholder.png"}
                      className="w-14 h-14 rounded-lg object-cover shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                        {rating.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, star) => (
                            <span key={star} className={`text-[10px] ${star < rating.rating ? "text-emerald-400" : "text-gray-700"}`}>★</span>
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{rating.type}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}

          {activeSection === "listens" && (
            filteredListened.length === 0 ? (
              searchQuery.length > 0 ? (
                <p className="text-gray-500 italic text-center py-10">No matches found for "{searchQuery}"</p>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-dark-3 p-6 rounded-full mb-4">
                    <img src="/assets/icons/headphones.svg" className="w-10 h-10 opacity-20 invert" alt="No listens" />
                  </div>
                  <p className="text-gray-400 font-medium">Your listening history is empty.</p>
                  <p className="text-gray-600 text-sm max-w-[250px] mt-1">Start playing music to track your journey.</p>
                </div>
              )
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {filteredListened.map(item => (
                  <Link
                    key={item.id}
                    to={item.type === "song" ? `/song/${item.id}` : `/album/${item.id}`}
                    className="flex flex-col gap-3 group"
                  >
                    <div className="relative overflow-hidden rounded-2xl">
                      <img
                        src={item.album_cover_url || "/assets/icons/music-placeholder.png"}
                        className="w-full aspect-square object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-gray-500 text-xs capitalize">{item.type}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}

         {/* PLAYLISTS */}
        {activeSection === "playlists" && (
          filteredPlaylists.length === 0 && searchQuery.length > 0 ? (
            <p className="text-gray-500 italic text-center py-10">No matches found for "{searchQuery}"</p>
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
              {searchQuery.length === 0 && (
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
    </div>
  );
};

export default Library;