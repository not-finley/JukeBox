import ReviewItemLibrary from "@/components/ReviewItemLibrary";
import LoaderMusic from "@/components/shared/loaderMusic";
import { useUserContext } from "@/lib/AuthContext";
import { getListenedWithLimit, getRatedWithLimit, getReviewedWithLimit } from "@/lib/appwrite/api";
import { Listened, RatingGeneral, Review } from "@/types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";



const Library = () => {
  const { user } = useUserContext();
  const [listened, setListened] = useState<Listened[]>([]);
  const [reviewed, setReviewed] = useState<Review[]>([]);
  const [rated, setRated] = useState<RatingGeneral[]>([]);
  const [loading1, setLoading1] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [loading3, setLoading3] = useState(true);

  const loadSongs = async () => {
    if (user?.accountId) {
      const newReviews = await getReviewedWithLimit(user.accountId, 2);
      setReviewed(newReviews);
      setLoading1(false);


      const newRatings = await getRatedWithLimit(user.accountId, 4);
      setRated(newRatings);
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
      <h1 className="text-4xl font-bold mb-4">Library</h1>

      {/* --- Reviewed Section --- */}
      <div className="section-header w-full max-w-6xl flex items-center justify-between border-b-2 border-gray-500 mb-2 pb-1">
        <h2 className="text-2xl font-semibold">Reviewed</h2>
        <Link to="/library/reviews" className="text-md text-gray-400 hover:text-gray-200">
          See more
        </Link>
      </div>

      {loading1 ? (
        <LoaderMusic />
      ) : reviewed.length === 0 ? (
        <p className="text-gray-400">No songs reviewed.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviewed.map((r) => (
            <ReviewItemLibrary
              key={r.reviewId}
              review={r}
            />
          ))}
        </div>
      )}

      {/* --- Rated Section --- */}
      <div className="section-header w-full flex max-w-6xl items-center justify-between border-b-2 border-gray-500 mt-6 mb-2 pb-1">
        <h2 className="text-2xl font-semibold">Rated</h2>
        <Link to="/library/rated" className="text-md text-gray-400 hover:text-gray-200">
          See more
        </Link>
      </div>

      {loading2 ? (
        <LoaderMusic />
      ) : rated.length === 0 ? (
        <p className="text-gray-400">No songs rated.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {rated.map((rating, idx) => (
                <div
                  key={idx}
                  className="flex items-center bg-gray-800 border border-gray-700 rounded-xl p-3 hover:bg-gray-750 transition-colors min-w-0"
                >
                  {/* Album or song cover */}
                  <Link
                    to={rating.type === "song" ? `/song/${rating.id}` : `/album/${rating.id}`}
                    className="flex-shrink-0"
                  >
                    <img
                      src={rating.album_cover_url || "/assets/icons/music-placeholder.svg"}
                      alt={rating.title}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  </Link>

                  {/* Main details */}
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <Link
                        to={rating.type === "song" ? `/song/${rating.id}` : `/album/${rating.id}`}
                        title={rating.title} // 👈 tooltip for full title
                        className="text-indigo-200 font-semibold hover:underline truncate overflow-hidden whitespace-nowrap max-w-[12rem] sm:max-w-[16rem] md:max-w-[20rem]"
                      >
                        {rating.title}
                      </Link>
                      <span className="text-xs text-gray-400 capitalize flex-shrink-0">
                        {rating.type}
                      </span>
                    </div>

                    {/* Rating stars */}
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${i < rating.rating ? "text-yellow-400" : "text-gray-500"
                            }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>

                    {/* Date formatted */}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(rating.rating_date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
        </ul>
      )}

      {/* --- Listened Section --- */}
      <div className="section-header w-full flex items-center max-w-6xl justify-between border-b-2 border-gray-500 mt-6 mb-2 pb-1">
        <h2 className="text-2xl font-semibold">Listened To</h2>
        <Link to="/library/listened" className="text-md text-gray-400 hover:text-gray-200">
          See more
        </Link>
      </div>

      {loading3 ? (
        <LoaderMusic />
      ) : listened.length === 0 ? (
        <p className="text-gray-400">No songs listened to.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {listened.map((s) => (
            <Link key={s.id} to={`/${s.type}/${s.id}`}>
              <div className="flex flex-col items-center bg-gray-800 rounded-lg overflow-hidden p-2 hover:scale-[1.02] transition-transform">
                <img src={s.album_cover_url || "/assets/icons/music-placeholder.svg"} alt={s.name} className="w-full aspect-square object-cover rounded-md mb-1" />
                <p className="text-sm text-center truncate w-full">{s.name}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>

  )
}

export default Library