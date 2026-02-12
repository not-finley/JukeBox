import { SongDetails } from "@/types";
import { Link, useParams } from "react-router-dom";
import { addListenedSong, addUpdateRatingSong, addSongToDatabase, getAllRatingsOfaSong, getRatingSong, getSongDetailsById, hasListenedSong, removeListenedSong, deleteRaitingSong } from "@/lib/appwrite/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import LoaderMusic from "@/components/shared/loaderMusic";
import { getSpotifyToken, SpotifyTrackById } from "@/lib/appwrite/spotify";
import { useUserContext } from "@/lib/AuthContext";
import ReviewItem from "@/components/ReviewItem";
import { BarChart, Bar, XAxis } from 'recharts';
import { FaSpotify } from "react-icons/fa";
import { usePlayerContext } from "@/context/PlayerContext";
import { Play } from "lucide-react";



const SongDetailsSection = () => {
  const { id } = useParams();
  const [song, setSong] = useState<SongDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [listened, setListened] = useState(true);
  const [songNotFound, setNotFound] = useState(false);
  const { user } = useUserContext();
  const [rating, setRating] = useState(0);
  const [globalRatings, setGlobalRatings] = useState<{ rating: number; count: number }[]>([]);
  const [globalAverage, setGlobalAverage] = useState(0);
  const [globalTotal, setGlobalTotal] = useState(0);
  const { playTrack } = usePlayerContext();

  const fetchGlobalRaiting = async () => {
    const { counts, average, total } = await getAllRatingsOfaSong(id || '');

    setGlobalRatings(counts);
    setGlobalAverage(average);
    setGlobalTotal(total);
  };

  const handleRating = async (value: number) => {
    if (value == rating) {
      setRating(0);
      await deleteRaitingSong(id ? id : '', user.accountId)
    } else {
      setRating(value);
      await addUpdateRatingSong(id ? id : '', user.accountId, value);
      setListened(true);
    }

    fetchGlobalRaiting();
  };


  const addUpdateRatingSonglocal = async () => {
    const num = await getRatingSong(id ? id : '', user.accountId);
    setRating(num);
  }

  const addSong = async () => {
    try {
      const spotifyToken: string = await getSpotifyToken();
      const spotifySong = await SpotifyTrackById(id ? id : "", spotifyToken);
      if (!spotifySong) {
        return;
      }

      await addSongToDatabase(spotifySong);
      const fetchedSong = await getSongDetailsById(id || "");
      setSong(fetchedSong);
    }
    catch (error) {
      setNotFound(true);
    }
  }

  const fetchSongAndReviews = async () => {
    try {
      const fetchedSong = await getSongDetailsById(id || "");
      if (!fetchedSong) {
        await addSong(); // Only call getSong if the song is not in the database
      } else {
        fetchedSong.reviews.sort((a, b) => b.createdAt - a.createdAt);
        setSong(fetchedSong);
      }
    } catch (error) {
      console.error("Error fetching song or reviews:", error);
    }
    setLoading(false);
  };

  const fetchListened = async () => {
    try {
      const listenedtemp = await hasListenedSong(user.accountId, id || "")
      if (listenedtemp) {
        setListened(true);
      } else {
        setListened(false);
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (id && user?.accountId) {
      fetchSongAndReviews();
      fetchListened();
      addUpdateRatingSonglocal();
      fetchGlobalRaiting();
    }

  }, [user?.accountId, id]);


  if (!song) {
    /*add to database if exists in spotify*/
    // getSong();
    if (songNotFound) {
      return (
        <div className="common-container">
          <p>Song not found</p>
        </div>
      )
    }
  }

  const listenedClick = async () => {
    if (listened) {
      await removeListenedSong(song ? song.songId : '', user.accountId)
      setListened(false);
    } else {
      await addListenedSong(song ? song.songId : '', user.accountId)
      setListened(true);
    }
  }

  return (
    <div className="common-container">
      {loading && <LoaderMusic />}
      {/* {notFound && <h1 className='text-2xl text-gray-300'>Arist not found</h1>} */}
      {song && (
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row">
          {/* Left Section: Album Cover + User Actions */}
          <div className="lg:w-1/3 flex-shrink-0 mb-8 lg:mb-0">
            {/* Big Album Art with Play Overlay */}
            <div 
                className="relative group overflow-hidden rounded-2xl shadow-2xl mb-6 cursor-pointer"
                onClick={() => playTrack({title: song.title, songId: song.songId, preview_url: song.preview_url, album_cover_url: song.album_cover_url, artist: song.artists.map(a => a.name).join(", "), isrc: song.isrc})}
              >
                <img
                  src={song?.album_cover_url}
                  alt={song?.title}
                  className="w-full h-auto object-cover transition-transform duration-700 md:group-hover:scale-110"
                />
                
                {/* Play/Pause Overlay */}
                <div className="absolute inset-0 bg-black/20 md:bg-black/40 flex items-center justify-center 
                                opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500 rounded-full flex items-center justify-center 
                                  shadow-[0_0_30px_rgba(16,185,129,0.4)] 
                                  transition-transform duration-300
                                  md:translate-y-4 md:group-hover:translate-y-0">
                      <Play size={30} fill="black" className="ml-1 md:w-[40px] md:h-[40px]" />
                  </div>
                </div>

                {/* Mobile Bottom Info Bar (Always visible on mobile, hover on desktop) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent 
                                opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 
                                flex items-end p-4 md:p-6">
                  <div className="flex flex-col">
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Preview Track</p>
                    <p className="text-gray-400 text-[10px] italic md:hidden">Tap to play</p>
                  </div>
                </div>
              </div>

            {/* User Actions Card (Synced with Album style) */}
            <div className="w-full rounded-2xl bg-gray-900/40 backdrop-blur-xl border border-gray-800 p-5 shadow-2xl transition-all hover:border-emerald-500/20">
              
              <div className="flex gap-3">
                {/* Listened Toggle */}
                <Button 
                  onClick={listenedClick}
                  className={`flex-1 h-16 rounded-xl transition-all duration-300 active:scale-95 ${
                    listened 
                    ? "bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20" 
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <img
                      src={listened ? '/assets/icons/headphones-filled.svg' : '/assets/icons/headphones.svg'}
                      className={`w-6 h-6 transition-transform ${listened ? 'scale-110' : ''}`}
                      alt="headphones"
                    />
                    <p className={`text-[10px] font-black uppercase tracking-widest ${listened ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {listened ? 'Listened' : 'Mark Listened'}
                    </p>
                  </div>
                </Button>

                {/* Review Link */}
                <Link 
                  to={`/song/${song?.songId}/add-review`}
                  className="flex-1 h-16 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-all duration-300 active:scale-95 flex flex-col items-center justify-center gap-1 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  <img
                    src='/assets/icons/pen-nib.svg'
                    className="w-5 h-5 brightness-0"
                    alt="review"
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-black">
                    Review
                  </p>
                </Link>
              </div>

              {/* Rating Bar */}
              <div className="relative mt-3 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative flex items-center justify-between px-4 h-12 bg-black/40 border border-white/5 rounded-xl backdrop-blur-md">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight">Rating</span>
                  <div className="flex gap-1.5">
                    {[...Array(5)].map((_, index) => {
                      const value = index + 1;
                      const isActive = rating >= value;
                      return (
                        <button
                          key={value}
                          type="button"
                          className="transition-transform active:scale-125 hover:scale-110"
                          onClick={() => handleRating(value)}
                        >
                          <img
                            src={isActive 
                                ? "/assets/icons/cute-star_full.svg" 
                                : "/assets/icons/cute-star.svg"
                            }
                            className={`w-5 h-5 md:w-6 md:h-6 transition-all ${
                                isActive 
                                ? 'drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]' 
                                // If not active, we invert the black to white and dim it
                                : 'invert opacity-20 group-hover:opacity-40 hover:!opacity-100'
                            }`}
                        />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Details */}
          <div className="lg:w-2/3 lg:ml-8">
            <h1 className="lg:text-4xl md:text-2xl sm:text-3xl xs:text-2xl">
              <p className="font-bold">{song?.title}</p>
            </h1>
            <Link to={`/album/${song?.album_id}`} className=" lg:text-3xl md:text-xl sm:text-2xl xs:text-xl hover:text-white text-gray-300">{song?.album}</Link>
            <p className="text-lg text-gray-300 mb-4">
              <span>{song?.release_date.slice(0, 4)}</span> | By{" "}
              {song?.artists.map((a, i) => (
                <Link to={`/artist/${a.artist_id}`} key={a.id} className="hover:text-white">
                  {a.name}
                  {i < song.artists.length - 1 ? ", " : ""}
                </Link>
              ))}
            </p>

            {song.spotify_url && (
              <a
                href={song.spotify_url}
                target="_blank"
                rel="noopener noreferrer"
                className=" flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-black font-semibold py-2 px-4 rounded-lg shadow-md transition w-fit mb-8"
              >
                <FaSpotify className="text-xl" />
                <span>Listen on Spotify</span>
              </a>
            )}

            {/* Ratings */}
            <div className="w-full flex items-center justify-between mb-6">
              <p className="text-2xl font-bold text-white">Ratings</p>

              {globalTotal > 0 && (<p className="text-gray-400 text-md">{globalTotal} listeners</p>)}
            </div>

            {globalTotal <= 0 && (<p className='text-lg text-gray-300'>No ratings yet  -  be the first!</p>)}
            {globalTotal > 0 &&
              (
                <div className="flex items-center justify-center w-full">
                  <div className="mr-9">
                    <p className="text-2xl text-gray-200 text-center">{globalAverage.toFixed(1)}</p>
                    <p className="text-sm text-gray-400 text-center">Stars</p>
                  </div>
                  <BarChart width={250} height={150} data={globalRatings}>
                    <XAxis dataKey="rating" />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </div>
              )}



            {/* Where to Listen */}
            {/* <div className="mb-6">
              <div className="w-full flex items-center justify-between border-b-2 mb-5 border-gray-500">
                <p className="text-xl font-semibold text-left ">Where to Listen</p>
              </div>
              <div className="space-y-2">
                <Button className="shad-button_primary">
                  <a href={song?.spotify_url} target="_blank" className="text-black">Spotify</a>
                </Button>
              </div>
            </div> */}

            {/* Reviews */}
            <div>
              <ul>
                <div className="w-full flex items-center justify-between mb-6">
                  <p className="text-2xl font-bold text-white">Reviews</p>
                </div>
                {song?.reviews.length == 0 ? (<p className="text-center text-gray-300">No reviews yet. Be the first to review this track!</p>) : ''}
                {song?.reviews.map((r) => (
                  <ReviewItem reviewId={r.reviewId} text={r.text} creator={r.creator} song={r.song} likes={r.likes} createdAt={r.createdAt} updatedAt={r.updatedAt} key={r.reviewId} />
                )
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongDetailsSection;
