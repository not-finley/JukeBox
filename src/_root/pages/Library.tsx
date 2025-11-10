import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUserContext } from "@/lib/AuthContext";
import LoaderMusic from "@/components/shared/loaderMusic";
import ReviewItemLibrary from "@/components/ReviewItemLibrary";
import { getReviewedWithLimit, getRatedWithLimit, getListenedWithLimit } from "@/lib/appwrite/api";
import { Listened, RatingGeneral, Review } from "@/types/index";

const Library = () => {
  const { user } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState<Review[]>([]);
  const [rated, setRated] = useState<RatingGeneral[]>([]);
  const [listened, setListened] = useState<Listened[]>([]);
  const [activeSection, setActiveSection] = useState<"reviews" | "ratings" | "listens" | "playlists">("reviews");

  useEffect(() => {
    if (!user?.accountId) return;
    const load = async () => {
      setLoading(true);
      const [r1, r2, r3] = await Promise.all([
        getReviewedWithLimit(user.accountId, 50),
        getRatedWithLimit(user.accountId, 100),
        getListenedWithLimit(user.accountId, 100),
      ]);
      setReviewed(r1);
      setRated(r2);
      setListened(r3);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <div className="common-container"><LoaderMusic /></div>;

  const SECTIONS = [
    { key: "reviews", label: "Reviews" },
    { key: "ratings", label: "Rated" },
    { key: "listens", label: "Listening History" },
    { key: "playlists", label: "Playlists" }, // future feature
  ];


  return (
    <div className="common-container">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Your Library</h1>

        {/* NAVIGATION TABS */}
        <div className=" max-w-6xl flex gap-4 border-b border-gray-800 mb-6 overflow-x-auto">
          {SECTIONS.map(sec => (
            <button
              key={sec.key}
              onClick={() => setActiveSection(sec.key as any)}
              className={`pb-3 text-sm font-semibold transition-colors ${activeSection === sec.key
                  ? "text-emerald-300 border-b-2 border-emerald-400"
                  : "text-gray-400 hover:text-gray-200"
                }`}
            >
              {sec.label}
            </button>
          ))}
        </div>


        {/* ---- REVIEWS SECTION ---- */}
        {activeSection === "reviews" && (
          reviewed.length === 0 ? (
            <p className="text-gray-500">You haven't written any reviews yet.</p>
          ) : (
            <div className="max-w-6xl grid grid-cols-1 xl:grid-cols-2 gap-4">
              {reviewed.map(r => <ReviewItemLibrary key={r.reviewId} review={r} />)}
            </div>
          )
        )}


        {/* ---- RATINGS SECTION ---- */}
        {activeSection === "ratings" && (
          rated.length === 0 ? (
            <p className="text-gray-500">You haven't rated anything yet.</p>
          ) : (
            <div className="max-w-6xl grid grid-cols-1 xl:grid-cols-2 gap-4">
              {rated.map((rating, i) => (
                <div key={i} className="flex items-center bg-gray-800 p-3 rounded-xl border border-gray-700">
                  <Link to={rating.type === "song" ? `/song/${rating.id}` : `/album/${rating.id}`}>
                    <img
                      src={rating.album_cover_url || "/assets/icons/music-placeholder.svg"}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  </Link>

                  <div className="ml-4 flex-1 min-w-0">
                    <Link
                      to={rating.type === "song" ? `/song/${rating.id}` : `/album/${rating.id}`}
                      className="text-indigo-200 font-semibold truncate hover:underline"
                    >
                      {rating.title}
                    </Link>
                    <p className="text-xs text-gray-400 capitalize">{rating.type}</p>
                    <div className="mt-1 flex">
                      {[...Array(5)].map((_, star) => (
                        <span key={star} className={star < rating.rating ? "text-yellow-400" : "text-gray-600"}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}


        {/* ---- LISTENING HISTORY ---- */}
        {activeSection === "listens" && (
          listened.length === 0 ? (
            <p className="text-gray-500">You haven't listened to anything yet.</p>
          ) : (
            <div className=" max-w-6xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {listened.map(item => (
                <Link
                  key={item.id}
                  to={item.type === "song" ? `/song/${item.id}` : `/album/${item.id}`}
                  className="group"
                >
                  <img
                    src={item.album_cover_url || "/assets/icons/music-placeholder.svg"}
                    className="w-full aspect-square object-cover rounded-lg border border-gray-800 group-hover:scale-[1.02] transition"
                  />
                  <p className="text-sm text-gray-200 truncate mt-2">{item.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{item.type}</p>
                </Link>
              ))}
            </div>
          )
        )}


        {/* ---- PLAYLISTS (EMPTY STATE FOR NOW) ---- */}
        {activeSection === "playlists" && (
          <div className=" max-w-6xl text-gray-400 text-center py-16">
            {/* <p className="text-xl font-semibold mb-2">No playlists yet</p>
            <p className="text-sm">Create playlists to collect songs and albums you love.</p> */}
            {/* <button
              disabled
              className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Create Playlist
            </button> */}
            <p className="text-gray-500">Working on adding this feature still, check back in a few weeks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
