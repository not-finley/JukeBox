import LoaderMusic from "@/components/shared/loaderMusic";
import { useUserContext } from "@/context/AuthContext";
import { getListened, getReviewed } from "@/lib/appwrite/api";
import { Listened, Review } from "@/types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Library = () => {
  const { user } = useUserContext();
  const [listened, setListened] = useState<Listened[]>([]);
  const [reviewed, setReviewed] = useState<Review[]>([]);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);

  const loadSongs = async () => {
    setLoading1(true);
    setLoading2(true);
    setLoading3(true);

    const newReviews = await getReviewed(user.accountId);
    newReviews.reverse();
    setReviewed(newReviews);
    setLoading1(false);


    
    setLoading2(false);

    const newSongs = await getListened(user.accountId);
    newSongs.reverse();
    setListened(newSongs);
    setLoading3(false);
  };

  useEffect(() => {
    loadSongs();
  }, [user])


  return (
    <div className="song-container">
      <h1 className="text-4xl font-bold">Library</h1>
      <div className="text-left w-full">
        <h2 className="text-2xl">Reviewed</h2>
      </div>
      {reviewed.map((s) => (
            <li key={s.reviewId} className="review-container flex items-start gap-4 mb-6 w-full">
              <Link to={`/song/${s.song.songId}`}>
                <img
                  src={s.song.album_cover_url}
                  className="h-24"
                />
                <p>{s.song.title}</p>
              </Link>
              <div>
                <p>{s.text}</p>
              </div>
            </li>
      ))}
      {loading1 ? (
            <LoaderMusic />): 
            ('')
      }

      <div className="text-left w-full">
        <h2 className="text-2xl">Listened To</h2>
      </div>
      <div className="song-grid">
        {listened.map((s) => (
            <Link key={s.song.songId} to={`/song/${s.song.songId}`}>
              <div className="song-card" key={s.song.songId}>
                <img src={s.song.album_cover_url} alt={s.song.title} className="song-image" />
                <p className="song-title">{s.song.title}</p>
              </div>
            </Link>
        ))}
      </div>
      {loading3 ? (
            <LoaderMusic />): 
            ('')
      }

      <div className="text-left w-full">
        <h2 className="text-2xl">Rated</h2>
      </div>
      {loading2 ? (
            <LoaderMusic />): 
            ('')
      }
    </div>
  )
}

export default Library