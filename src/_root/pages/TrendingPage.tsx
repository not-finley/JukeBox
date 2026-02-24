import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTrendingData, timeAgo } from "@/lib/appwrite/api"; // Updated to your supabase fetcher
import { TrendingResponse } from "@/types";
import LoaderMusic from "@/components/shared/loaderMusic";

const TrendingPage = () => {
  const [trending, setTrending] = useState<TrendingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await getTrendingData();
        setTrending(data);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="common-container flex justify-center items-center min-h-[80vh]">
        <LoaderMusic />
      </div>
    );
  }

  return (
    <div className="common-container w-full px-4 sm:px-8 lg:px-16 py-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Trending Now</h1>
          <p className="text-gray-400">The most played music and top reviews this week.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* LEFT/CENTER: Top Songs & Albums */}
          <div className="lg:col-span-2 flex flex-col gap-12">
            
            {/* Top Songs Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span className="text-emerald-500 text-2xl">#</span> Top Songs
                </h2>
                {/* SEE ALL LINK */}
                <Link to="/trending/songs" className="text-xs font-bold text-gray-500 hover:text-emerald-400 uppercase tracking-widest transition-colors flex items-center gap-1">
                  See All <span>&rarr;</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trending?.topSongs.map((song, index) => (
                  <Link 
                    to={`/song/${song.songId}`}
                    key={song.songId} 
                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-900/40 border border-gray-800 hover:border-emerald-500/50 transition-all group"
                  >
                    <div className="relative shrink-0">
                      <img 
                        src={song.albumCoverUrl || "/assets/icons/default-album.svg"} 
                        className="w-16 h-16 rounded-lg object-cover" 
                        alt={song.title} 
                      />
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-black">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                        {song.title}
                      </p>
                      <p className="text-gray-500 text-sm">{song.playCount} plays this week</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Top Albums Section */}
            <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <span className="text-emerald-500 text-2xl">#</span> Buzzing Albums
                  </h2>
                  {/* SEE ALL LINK */}
                  <Link to="/trending/albums" className="text-xs font-bold text-gray-500 hover:text-emerald-400 uppercase tracking-widest transition-colors flex items-center gap-1">
                    See All <span>&rarr;</span>
                  </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {trending?.topAlbums.map((album) => (
                    <Link 
                      to={`/album/${album.albumId}`}
                      key={album.albumId} 
                      className="min-w-[160px] flex flex-col gap-3 group"
                    >
                      <img 
                        src={album.albumCoverUrl} 
                        className="w-40 h-40 rounded-2xl object-cover shadow-lg group-hover:scale-[1.02] transition-transform" 
                      />
                      <div>
                        <p className="text-white text-sm font-semibold truncate">{album.title}</p>
                        <p className="text-gray-500 text-xs">{album.playCount} listeners</p>
                      </div>
                    </Link>
                  ))}
                </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Recent Reviews Feed */}
          <aside className="lg:col-span-1">
              <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/40 h-full md:h-[900px] flex flex-col sticky top-6">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <span className="text-emerald-500 text-2xl">#</span> Latest Buzz
                  </h2>
                  <Link to="/trending/reviews" className="text-xs font-bold text-gray-500 hover:text-emerald-400 uppercase tracking-widest transition-colors flex items-center gap-1">
                    See All <span>&rarr;</span>
                  </Link>
                </div>
              <div className="flex flex-col gap-6 overflow-y-auto pr-2">
                {trending?.recentReviews.map((review) => (
                  <Link to={`/review/${review.reviewId}`} key={review.reviewId} className="flex flex-col gap-3 p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${review.userId}`} className="font-bold text-sm text-white">{review.username}</Link>
                        <span className="text-gray-500 text-[10px]">{timeAgo(review.createdAt)}</span>
                      </div>
                      {/* The Like Count Badge */}
                      <div className="flex items-center gap-1 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                        <span className="text-pink-500 text-xs">❤️</span>
                        <span className="text-pink-500 text-xs font-bold">{review.likeCount}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm italic line-clamp-3">"{review.reviewText}"</p>
                    
                    <Link to={review.targetType == "song"? `/song/${review.targetId}`: `/album/${review.targetId}`} className="flex items-center gap-3 mt-1 p-2 rounded-lg bg-black/20 hover:bg-black/40 transition">
                      <img src={review.albumCoverUrl} className="w-10 h-10 rounded shadow-md" />
                      <span className="text-xs font-semibold text-emerald-400 truncate">{review.targetName}</span>
                    </Link>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};

export default TrendingPage;