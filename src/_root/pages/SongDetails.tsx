import { SongDetails } from "@/types";
import { Link, useParams } from "react-router-dom";
import { addListened, addSongToDatabase, getSongDetailsById, hasListened, removeListened } from "@/lib/appwrite/api";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import LoaderMusic from "@/components/shared/loaderMusic";
import { getSpotifyToken, SpotifyById } from "@/lib/appwrite/spotify";
import { useUserContext } from "@/context/AuthContext";

const SongDetailsSection = () => {
  const { id } = useParams();
  const [song, setSong] = useState<SongDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [listened, setListened] = useState(true);
  const [songNotFound, setNotFound] = useState(false);
  const { user } = useUserContext();
  const [rating, setRating] = useState(0); // Selected rating
  const [hover, setHover] = useState(0); // Hovered rating

  const handleRating = (value : number) => {
    setRating(value);
    //console.log(value);
  };

  const handleHover = (value : number ) => {
    setHover(value);
    //console.log(value);
  };

  const getSong = async () => {
    try {
      const spotifyToken: string = await getSpotifyToken();
      const spotifySong = await SpotifyById(id? id : "", spotifyToken);
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
        await getSong(); // Only call getSong if the song is not in the database
      } else {
        setSong(fetchedSong);
      }
    } catch (error) {
      console.error("Error fetching song or reviews:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchListened = async () => {
    try {
      const listenedtemp = await hasListened(user.accountId, id || "") 
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
    }
  }, [user?.accountId, id]);

  if (loading) {
    return (
      <div className="common-container">
        <LoaderMusic />
      </div>
    );
  }
  if (!song) {
    /*add to database if exists in spotify*/
    //getSong();
    if(songNotFound) {
      return (
        <div className="common-container">
         <p>Song not found</p>
        </div>
      )
    }
  }

  const listenedClick = async () => {
    if (listened) {
      await removeListened(song?song.songId: '', user.accountId)
      setListened(false);
    } else {
      await addListened(song?song.songId: '', user.accountId)
      setListened(true);
    }
  }
  return (
    <div className="common-container">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row">
        {/* Left Section: Album Cover */}
        <div className="lg:w-1/3 flex-shrink-0 mb-8 lg:mb-0">
          <img
            src={song?.album_cover_url}
            alt="Album Cover"
            className="rounded-lg shadow-lg"
          />
          <div className="flex gap-2 mt-2">
            <Button className="shad-button_primary w-1/2" onClick={listenedClick}>
              <div className="flex-col flex-center">
                <img
                  width={25}
                  src={listened ? '/assets/icons/headphones-filled.svg' : '/assets/icons/headphones.svg'}
                />
                <p className="tiny-medium text-black">{listened ? 'remove' : 'Listened'}</p>
              </div>
            </Button>

            <Link className={`${buttonVariants({ variant: "default" })} shad-button_primary w-1/2`}
              to={`/song/${song?.songId}/add-review`}
              key="add-review"
            >
              <div className="flex-col flex-center">
                <img
                  width={25}
                  src='/assets/icons/pen-nib.svg'
                />
                <p className="tiny-medium text-black">Review</p>
              </div>
            </Link>
          </div>
          <div className="bg-emerald-500 w-full h-10 rounded-md mt-2 justify-center flex items-center">
            <div className="flex gap-1">
              {[...Array(5)].map((_, index) => {
                const value = (index + 1);
                return (
                  <button
                    key={value}
                    type="button"
                    className="text-2xl text-black hover:text-gray-50"
                    onClick={() => handleRating(value)}
                    onMouseEnter={() => handleHover(value)}
                    onMouseLeave={() => setHover(0)}
                  >
                    <img
                      //src={hover >= value || rating >= value? '/assets/icons/star_full.svg' : '/assets/icons/star_empty.svg'}
                      //src={hover >= value? '/assets/icons/star_full.svg' : rating >= value? '/assets/icons/star_full_bg.svg' : '/assets/icons/star_empty.svg'}
                      src={hover > 0? (hover >= value? '/assets/icons/star_full.svg' : '/assets/icons/star_empty.svg') : rating >= value? '/assets/icons/star_full.svg' : '/assets/icons/star_empty.svg' }
                      className="h-4/6 w-10"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section: Details */}
        <div className="lg:w-2/3 lg:ml-8">
          <h1 className="lg:text-4xl md:text-2xl sm:text-3xl xs:text-2xl mb-4">
            <p className="font-bold">{song?.title}</p> {song?.album}
          </h1>
          <p className="text-lg text-gray-400 mb-4">
            <span>{song?.release_date.slice(0, 4)}</span> | By <span className="text-white"></span>
          </p>

          {/* Ratings */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-emerald-500 text-xl font-semibold">3.1</span>
              <div className="h-5 w-32 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: "30%" }}></div>
              </div>
              <span className="text-gray-400 text-sm">(none)</span>
            </div>
          </div>

          {/* Where to Listen */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Where to Listen</h2>
            <div className="space-y-2">
              <Button className="shad-button_primary">
                <a href={song?.spotify_url} target="_blank" className="text-black">Spotify</a>
              </Button>
            </div>
          </div>

          {/* Reviews */}
          <div>
            <ul>
              <h2 className="text-xl font-semibold mb-2">Recent Reviews</h2>
              {song?.review.map((r) => (
                <li key={r.reviewId} className="review-container flex items-start gap-4 mb-6">
                  <img
                    src={r.creator.imageUrl}
                    alt={r.creator.username}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <p>
                      Reviewed by <Link to={`/profile/${r.creator.accountId}`} className="underline">{r.creator.username}</Link>
                    </p>
                    <p>{r.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetailsSection;
