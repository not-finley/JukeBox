import { useState, useEffect } from "react";
import { useUserContext } from "@/lib/AuthContext";
import { useParams } from "react-router-dom";
import { getListened, getRated, getReviewed, getUserById, updateUser } from "@/lib/appwrite/api";
import { Listened, Rating, SongReview } from "@/types";
import { IUser } from "@/types";
import LoaderMusic from "@/components/shared/loaderMusic";
import defaultAvatar from "/assets/icons/profile-placeholder.svg";



type profileProps = {
  user: IUser;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  isCurrentUser: boolean;
  listened: any[];
  reviews: any[];
  raitings: any[];
};

const TABS = ["Listens", "Reviews", "Ratings"];

const ProfileComponent = ({
  user,
  activeTab,
  setActiveTab,
  isCurrentUser,
  listened,
  reviews,
  raitings
}: profileProps) => {
  const [editing, setEditing] = useState(false);
  const { setUser } = useUserContext();
  const [bio, setBio] = useState(user.bio || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(user.imageUrl || defaultAvatar);

  const handleSave = async () => {
    try {
      let updatedImageUrl = previewUrl;

      if (imageFile) {
        const updatedUserData = await updateUser({
          accountId: user.accountId,
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
              <p className="body-bold text-lg md:text-xl">{user.name}</p>
              <p className="small-regular text-light-3">@{user.username}</p>
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
                        setBio(user.bio || "");
                        setPreviewUrl(user.imageUrl || "/assets/images/profile-placeholder.svg");
                        setImageFile(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
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
              user.bio || "No bio yet."
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
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-2 md:gap-4">
              {listened.map((listen, idx) => (
                <p key={idx}>{listen.name}</p>
              ))}
            </div>
          )}
          {activeTab === "Reviews" && (
            <div className="flex flex-col gap-4">
              {reviews.map((review, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <span className="font-medium text-indigo-200">{review.song.title}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === "Ratings" && (
            <div className="flex flex-col gap-4">
              {raitings.map((rating, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 border border-gray-700">
                  <span className="font-medium text-yellow-200">{rating.song.title}</span>
                  <span className="text-yellow-400 ml-auto">{"★".repeat(rating.rating)}</span>
                </div>
              ))}
            </div>
          )}
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
  const [reviewed, setReviewed] = useState<SongReview[]>([]);
  const [rated, setRated] = useState<Rating[]>([]);
  const [profileUser, setProfileUser] = useState<IUser | null>(null);

  const isCurrentUser = user?.accountId === id;

  useEffect(() => {
    const fetchProfileUser = async () => {
      if (isCurrentUser) {
        setProfileUser(user);
      } else if (id) {
        const otherUser = await getUserById(id);
        setProfileUser(otherUser);
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
            const newSongs = await getListened(profileUser.accountId);
            setListened(newSongs);
          }
          break;
        case "Reviews":
          if (reviewed.length === 0) {
            const newReviews = await getReviewed(profileUser.accountId);
            setReviewed(newReviews);
          }
          break;
        case "Ratings":
          if (rated.length === 0) {
            const newRatings = await getRated(profileUser.accountId);
            setRated(newRatings);
          }
          break;
      }
    };

    fetchTabData();
  }, [activeTab, profileUser]);

  if (!profileUser) {
    return <div className="text-center text-gray-400"><LoaderMusic /></div>;
  }

  return (
    <div className="user-container flex">
      <ProfileComponent user={profileUser} activeTab={activeTab} setActiveTab={setActiveTab} isCurrentUser={isCurrentUser} reviews={reviewed} raitings={rated} listened={listened} />
    </div>
  );
};

export default Profile;