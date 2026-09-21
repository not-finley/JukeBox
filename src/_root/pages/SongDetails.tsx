import { SongDetails } from "@/types";
import { Link, useParams } from "react-router-dom";
import { addListenedSong, addUpdateRatingSong, addSongToDatabase, getAllRatingsOfSong, getRatingSong, getSongDetailsById, hasListenedSong, removeListenedSong, deleteRatingSong, backgroundEnrichAlbumPreviews } from "@/lib/supabase/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SongDetailSkeleton } from "@/components/shared/PageSkeletons";
import { getSpotifyToken, SpotifyTrackById } from "@/lib/integrations/spotify";
import { useUserContext } from "@/lib/AuthContext";
import ReviewItem from "@/components/ReviewItem";
import { BarChart, Bar, XAxis } from 'recharts';
import { FaSpotify } from "react-icons/fa";
import { usePlayerContext } from "@/context/PlayerContext";
import { Play, Pause, Plus } from "lucide-react";
import PlayingVisualizer from "@/components/shared/PlayingVisualizer";
import AuthModal from "@/components/shared/AuthModal";
import PlaylistModal from "@/components/shared/PlaylistModal";
import StarIcon from '@/components/shared/StarIcon';
import NotFound from "@/components/shared/NotFound";

const SongDetailsSection = () => {
  const { id } = useParams();
  const [song, setSong] = useState<SongDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [listened, setListened] = useState(true);
  const [songNotFound, setNotFound] = useState(false);
  const { user, isAuthenticated } = useUserContext();
  const [rating, setRating] = useState(0);
  const [globalRatings, setGlobalRatings] = useState<{ rating: number; count: number }[]>([]);
  const [globalAverage, setGlobalAverage] = useState(0);
  const [globalTotal, setGlobalTotal] = useState(0);
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayerContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const isCurrent = currentTrack?.songId === song?.songId;

  const fetchGlobalRaiting = async () => {
    const { counts, average, total } = await getAllRatingsOfSong(id || '');

    setGlobalRatings(counts);
    setGlobalAverage(average);
    setGlobalTotal(total);
  };

  const handleRating = async (e: React.MouseEvent<HTMLButtonElement>, value: number) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const finalValue = x < rect.width / 2 ? value - 0.5 : value;

    if (finalValue === rating) {
      setRating(0);
      await deleteRatingSong(id ? id : '', user.accountId);
    } else {
      setRating(finalValue);
      await addUpdateRatingSong(id ? id : '', user.accountId, finalValue);
      setListened(true);
    }

    fetchGlobalRaiting();
  };

  const handleAddToPlaylist = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setShowPlaylistModal(true);
  };

  const fetchSongData = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const songId = id || "";
      const userId = user?.accountId;

      // 1. Define core song fetch (with Spotify fallback if missing)
      const songPromise = getSongDetailsById(songId).then(async (fetched) => {
        if (!fetched) {
          const spotifyToken: string = await getSpotifyToken();
          const spotifySong = await SpotifyTrackById(songId, spotifyToken);
          if (!spotifySong) return null;
          await addSongToDatabase(spotifySong);
          return await getSongDetailsById(songId);
        }
        fetched.reviews.sort((a, b) => b.createdAt - a.createdAt);
        return fetched;
      });

      // 2. Fire user-specific and global context requests concurrently
      const globalRatingsPromise = getAllRatingsOfSong(songId);
      const listenedPromise = isAuthenticated && userId ? hasListenedSong(userId, songId) : Promise.resolve(false);
      const userRatingPromise = isAuthenticated && userId ? getRatingSong(songId, userId) : Promise.resolve(0);

      // Await all independent root promises together
      const [fetchedSong, globalData, hasListened, userRating] = await Promise.all([
        songPromise,
        globalRatingsPromise,
        listenedPromise,
        userRatingPromise,
      ]);

      if (!fetchedSong) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setSong(fetchedSong);
      setGlobalRatings(globalData.counts);
      setGlobalAverage(globalData.average);
      setGlobalTotal(globalData.total);

      if (isAuthenticated && userId) {
        setListened(hasListened as boolean);
        setRating(userRating as number);
      }

    } catch (error) {
      console.error("Error fetching song or reviews:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    fetchSongData();
  }, [id, isAuthenticated, user?.accountId]);

  useEffect(() => {
      if (song) {
          backgroundEnrichAlbumPreviews([{
              songId: song.songId,
              title: song.title,
              artist: song.artists[0]?.name,
              isrc: song.isrc
          }]).then((enrichedTracks) => {
              if (enrichedTracks && enrichedTracks[0]?.preview_url) {
                  setSong(prev => prev ? { ...prev, preview_url: enrichedTracks[0].preview_url } : null);
              }
          });
      }
  }, [song?.songId]);

  const listenedClick = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (listened) {
      await removeListenedSong(song ? song.songId : '', user.accountId)
      setListened(false);
    } else {
      await addListenedSong(song ? song.songId : '', user.accountId)
      setListened(true);
    }
  }

  if (loading) {
    return (
      <div className="common-container">
        <SongDetailSkeleton />
      </div>
    );
  }

  if (!song || songNotFound) {
    return <NotFound />;
  }

  return (
    <div className="common-container pb-20">
      {song && (
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Left Section: Cover + User Actions */}
          <div className="lg:w-2/5 flex flex-col items-center lg:items-start">
            <div className="relative w-full max-w-[320px] lg:max-w-none group overflow-hidden rounded-2xl shadow-2xl mb-6 border border-white/5">
              <img
                src={song?.album_cover_url}
                alt={song?.title}
                className={`w-full aspect-square object-cover transition-transform duration-700 md:group-hover:scale-105 ${isCurrent ? 'brightness-50' : ''}`}
              />
              
              <div 
                onClick={() => {
                  if (!isAuthenticated) {
                    setShowAuthModal(true);
                    return;
                  }
                  if (isCurrent) {
                    togglePlay();
                  } else {
                    playTrack({
                      title: song.title, 
                      songId: song.songId, 
                      preview_url: song.preview_url, 
                      album_cover_url: song.album_cover_url, 
                      artist: song.artists.map(a => a.name).join(", "), 
                      isrc: song.isrc
                    });
                  }
                }}
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 cursor-pointer ${isCurrent ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100 bg-black/40'}`}
              >
                {isCurrent ? (
                    <div className="scale-[2.5]">
                        <PlayingVisualizer isPaused={!isPlaying} />
                    </div>
                ) : (
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95">
                        <Play size={30} fill="black" className="ml-1" />
                    </div>
                )}
              </div>
            </div>

            {/* User Actions Card (Synced with Album layout) */}
            <div className="w-full max-w-[320px] lg:max-w-none rounded-2xl bg-gray-900/40 border border-white/5 p-4 shadow-xl">
              <div className="flex gap-3 mb-3">
                <Button 
                  onClick={listenedClick}
                  className={`flex-1 h-14 rounded-xl transition-all active:scale-95 ${
                    listened 
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                    : "bg-white/5 border border-white/10 text-gray-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <img
                      src={listened ? '/assets/icons/headphones-filled.svg' : '/assets/icons/headphones.svg'}
                      className="w-5 h-5"
                      alt="headphones"
                    />
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      {listened ? 'Listened' : 'Mark Listened'}
                    </p>
                  </div>
                </Button>

                <Link 
                  to={`/song/${song?.songId}/add-review`}
                  className="flex-1 h-14 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 text-black font-bold"
                >
                  <img src='/assets/icons/pen-nib.svg' className="w-4 h-4 brightness-0" alt="review" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Review</p>
                </Link>
              </div>

              {/* Rating Bar */}
              <div className="flex items-center justify-between px-4 h-12 bg-black/40 border border-white/5 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Your Rating</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, starIndex) => {
                    const starValue = starIndex + 1;
                    const fillLevel = rating >= starValue ? 1 : rating >= starValue - 0.5 ? 0.5 : 0;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={(e) => handleRating(e, starValue)}
                        className="active:scale-125 transition-transform p-0.5"
                      >
                        <StarIcon fillLevel={fillLevel} sizeClass="w-6 h-6" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Details */}
          <div className="lg:w-3/5 flex flex-col">
            <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Song</h3>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
              {song?.title}
            </h1>
            <Link to={`/album/${song?.album_id}`} className="text-base sm:text-lg text-gray-300 hover:text-emerald-400 font-medium transition-colors mb-1">
              {song?.album}
            </Link>
            <p className="text-sm sm:text-base text-gray-400 mb-6">
              <span>{song?.release_date?.slice(0, 4)}</span> | By{" "}
              {song?.artists.map((a, i) => (
                <Link to={`/artist/${a.artist_id}`} key={a.id} className="hover:text-emerald-400 font-medium">
                  {a.name}
                  {i < song.artists.length - 1 ? ", " : ""}
                </Link>
              ))}
            </p>

            {/* Action Buttons Row */}
            <div className="mb-8 flex flex-wrap items-center gap-2.5">
                <Button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setShowAuthModal(true);
                        return;
                      }
                      if (isCurrent) {
                        togglePlay();
                      } else {
                        playTrack({
                          title: song.title, 
                          songId: song.songId, 
                          preview_url: song.preview_url, 
                          album_cover_url: song.album_cover_url, 
                          artist: song.artists.map(a => a.name).join(", "), 
                          isrc: song.isrc
                        });
                      }
                    }}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-10 px-5 rounded-xl transition-all active:scale-95 shadow-lg"
                >
                    {isCurrent && isPlaying ? <Pause fill="black" size={16} /> : <Play fill="black" size={16} />}
                    <span className="text-xs uppercase tracking-wider">{isCurrent && isPlaying ? 'Pause' : 'Play'}</span>
                </Button>

                <Button
                    onClick={handleAddToPlaylist}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold h-10 px-4 rounded-xl transition-all active:scale-95 border border-white/10"
                >
                    <Plus size={18} />
                    <span className="text-xs uppercase tracking-wider">Add</span>
                </Button>

                {song.spotify_url && (
                    <a
                        href={song.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold h-10 px-4 rounded-xl transition-all active:scale-95 shadow-lg"
                    >
                        <FaSpotify size={18} />
                    </a>
                )}
            </div>

            {/* Ratings Header & Analytics Card */}
            <div className="w-full flex items-center justify-between mb-4">
              <p className="text-xl font-bold text-white">Ratings</p>
              {globalTotal > 0 && (<p className="text-gray-400 text-xs">{globalTotal} listeners</p>)}
            </div>

            {globalTotal <= 0 && (
              <div className='w-full p-6 text-center bg-gray-900/40 rounded-2xl border border-white/5 mb-8'>
                <p className='text-sm text-gray-400'>No ratings yet — be the first!</p>
              </div>
            )}

            {globalTotal > 0 && (
              <div className="flex items-center justify-center w-full bg-gray-900/40 border border-white/5 p-4 rounded-2xl mb-8">
                <div className="mr-6 text-center">
                  <p className="text-2xl font-black text-white">{globalAverage.toFixed(1)}</p>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Average</p>
                </div>
                <div className="overflow-x-auto">
                    <BarChart width={200} height={120} data={globalRatings} barCategoryGap={2}>
                        <XAxis dataKey="rating" ticks={[1, 2, 3, 4, 5]} tick={{fontSize: 10, fill: '#9ca3af'}} />
                        <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">Reviews</h2>
              {song?.reviews.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6 bg-gray-900/20 rounded-2xl border border-white/5">
                  No reviews yet - be the first to start the conversation!
                </p>
              ) : null}
              <div className="space-y-3">
                {song?.reviews.map((r) => (
                  <ReviewItem reviewId={r.reviewId} text={r.text} creator={r.creator} song={r.song} likes={r.likes} createdAt={r.createdAt} updatedAt={r.updatedAt} title={r.title} key={r.reviewId} />
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <PlaylistModal 
        isOpen={showPlaylistModal} 
        onClose={() => setShowPlaylistModal(false)} 
        itemId={id || ''} 
        type="song"
      />
    </div>
  );
};

export default SongDetailsSection;