import { useState } from "react";
import { useUserContext } from "@/context/AuthContext";
import { useParams } from "react-router-dom";
import { IUser } from "@/types";

const mockUser = {
  avatar: "https://randomuser.me/api/portraits/men/51.jpg",
  name: "alex",
  displayName: "Musiclover",
  bio: "Music enthusiast. Always searching for the next great track. Lover of indie, pop, and everything in between!",
  stats: {
    posts: 12,
    followers: 210,
    following: 79,
  },
  highlights: [
    { label: "Listens", color: "bg-pink-800" },
    { label: "Reviews", color: "bg-indigo-800" },
    { label: "Ratings", color: "bg-yellow-800" },
    { label: "About", color: "bg-gray-800" },
  ],
  listens: [
    { image: "/assets/icons/headphones.svg", label: "Blinding Lights" },
    { image: "/assets/icons/headphones.svg", label: "Levitating" },
    { image: "/assets/icons/headphones.svg", label: "Peach" },
    { image: "/assets/icons/headphones.svg", label: "Blinding Lights" },
    { image: "/assets/icons/headphones.svg", label: "Levitating" },
    { image: "/assets/icons/headphones.svg", label: "Peach" },
    { image: "/assets/icons/headphones.svg", label: "Blinding Lights" },
    { image: "/assets/icons/headphones.svg", label: "Levitating" },
    { image: "/assets/icons/headphones.svg", label: "Peach" },
    { image: "/assets/icons/headphones.svg", label: "Blinding Lights" },
    { image: "/assets/icons/headphones.svg", label: "Levitating" },
    { image: "/assets/icons/headphones.svg", label: "Peach" },
  ],
  reviews: [
    { song: "Blinding Lights", review: "Incredible synthwave vibes!" },
    { song: "Levitating", review: "Super catchy and fun." },
  ],
  ratings: [
    { song: "Peach", rating: 5 },
    { song: "Levitating", rating: 4 },
  ],
};

const TABS = ["Listens", "Reviews", "Ratings"];

type profileProps = {
  user : IUser; 
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  isCurrentUser: boolean;
}

const ProfileComponent = ({ user, activeTab, setActiveTab, isCurrentUser } : profileProps) => (
  <div className="w-full max-w-6xl mx-auto shadow rounded-2xl p-4 md:p-8  border border-gray-800 flex flex-col lg:flex-row gap-8">
    {/* Left: Avatar, Stats, Bio */}
    <div className="flex flex-col items-center w-full lg:max-w-xs flex-shrink-0">
      <img
        src={user.imageUrl || '/assets/images/profile-placeholder.svg'}
        alt="User avatar"
        className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-gray-800 object-cover mb-4"
      />
      <div className="flex flex-col items-center lg:items-start w-full">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mb-2 w-full justify-between">
          <div className="flex flex-col">
            <p className="body-bold text-lg md:text-xl">{user.name}</p>
            <p className="small-regular text-light-3">@{user.username}</p>
          </div>
          {isCurrentUser? (
            <button className="px-4 py-1 rounded border border-gray-700 text-sm font-medium hover:bg-gray-800 mt-2 md:mt-0">
            Edit Profile
          </button>
          ) : (
            <button className="px-4 py-1 rounded border border-gray-700 text-sm font-medium hover:bg-gray-800 mt-2 md:mt-0">
              Follow
            </button>
          )}
        </div>
        <div className="flex gap-8 text-center md:text-left mb-2 w-full justify-between">
          <div>
            <span className="font-bold">__</span>
            <div className="text-xs text-gray-400">Posts</div>
          </div>
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
          {mockUser.bio}
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
            className={`px-4 py-2 rounded-t-md font-semibold text-sm md:text-base transition-colors duration-200 focus:outline-none ${
              activeTab === tab
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
            {mockUser.listens.map((listen, idx) => (
              <div
                key={idx}
                className="aspect-square bg-gray-800 rounded-lg flex flex-col items-center justify-center overflow-hidden border border-gray-700"
              >
                <img src={listen.image} alt={listen.label} className="w-10 h-10 mb-1" />
                <span className="text-xs text-gray-200 text-center px-1 truncate w-full">
                  {listen.label}
                </span>
              </div>
            ))}
          </div>
        )}
        {activeTab === "Reviews" && (
          <div className="flex flex-col gap-4">
            {mockUser.reviews.map((review, idx) => (
              <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <span className="font-medium text-indigo-200">{review.song}</span>
                <p className="text-gray-200 mt-1">{review.review}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === "Ratings" && (
          <div className="flex flex-col gap-4">
            {mockUser.ratings.map((rating, idx) => (
              <div key={idx} className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 border border-gray-700">
                <img src="/assets/icons/star_full.svg" className="w-8 h-8" />
                <span className="font-medium text-yellow-200">{rating.song}</span>
                <span className="text-yellow-400 ml-auto">{"★".repeat(rating.rating)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);


const Profile = () => {
  const { user } = useUserContext();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Listens");

  // Replace this with your real user/account id logic
  const isCurrentUser = user?.accountId === id;

  if (!user || !user.accountId) {
    return <div className="text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="user-container flex">
      <ProfileComponent user={user} activeTab={activeTab} setActiveTab={setActiveTab} isCurrentUser={isCurrentUser} />
    </div>
  );
};

export default Profile;