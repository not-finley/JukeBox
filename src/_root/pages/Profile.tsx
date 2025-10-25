import { useState, useEffect } from "react";
import { useUserContext } from "@/lib/AuthContext";
import { Link, useParams } from "react-router-dom";
import { getListened, getRated, getReviewed, getUserById, updateUser, addFollow, removeFollow, checkIfFollowing } from "@/lib/appwrite/api";
import { Listened, RatingGeneral, Review } from "@/types";
import { IUser } from "@/types";
import LoaderMusic from "@/components/shared/loaderMusic";
import defaultAvatar from "/assets/icons/profile-placeholder.svg";
import { isMobile, isTablet } from "react-device-detect";



type profileProps = {
  userid: string;
  profileuser: IUser;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  isCurrentUser: boolean;
  listened: any[];
  reviews: any[];
  ratings: any[];
  following: boolean;
  loadingListens: boolean;
  loadingReviews: boolean;
  loadingRatings: boolean;
};


const TABS = ["Listens", "Reviews", "Ratings"];

const ProfileComponent = ({
  userid,
  profileuser,
  activeTab,
  setActiveTab,
  isCurrentUser,
  listened,
  reviews,
  ratings,
  following,
  loadingListens,
  loadingReviews,
  loadingRatings
}: profileProps) => {
  const [editing, setEditing] = useState(false);
  const { setUser } = useUserContext();
  const [bio, setBio] = useState(profileuser.bio || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(profileuser.imageUrl || defaultAvatar);
  const [isFollowing, setIsFollowing] = useState(following);

  useEffect(() => {
    setPreviewUrl(profileuser.imageUrl || defaultAvatar);
    setBio(profileuser.bio || "");
  }, [profileuser]);

  useEffect(() => {
    // Sync with parent prop when it changes
    setIsFollowing(following);
  }, [following]);

  const handleSave = async () => {
    try {
      let updatedImageUrl = previewUrl;

      if (imageFile) {
        const updatedUserData = await updateUser({
          accountId: profileuser.accountId,
          bio,
          imageFile
        });

        // If you want, you can use the returned URL from Supabase instead of local preview
        updatedImageUrl = updatedUserData.profile_url ?? previewUrl;
      }

      // Update local state
      setPreviewUrl(updatedImageUrl);
      setEditing(false);

      // Update the global AuthContext
      setUser(prev => ({
        ...prev,
        bio,
        imageUrl: updatedImageUrl
      }));

    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImageFile(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleFollow = () => {
    try {
      console.log("Following user:", profileuser.accountId);
      addFollow(profileuser.accountId, userid);
      setIsFollowing(true);
    } catch (err) {
      console.error("Failed to follow user:", err);
    }
  }
  const handleUnfollow = () => {
    try {
      removeFollow(profileuser.accountId, userid);
      setIsFollowing(false);
    } catch (err) {
      console.error("Failed to follow user:", err);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto shadow rounded-2xl p-4 md:p-8 border border-gray-800 flex flex-col lg:flex-row gap-8">
      {/* Left: Avatar, Stats, Bio */}
      <div className="flex flex-col items-center w-full lg:max-w-xs flex-shrink-0">
        <img
          src={previewUrl}
          alt="User avatar"
          className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-gray-800 object-cover mb-4"
        />
        {editing && (
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mb-2 text-sm"
          />
        )}

        <div className="flex flex-col items-center lg:items-start w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mb-2 w-full justify-between">
            <div className="flex flex-col">
              <p className="body-bold text-lg md:text-xl">{profileuser.name}</p>
              <p className="small-regular text-light-3">@{profileuser.username}</p>
            </div>
            {isCurrentUser && (
              <div>
                {!editing ? (
                  <button
                    className="px-4 py-1 rounded border border-gray-700 text-sm font-medium hover:bg-gray-800 mt-2 md:mt-0"
                    onClick={() => setEditing(true)}
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button
                      className="px-4 py-1 rounded border border-gray-700 text-sm font-medium hover:bg-gray-800"
                      onClick={handleSave}
                    >
                      Save
                    </button>
                    <button
                      className="px-4 py-1 rounded border border-gray-700 text-sm font-medium hover:bg-gray-800"
                      onClick={() => {
                        setEditing(false);
                        setBio(profileuser.bio || "");
                        setPreviewUrl(profileuser.imageUrl || "/assets/images/profile-placeholder.svg");
                        setImageFile(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
            {!isCurrentUser && (
              <div>
                {!isFollowing ? (
                  <button
                    className="px-4 py-1 rounded border border-gray-700 text-sm font-medium hover:bg-gray-800 mt-2 md:mt-0"
                    onClick={handleFollow}
                  >
                    Follow
                  </button>
                ) : (
                  <button
                    className="px-4 py-1 rounded border border-gray-700 text-sm font-medium hover:bg-gray-800 mt-2 md:mt-0"
                    onClick={handleUnfollow}
                  >
                    Unfollow
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-8 text-center md:text-left mb-2 w-full justify-between">
            <div>
              <span className="font-bold">__</span>
              <div className="text-xs text-gray-400">Followers</div>
            </div>
            <div>
              <span className="font-bold">__</span>
              <div className="text-xs text-gray-400">Following</div>
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-2 w-full text-center lg:text-left">
            {editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-gray-100"
              />
            ) : (
              profileuser.bio || "No bio yet."
            )}
          </div>
        </div>
      </div>

      {/* Right: Tabs and Content */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex gap-2 md:gap-4 justify-center border-b border-gray-800 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-t-md font-semibold text-sm md:text-base transition-colors duration-200 focus:outline-none ${activeTab === tab
                ? "bg-gray-800 text-indigo-300 border-b-2 border-indigo-400"
                : "text-gray-400 hover:text-indigo-200"
                }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === "Listens" && (
            loadingListens ? (
              <LoaderMusic />
            ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
              {listened.map((listen, idx) => (
                <Link
                  key={idx}
                  to={listen.type === "song" ? `/song/${listen.id}` : `/album/${listen.id}`}
                  className="group relative block"
                >
                  {/* Cover Image */}
                  <img
                    src={listen.album_cover_url || "/assets/icons/music-placeholder.svg"}
                    alt={listen.name}
                    className="w-full aspect-square object-cover rounded-lg border border-gray-700 transition-transform duration-300 group-hover:scale-[1.03]"
                  />

                  {/* Conditional rendering based on device */}
                  {isMobile || isTablet ? (
                    // 📱 Always visible on touch devices
                    <div className="mt-2">
                      <p
                        className="text-gray-100 text-sm font-medium truncate"
                        title={listen.name}
                      >
                        {listen.name}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{listen.type}</p>
                    </div>
                  ) : (
                    // 🖱️ Hover overlay on desktop
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 rounded-lg">
                      <p
                        className="text-white text-sm font-medium truncate"
                        title={listen.name}
                      >
                        {listen.name}
                      </p>
                      <p className="text-xs text-gray-300 capitalize">{listen.type}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ))}


          {activeTab === "Reviews" && (
            loadingReviews ? (
              <LoaderMusic />
            ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div
                  key={review.reviewId}
                  className="flex bg-gray-800 border border-gray-700 rounded-xl p-3 hover:bg-gray-750 transition-colors"
                >
                  {/* Cover */}
                  <Link
                    to={review.type === "song" ? `/song/${review.id}` : `/album/${review.id}`}
                    className="flex-shrink-0"
                  >
                    <img
                      src={review.album_cover_url || "/assets/icons/music-placeholder.svg"}
                      alt={review.name}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  </Link>

                  {/* Details */}
                  <div className="ml-4 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-center gap-2">
                      <Link
                        to={review.type === "song" ? `/song/${review.id}` : `/album/${review.id}`}
                        className="text-indigo-200 font-semibold hover:underline truncate max-w-[12rem] sm:max-w-[16rem] md:max-w-[20rem]"
                      >
                        {review.name}
                      </Link>
                      <span className="text-xs text-gray-400 capitalize flex-shrink-0">
                        {review.type}
                      </span>
                    </div>

                    {/* Optional review snippet */}
                    <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                      {review.text}
                    </p>

                    {/* Date */}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {activeTab === "Ratings" && (
            loadingRatings ? (
              <LoaderMusic />
            ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {ratings.map((rating, idx) => (
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
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};


const Profile = () => {
  const { user } = useUserContext();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Listens");
  const [listened, setListened] = useState<Listened[]>([]);
  const [reviewed, setReviewed] = useState<Review[]>([]);
  const [loadingListens, setLoadingListens] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [rated, setRated] = useState<RatingGeneral[]>([]);
  const [profileUser, setProfileUser] = useState<IUser | null>(null);
  const [following, setFollowing] = useState<boolean>(false);
  const isCurrentUser = user?.accountId === id;

  useEffect(() => {
    const fetchProfileUser = async () => {
      if (isCurrentUser) {
        setProfileUser(user);
      } else if (id) {
        const otherUser = await getUserById(id);
        const following = await checkIfFollowing(id, user.accountId);
        setProfileUser(otherUser);
        setFollowing(following);
      }
    };
    fetchProfileUser();
  }, [id, user, isCurrentUser]);

  useEffect(() => {
    const fetchTabData = async () => {
      if (!profileUser?.accountId) return;

      switch (activeTab) {
        case "Listens":
          if (listened.length === 0) {
            setLoadingListens(true);
            const newSongs = await getListened(profileUser.accountId);
            setListened(newSongs);
            setLoadingListens(false);
          }
          break;
        case "Reviews":
          if (reviewed.length === 0) {
            setLoadingReviews(true);
            const newReviews = await getReviewed(profileUser.accountId);
            setReviewed(newReviews);
            setLoadingReviews(false);
          }
          break;
        case "Ratings":
          if (rated.length === 0) {
            setLoadingRatings(true);
            const newRatings = await getRated(profileUser.accountId);
            setRated(newRatings);
            setLoadingRatings(false);
          }
          break;
      }
    };

    fetchTabData();
  }, [activeTab, profileUser]);


  if (!profileUser) {
    return <div className="common-container"><LoaderMusic /></div>;
  }

  return (
    <div className="user-container flex">
      <ProfileComponent userid={user.accountId} profileuser={profileUser} activeTab={activeTab} setActiveTab={setActiveTab} isCurrentUser={isCurrentUser} reviews={reviewed} ratings={rated} listened={listened} loadingListens={loadingListens} loadingReviews={loadingReviews} loadingRatings={loadingRatings} following={following} />
    </div>
  );
};

export default Profile;