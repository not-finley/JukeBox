import ReviewItemLibrary from "@/components/ReviewItemLibrary";
import LoaderMusic from "@/components/shared/loaderMusic";
import { useUserContext } from "@/context/AuthContext";
import { getListenedWithLimit, getRatedWithLimit, getReviewedWithLimit } from "@/lib/appwrite/api";
import { Listened, Rating, Review } from "@/types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";



const Library = () => {
  const { user } = useUserContext();
  const [listened, setListened] = useState<Listened[]>([]);
  const [reviewed, setReviewed] = useState<Review[]>([]);
  const [rated, setRated] = useState<Rating[]>([]);
  const [loading1, setLoading1] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [loading3, setLoading3] = useState(true);

  const loadSongs = async () => {
    if (user?.accountId) {
      const newReviews = await getReviewedWithLimit(user.accountId, 2);
      setReviewed(newReviews);
      setLoading1(false);


      const newRaitings = await getRatedWithLimit(user.accountId, 4);
      setRated(newRaitings);
      setLoading2(false);

      const newSongs = await getListenedWithLimit(user.accountId, 4);
      setListened(newSongs);
      setLoading3(false);
    }
  };

  useEffect(() => {
    loadSongs();
  }, [user])


  return (
    <div className="song-container">
      <h1 className="text-4xl font-bold">Library</h1>
      <div className="w-full flex items-center justify-between -m-5 border-b-2 border-gray-500">
        <h2 className="text-2xl">Reviewed</h2>
        <Link to='/library/reviews' className="text-md text-gray-400 hover:text-gray-200">See more</Link>
      </div>
      {reviewed.map((s) => (
        <ReviewItemLibrary reviewId={s.reviewId} text={s.text} creator={s.creator} song={s.song} likes={s.likes} createdAt={s.createdAt} updatedAt={s.updatedAt} key={s.reviewId}/>
      ))}
      {loading1 ? (
            <LoaderMusic />): 
            ('')
      }
      {!loading1 && reviewed.length == 0 ? (
            <p>No songs reviewed.</p>): 
            ('')
      }

      <div className="w-full flex items-center justify-between border-b-2 border-gray-500">
        <h2 className="text-2xl">Rated</h2>
        <Link to='/library/rated' className="text-md text-gray-400 hover:text-gray-200">See more</Link>
      </div>
      {rated.length > 0? (
        <div className="raiting-grid">
        {rated.map((s) => (
              <li key={s.ratingId} className="flex w-full bg-emerald-600 rounded-md justify-center items-center p-2 hover:bg-emerald-500">
                <Link to={`/song/${s.song.songId}`} className="flex-col items-center justify-center w-16">
                  <img
                    src={s.song.album_cover_url}
                    className="h-16 m-1"
                  />
                </Link>
                <div className="flex-col text-left items-center justify-normal">
                  <p className="text-sm pl-5">{s.song.title.length >28? s.song.title.slice(0,28) + "...": s.song.title}</p>
                  <div className="flex mx-3">
                    {[...Array(5)].map((_, index) => {
                        const value = (index + 1);
                        return (
                          <img 
                            key={s.ratingId + value}
                            src={s.rating >= value? '/assets/icons/star_full.svg' : '/assets/icons/star_empty.svg'}
                            className="w-8 m-1"
                          />
                        );
                      })}
                  </div>
                </div>  
              </li>
      ))}
      </div>)
      :''}
      {loading2 ? (
            <LoaderMusic />): 
            ('')
      }
      {!loading2 && rated.length == 0 ? (
            <p>No songs rated.</p>): 
            ('')
      }
      
      <div className="w-full flex items-center justify-between -m-5 border-b-2 border-gray-500">
        <h2 className="text-2xl">Listened To</h2>
        <Link to='/library/listened' className="text-md text-gray-400 hover:text-gray-200">See more</Link>
      </div>
      {listened.length > 0? (
        <div className='song-grid'>
        {listened.map((s) => (
            <Link key={s.song.songId} to={`/song/${s.song.songId}`}>
              <div className="song-card" key={s.song.songId}>
                <img src={s.song.album_cover_url} alt={s.song.title} className="song-image" />
                <p className="song-title">{s.song.title}</p>
              </div>
            </Link>
        ))}
      </div>
      ): ''}
      
      {loading3 ? (
            <LoaderMusic />): 
            ('')
      }
      {!loading3 && listened.length == 0 ? (
            <p>No songs listened to.</p>): 
            ('')
      }
    </div>
  )
}

export default Library