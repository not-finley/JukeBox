import { Review, SongDetails } from "@/types";
import { Link, useParams } from "react-router-dom";
import { addListened, addRating, addSongToDatabase, getAllRatingsOfaSong, getRating, getSongDetailsById, hasListened, hasRating, removeListened, updateRating } from "@/lib/appwrite/api";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import LoaderMusic from "@/components/shared/loaderMusic";
import { getSpotifyToken, SpotifyById } from "@/lib/appwrite/spotify";
import { useUserContext } from "@/context/AuthContext";

const ReviewItem = (review : Review ) => {
  const [longVis, setLongVis] = useState(false);
  const toggleLongVis = () => setLongVis(!longVis);

  return (
    <li className="review-container flex items-start gap-4 mb-6">
      <img
        src={review.creator.imageUrl}
        alt={review.creator.username}
        className="h-10 w-10 rounded-full"
      />
      <div>
        <p>
          Reviewed by{" "}
          <Link to={`/profile/${review.creator.accountId}`} className="underline">
            {review.creator.username}
          </Link>
        </p>
        {!longVis && review.text.length > 400 ? (
          <p className="text-gray-200 text-sm w-fit">
            {review.text.slice(0, 400)} ...
            <button
              onClick={toggleLongVis}
              className="text-white hover:text-green-400"
            >
              more
            </button>
          </p>
        ) : (
          <p className="text-gray-200 text-sm w-fit">{review.text}</p>
        )}
      </div>
    </li>
  );
};





const SongDetailsSection = () => {
  const { id } = useParams();
  const [song, setSong] = useState<SongDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [listened, setListened] = useState(true);
  const [songNotFound, setNotFound] = useState(false);
  const { user } = useUserContext();
  const [rating, setRating] = useState(0); // Selected rating
  const [hover, setHover] = useState(0); // Hovered rating
  const [GlobalNumRatings, setGlobalNumRatings] = useState(0);
  const [GlobalRaiting, setGlobalRating] = useState(0); 
  const [counts, setCounts] = useState<number[]>([]); 


  const songGlobalRating = async () => {
    const GlobalRaitings = await getAllRatingsOfaSong(id?id: '');
    setGlobalNumRatings(GlobalRaitings.length);

    const raitings = GlobalRaitings.map(a => a.rating);

    let countslocal = [0, 0, 0, 0, 0];
    let raitingG = 0;
    for(let i = 0; i < 5; i++) {
      let count = 0;
      if (raitings[i]) {
        raitingG += raitings[i];
      }
      raitings.forEach((v) => v === (i + 1) && count++);
      countslocal[i] = count;
    }
    setCounts(countslocal);
    
    setGlobalRating(raitingG/GlobalRaitings.length);
  }

  const handleRating = async (value : number) => {
    setRating(value);
    const doesHaveRating = await hasRating(id? id: '', user.accountId);
    if (doesHaveRating) {
      await updateRating(id? id: '', user.accountId, value);
    } else {
      await addRating(id? id: '', user.accountId, value);
    }
    songGlobalRating();
  };

  const handleHover = async (value : number ) => {
    setHover(value);
  };

  const updateRatinglocal = async () => {
    const num = await getRating(id? id: '', user.accountId);
    setRating(num);
  }

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
      updateRatinglocal();
      songGlobalRating();
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
                  width={22.5}
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
          <p className="text-lg text-gray-300 mb-4">
            <span>{song?.release_date.slice(0, 4)}</span> | By <span className="text-white"></span>
          </p>

          {/* Ratings */}
          <div className="w-full flex items-center justify-between border-b-2 border-gray-300">
            <p className="text-xl font-semibold text-left ">Ratings</p>
            <p className="text-gray-400 text-md text-right">{GlobalNumRatings} listeners</p>
          </div>
          <div className="flex items-center w-full h-48 justify-center">
            <div>
              <p className="text-2xl text-gray-300 mr-2 text-center">{GlobalRaiting}</p>
              <p className="text-2xl text-gray-300 mr-2 text-center"> Stars</p>
            </div>
            <div className=" flex justify-between items-end h-4/5 w-4/5">
              {counts.map((c, index) => {
                const percentage = GlobalNumRatings > 0 ? (c / GlobalNumRatings) * 100 : 0;
                return (
                  <div key={index + 1} className="flex flex-col items-center w-1/5">
                    <span className="text-sm mt-2 text-gray-400">{percentage}%</span>
                    {/* Bar */}
                    <div
                      className="bg-emerald-600 rounded-t-lg max-w-14 w-full"
                      style={{ height: `${percentage}px` }}
                      title={`Count: ${c}`}
                    ></div>
                    {/* Label */}
                    <span className="text-sm mt-2 text-gray-400">{index + 1}</span>
                  </div>
                );
              })}
            </div>
            
          </div>
          

          {/* Where to Listen */}
          <div className="mb-6">
            <div className="w-full flex items-center justify-between border-b-2 mb-5 border-gray-300">
              <p className="text-xl font-semibold text-left ">Where to Listen</p>
            </div>
            <div className="space-y-2">
              <Button className="shad-button_primary">
                <a href={song?.spotify_url} target="_blank" className="text-black">Spotify</a>
              </Button>
            </div>
          </div>

          {/* Reviews */}
          <div>
            <ul>
              <div className="w-full flex items-center justify-between border-b-2 mb-5 border-gray-300">
                <p className="text-xl font-semibold text-left ">Recent Reviews</p>
                <p className="text-gray-400 text-md text-right">see more</p>
              </div>
              {song?.review.map((r) => (
                <ReviewItem reviewId={r.reviewId} text={r.text} creator={r.creator} song={r.song} likes={r.likes} createdAt={r.createdAt} updatedAt={r.updatedAt} key={r.reviewId}/>
              )
              )}








              {/* {song?.review.map((r) => 
                (  
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
                    {r.text.length > 400? (<p className="text-gray-200 text-sm w-fit">{r.text.slice(0, 400)} ... <button className="text-white hover:text-green-400">more</button></p>)
                :(<p className="text-gray-200 text-sm w-fit">{r.text}</p>)}
                  </div>
                </li>
              ))} */}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetailsSection;
