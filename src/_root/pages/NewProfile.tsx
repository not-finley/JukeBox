import { useState, useEffect } from "react";
import { useUserContext } from "@/lib/AuthContext";
import { Link, useParams } from "react-router-dom";
import { getListened, getRated, getReviewed, getUserById, updateUser, addFollow, removeFollow, checkIfFollowing, getFollowersList, getPlaylists } from "@/lib/appwrite/api";
import { Listened, RatingGeneral, Review, IUser, Playlist } from "@/types";
import LoaderMusic from "@/components/shared/loaderMusic";
import AuthModal from "@/components/shared/AuthModal";
import { Edit2, Star, Disc, Music, Settings } from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";
import StarIcon from '@/components/shared/StarIcon';

type profileProps = {
    userid: string;
    profileuser: IUser;
    setProfileUser: React.Dispatch<React.SetStateAction<IUser | null>>;
    activeTab: string;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    isCurrentUser: boolean;
    listened: Listened[];
    reviews: Review[];
    ratings: RatingGeneral[];
    playlists: Playlist[];
    following: boolean;
    loadingListens: boolean;
    loadingReviews: boolean;
    loadingRatings: boolean;
};

const TABS = ["Listens", "Reviews", "Ratings", "Playlists"];

const ProfileComponent = ({
    userid,
    profileuser,
    setProfileUser,
    activeTab,
    setActiveTab,
    isCurrentUser,
    listened,
    reviews,
    ratings,
    playlists,
    following,
    loadingListens,
    loadingReviews,
    loadingRatings
}: profileProps) => {

    const fallbackImage = "/assets/icons/profile-placeholder.svg";
    const { setUser, isAuthenticated } = useUserContext();
    
    const [editing, setEditing] = useState(false);
    const [bio, setBio] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState(profileuser.imageUrl || fallbackImage);
    const [topFive, setTopFive] = useState<any[]>(profileuser.top_five || []);
    const [isFollowing, setIsFollowing] = useState(following);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showFollowModal, setShowFollowModal] = useState<{show: boolean, type: 'followers' | 'following'}>({
        show: false,
        type: 'followers'
    });
    const [list, setList] = useState<any[]>([]);
    const [loadingList, setLoadingList] = useState(false);

    // Sync state with props
    useEffect(() => {
        if(!editing){
            setPreviewUrl(profileuser.imageUrl || fallbackImage);
            setBio(profileuser?.bio || "");
            setTopFive(profileuser.top_five || []);
        }
        setIsFollowing(following);
    }, [profileuser, following, editing]);

    useEffect(() => {
        // Only fetch if the modal is actually open!
        if (!showFollowModal.show) return;

        const fetchList = async () => {
        setLoadingList(true);
        try {
            // Use profileuser.accountId, NOT userid
            const data = await getFollowersList(profileuser.accountId, showFollowModal.type);
            setList(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingList(false);
        }
        };

        fetchList();
    }, [profileuser.accountId, showFollowModal.type, showFollowModal.show]); 

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
        setImageFile(e.target.files[0]);
        setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        }
    };


    const handleSave = async () => {
        try {
            const updatedUserData = await updateUser({
                accountId: profileuser.accountId,
                bio,
                imageFile,
                topFive
            });

            const newBaseUrl = updatedUserData.profile_url || profileuser.imageUrl || fallbackImage;
            
            const cacheBustedUrl = imageFile 
                ? `${newBaseUrl.split('?')[0]}?t=${new Date().getTime()}`
                : newBaseUrl;
            

            setProfileUser(prev => {
                if (!prev) return prev;

                return {
                ...prev, 
                bio, 
                imageUrl: cacheBustedUrl,
                top_five: topFive 
            }});

            // 4. Update Global Auth Context
            setUser(prev => ({ 
                ...prev, 
                bio, 
                imageUrl: cacheBustedUrl,
                top_five: topFive 
            }));

            // 5. Clean up local state
            setImageFile(null);
            setEditing(false);

        } catch (err) {
            console.error("Failed to save profile:", err);
        }
    };

    const handleCancel = () => {
        // If there was a preview URL created from a file, revoke it to prevent memory leaks
        if (imageFile && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }

        // Reset to the original data from props
        setPreviewUrl(profileuser.imageUrl || fallbackImage);
        setBio(profileuser?.bio || "");
        setTopFive(profileuser.top_five || []);
        setImageFile(null); 
        setEditing(false);
    };

    const toggleTopFive = (item: any) => {
        if (!editing) return;

        if (item.type === 'song') return;
        
        setTopFive(prev => {
            // Remove if already there
            if (prev.find(a => a.id === item.id)) {
                return prev.filter(a => a.id !== item.id);
            }
            // Add if less than 5
            if (prev.length < 5) {
                return [...prev, item];
            }
            return prev;
        });
    };

    const handleFollowToggle = async () => {
        if (!isAuthenticated) return setShowAuthModal(true);
        try {
        if (isFollowing) {
            await removeFollow(profileuser.accountId, userid);
            profileuser.followersCount = Math.max((profileuser.followersCount || 1) - 1, 0);
        } else {
            await addFollow(profileuser.accountId, userid);
            profileuser.followersCount = (profileuser.followersCount || 0) + 1;
        }
        setIsFollowing(!isFollowing);
        } catch (err) {
        console.error("Follow action failed:", err);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 text-gray-100">
        
        {/* --- HEADER SECTION --- */}
        <header className="flex flex-col md:flex-row gap-8 items-center md:items-end mb-12">
            <div className="relative group">
        {/* Profile Image Container */}
        <div className={`relative w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden border-2 shadow-2xl transition-all ${editing ? 'border-emerald-500 cursor-pointer' : 'border-gray-800'}`}>
                <img 
                    src={previewUrl || "assets/icons/music-placeholder.png"} 
                    className="w-full h-full object-cover bg-gray-900"
                    alt="Avatar"
                    onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // If the URL we tried failed, swap it for the placeholder
                        if (target.src !== window.location.origin + "/assets/icons/music-placeholder.png ") {
                        target.src = window.location.origin + "/assets/icons/music-placeholder.png";
                        }
                    }}
                />
                
                {/* Camera Overlay (Only visible when editing) */}
                {editing && (
                    <label htmlFor="profile-upload" className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center cursor-pointer group-hover:bg-black/40 transition-colors">
                        <Edit2 size={24} className="text-white mb-1" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Change</span>
                        <input
                            id="profile-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                )}
            </div>

            {/* Edit/Cancel Toggle Button */}
            {isCurrentUser && (<button 
                onClick={() => editing ? handleCancel() : setEditing(true)}
                className={`absolute -bottom-2 -right-2 p-2 rounded-full transition shadow-lg z-10 ${
                    editing ? 'bg-red-500 hover:bg-red-400' : 'bg-emerald-500 hover:bg-emerald-400'
                }`}
            >
                {editing ? (
                    <span className="text-white font-bold px-1 text-xs">✕</span>
                ) : (
                    <Edit2 size={14} className="text-black" />
                )}
            </button> )}
        </div>

            <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div>
                <h1 className="text-4xl font-black tracking-tight">{profileuser.name}</h1>
                <p className="text-light-3 text-sm">@{profileuser.username}</p>
                </div>
                
                <div className="flex gap-2 justify-center">
                {isCurrentUser ? (
                    <>
                        <button 
                            onClick={() => editing ? handleSave() : setEditing(true)}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${
                                editing ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-gray-800 hover:bg-gray-700'
                            }`}
                        >
                            {editing ? "Save Changes" : "Edit Profile"}
                        </button>
                        
                        {editing && (
                            <button 
                                onClick={handleCancel}
                                className="px-4 py-1.5 bg-gray-800 hover:bg-red-500/20 hover:text-red-500 rounded-md text-sm font-bold transition border border-transparent hover:border-red-500/50"
                            >
                                Cancel
                            </button>
                        )}
                        {!editing && <NotificationDropdown userId={profileuser.accountId} />}
                        {!editing && (
                            <Link 
                                to="/settings"
                                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-md transition text-gray-400 hover:text-white"
                            >
                                <Settings size={18} />
                            </Link>
                        )}
                    </>
                ) : (
                    <button 
                    onClick={handleFollowToggle}
                    className={`px-6 py-1.5 rounded-md text-sm font-bold transition ${isFollowing ? 'bg-gray-800 text-white' : 'bg-emerald-500 text-black hover:bg-emerald-400'}`}
                    >
                    {isFollowing ? "Following" : "Follow"}
                    </button>
                )}
                </div>
            </div>
            
            {editing ? (
                <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full max-w-xl bg-gray-900 border border-gray-700 rounded p-2 text-sm text-gray-100 mb-4"
                placeholder="Write something about your music taste..."
                />
            ) : (
                <p className="text-gray-400 max-w-xl mb-6 leading-relaxed">
                {profileuser?.bio || "No bio yet."}
                </p>
            )}

            <div className="flex gap-8 justify-center md:justify-start border-t border-gray-800/50 pt-6">
                <StatItem label="Listens" value={listened.length} />
                <StatItem label="Reviews" value={reviews.length} />
                <div 
                    className="cursor-pointer hover:opacity-70" 
                    onClick={() => setShowFollowModal({ show: true, type: 'followers' })}
                >
                <StatItem label="Followers" value={profileuser.followersCount || 0} />
                </div>
                <div 
                    className="cursor-pointer hover:opacity-70" 
                    onClick={() => setShowFollowModal({ show: true, type: 'following' })}
                >
                    <StatItem label="Following" value={profileuser.followingCount || 0} />
                </div>
            </div>
            </div>
        </header>

        {/* --- JUKEBOXD FIVE SECTION --- */}
        <section className="mb-12">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-2">
                <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-gray-500">
                    Current Fav's{editing && <span className="text-emerald-500 normal-case ml-2">- Select up to 5 albums from your Listens below</span>}
                </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => {
                    const item = topFive[i];
                    const containerStyles = `relative aspect-square rounded-lg border-2 transition-all overflow-hidden ${
                        editing ? 'border-emerald-500/30 border-dashed' : 'border-gray-800'
                    }`;

                    const content = (
                        <>
                            {item ? (
                                <div key={i} >
                                    {item ? (
                                        <div className="relative h-full w-full group">
                                            <img src={item.album_cover_url} className="w-full h-full object-cover" alt={item.name} />
                                            
                                            <div className="absolute inset-x-0 bottom-0 bg-black/10 backdrop-blur-lg p-1.5 md:p-2">
                                                <p className="text-[10px] md:text-xs font-bold text-white truncate">{item.name}</p>
                                                <p className="text-[8px] md:text-[10px] text-gray-300 truncate">{item.artist_name || item.artist}</p>
                                            </div>

                                            {editing && (
                                                <button 
                                                    onClick={(e) => { e.preventDefault(); toggleTopFive(item); }}
                                                    className="absolute top-1 right-1 w-5 h-5 bg-red/50 rounded-full z-20 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform active:scale-90"
                                                >
                                                    <span className="text-[10px] font-bold text-white">✕</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-800">
                                            <Disc size={24} className="opacity-20" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-700">
                                    <Disc size={32} className="opacity-20" />
                                </div>
                            )}
                        </>
                    );

                    // Conditional Wrapper: Link if not editing and item exists, otherwise Div
                    return !editing && item ? (
                        <Link to={`/album/${item.id}`} key={i} className={containerStyles}>
                            {content}
                        </Link>
                    ) : (
                        <div key={i} className={containerStyles}>
                            {content}
                        </div>
                    );
                })}
            </div>
        </section>

        {/* --- MAIN CONTENT & SIDEBAR --- */}
            <div className="grid grid-cols-1 gap-12">
                <div className="lg:col-span-3">
                <nav className="flex gap-8 border-b border-gray-800 mb-6 overflow-scroll">
                    {TABS.map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {tab}
                    </button>
                    ))}
                </nav>

                <div className="space-y-6">
                    {activeTab === "Reviews" && (
                    loadingReviews ? <LoaderMusic /> : (reviews.length === 0? 
                    (<div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-dark-3 p-6 rounded-full mb-4">
                        <img src="/assets/icons/pen-nib.svg" className="w-10 h-10 opacity-20 invert" alt="No reviews" />
                    </div>
                    <p className="text-gray-400 font-medium">{isCurrentUser? "You haven't" : profileuser.username + " hasn't"} written any reviews yet.</p>
                    </div>):
                    (reviews.map((review) => (
                        <Link to={`/review/${review.reviewId}`} key={review.reviewId} className="flex gap-6 p-4 rounded-xl bg-gray-900/40 border border-gray-800/50 hover:bg-gray-700/60 transition group">
                        <Link to={review.type === "song" ? `/song/${review.id}` : `/album/${review.id}`}><img src={review.album_cover_url || ""} className="w-20 h-20 rounded shadow-lg object-cover" /></Link>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                            <Link to={review.type === "song" ? `/song/${review.id}` : `/album/${review.id}`} className="font-bold text-lg hover:text-emerald-400 transition">{review.name} • {review.type === "song"? "Song" : "Album"}</Link>
                            </div>
                            <p className="text-gray-300 text-sm mt-2 line-clamp-2">{review.text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {new Date(review.createdAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                })}
                            </p>
                        </div>
                        </Link>
                    ))))
                    )}

                    {activeTab === "Ratings" && (
                    loadingRatings ? <LoaderMusic /> : (ratings.length === 0? 
                    (<div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-dark-3 p-6 rounded-full mb-4">
                    <span className="text-4xl opacity-20">★</span>
                    </div>
                    <p className="text-gray-400 font-medium">{isCurrentUser? "You haven't" : profileuser.username + " hasn't"} rated anything yet.</p>
                    </div>) : (ratings.map((rating, idx) => (
                        <div
                            key={idx}
                            className="flex gap-6 p-4 rounded-xl bg-gray-900/40 border border-gray-800/50 hover:bg-gray-900/60 transition group"
                        >
                            {/* Album or song cover */}
                            <Link to={rating.type === "song" ? `/song/${rating.id}` : `/album/${rating.id}`}className="flex-shrink-0">
                            <img src={rating.album_cover_url || "/assets/icons/music-placeholder.png"} alt={rating.title} className="w-20 h-20 rounded shadow-lg object-cover"/>
                            </Link>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                <Link to={rating.type === "song" ? `/song/${rating.id}` : `/album/${rating.id}`} className="font-bold text-lg hover:text-emerald-400 transition">{rating.title} • {rating.type === "song"? "Song" : "Album"}</Link>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    {[...Array(5)].map((_, i) => {
                                        const starValue = i + 1;
                                        const fillLevel = rating.rating >= starValue 
                                            ? 1 
                                            : rating.rating >= starValue - 0.5 
                                                ? 0.5 
                                                : 0;

                                        return (
                                            <div key={i} className="w-4 h-4 md:w-5 md:h-5">
                                                <StarIcon fillLevel={fillLevel} sizeClass="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                        );
                                    })}
                                    {/* Optional: Add the numeric value next to stars like Letterboxd */}
                                    <span className="text-xs text-gray-500 ml-1 font-medium">
                                        {Number(rating.rating).toFixed(1)}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(rating.rating_date).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>
                    )))
                    ))}


                {activeTab === "Listens" && (
                loadingListens ? (
                    <LoaderMusic />
                ) : (listened.length === 0? 
                    (<div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-dark-3 p-6 rounded-full mb-4">
                        <img src="/assets/icons/headphones.svg" className="w-10 h-10 opacity-20 invert" alt="No listens" />
                    </div>
                    <p className="text-gray-400 font-medium">{isCurrentUser? "You haven't" : profileuser.username + " hasn't"} listened to anything yet.</p>
                    </div>) : (
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {listened.map((item, idx) => {
                        const isSelected = topFive.find((a) => a.id === item.id);
                        const isSong = item.type === 'song';
                        
                        // 1. Logic for Styles
                        const itemStyles = `relative group transition-all rounded-md overflow-hidden ${
                        editing 
                            ? isSong 
                            ? 'opacity-30 cursor-not-allowed'
                            : `cursor-pointer ${isSelected ? 'ring-4 ring-emerald-500 scale-[0.95]' : 'hover:scale-105 hover:ring-2 hover:ring-emerald-500/50'}` 
                            : 'hover:opacity-80'
                        }`;

                        const itemContent = (
                        <>
                            <div className={`relative aspect-square rounded-lg overflow-hidden border border-gray-800 
                            }`}>
                                <img 
                                    src={item.album_cover_url || "/assets/icons/music-placeholder.png"} 
                                    className="w-full h-full object-cover" 
                                />
                                {editing && isSelected && (
                                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                        <Star size={20} fill="#10b981" className="text-emerald-500" />
                                    </div>
                                )}
                                {editing && !isSong && !isSelected && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Star size={20} className="text-white/70" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col leading-tight">
                                <p className="text-[10px] md:text-xs font-bold text-gray-100 truncate">
                                    {item.name} • {isSong? "Song" : "Album"}
                                </p>
                            </div>
                            
                        </>
                        );

                        // 2. Logic for Rendering (Link vs Div)
                        return !editing ? (
                        <Link 
                            key={idx} 
                            to={isSong ? `/song/${item.id}` : `/album/${item.id}`} 
                            className={itemStyles}
                        >
                            {itemContent}
                        </Link>
                        ) : (
                        <div 
                            key={idx} 
                            onClick={() => !isSong && toggleTopFive(item)} 
                            className={itemStyles}
                        >
                            {itemContent}
                        </div>
                        );
                    })}
                    </div>
                )
                ))}

                {activeTab === "Playlists" && (
                loadingListens ? (
                    <LoaderMusic />
                ) : (playlists.length === 0? 
                    (<div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-dark-3 p-6 rounded-full mb-4">
                        <img src="/assets/icons/music.svg" className="w-10 h-10 opacity-20 grayscale" alt="No listens" />
                    </div>
                    <p className="text-gray-400 font-medium">{isCurrentUser? "You haven't" : profileuser.username + " hasn't"} made any playlists yet.</p>
                    {isCurrentUser && <Link to={`/create-playlist`}>Create one now</Link>}
                    </div>) : (
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {playlists.map((item) => {
                        return(<Link
                            key={item.playlistId}
                            to={`/playlist/${item.playlistId}`}
                            className="flex flex-col gap-3 group"
                            >
                            <div className="relative overflow-hidden rounded-2xl aspect-square bg-gray-800">
                                {item.coverUrl ? (
                                <img
                                    src={item.coverUrl}
                                    className="w-full h-full object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
                                />
                                ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-20">
                                    <Music size={48} />
                                </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                            </div>
                            <div>
                                <p className="text-white text-sm font-semibold truncate group-hover:text-emerald-400 transition-colors">
                                {item.name}
                                </p>
                                <span className="text-sm text-gray-400 ">
                                    {item.albumCount > 0 ? (
                                        <>
                                            {item.albumCount} {item.albumCount === 1 ? 'album' : 'albums'}, {item.totalTracks} tracks
                                        </>
                                    ) : (
                                        <>
                                            {item.totalTracks} {item.totalTracks === 1 ? 'track' : 'tracks'}
                                        </>
                                    )}
                                </span>
                            </div>
                            </Link>)
                    })}
                    </div>
                )
                ))}
                </div>
            </div>

            {/* Sidebar */}
            {/* <aside className="space-y-8">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/20 to-gray-900 border border-emerald-500/20">
                <h3 className="text-xs uppercase tracking-widest font-bold text-emerald-400 mb-2">Community Status</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                Member since {new Date(profileuser.createdAt || Date.now()).getFullYear()}. 
                Active contributor in the <span className="text-white">Music Discovery</span> community.
                </p>
            </div>
            </aside> */}
        </div>
        {showFollowModal.show && (
            <div className="fixed inset-0 bottom-10 md:bottom-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border  border-gray-800 w-full max-w-md rounded-2xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-bold capitalize">{showFollowModal.type}</h3>
                <button onClick={() => setShowFollowModal({ ...showFollowModal, show: false })}>✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                {loadingList ? (
                    <LoaderMusic />
                ) : list.length === 0 ? (
                    <p className="text-gray-500 italic">No {showFollowModal.type} found.</p>
                ) : (
                    <div className="space-y-2">
                    {list.map((item) => (
                        <Link to={`/profile/${item.accountId}`} key={item.accountId} onClick={() => setShowFollowModal({ ...showFollowModal, show: false })} className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg">
                        <img
                            src={item.imageUrl || "/assets/icons/profile-placeholder.svg"}
                            alt={item.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== window.location.origin + "/assets/icons/profile-placeholder.svg") {
                                target.src = "/assets/icons/profile-placeholder.svg";
                            }
                            }}
                        />
                        <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.username}</p>
                        </div>
                        </Link>
                    ))}
                    </div>
                )}
                </div>
            </div>
            </div>
        )}
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
    );
};

const StatItem = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex flex-col items-center md:items-start">
        <span className="text-xl font-black text-white">{value}</span>
        <span className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold">{label}</span>
    </div>
);


const NewProfile = () => {
    const { user } = useUserContext();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState("Listens");
    const [listened, setListened] = useState<Listened[]>([]);
    const [reviewed, setReviewed] = useState<Review[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingListens, setLoadingListens] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [loadingRatings, setLoadingRatings] = useState(false);
    const [rated, setRated] = useState<RatingGeneral[]>([]);
    const [profileUser, setProfileUser] = useState<IUser | null>(null);
    const [following, setFollowing] = useState<boolean>(false);
    const isCurrentUser = user?.accountId === id;

    useEffect(() => {
        const fetchProfileUser = async () => {
        setLoading(true);

        if (isCurrentUser) {
            // Refresh your own user from the server
            const updatedUser = await getUserById(user.accountId);
            setProfileUser(updatedUser);
        } else if (id) {
            const otherUser = await getUserById(id);
            const following = await checkIfFollowing(id, user.accountId);
            setProfileUser(otherUser);
            setFollowing(following);
        }

        setLoading(false);
        };

        fetchProfileUser();
    }, [id, user, isCurrentUser]);


    useEffect(() => {
        if (!profileUser?.accountId) return;

        const fetchAllData = async () => {
        setLoadingListens(true);
        setLoadingReviews(true);
        setLoadingRatings(true);

        const [newListens, newReviews, newRatings, newPlaylists] = await Promise.all([
            getListened(profileUser.accountId),
            getReviewed(profileUser.accountId),
            getRated(profileUser.accountId), 
            getPlaylists(profileUser.accountId)
        ]);

        setListened(newListens);
        setReviewed(newReviews);
        setRated(newRatings);
        setPlaylists(newPlaylists);

        setLoadingListens(false);
        setLoadingReviews(false);
        setLoadingRatings(false);
        };

        fetchAllData();
    }, [profileUser])


    if (loading || !profileUser) {
        return <div className="common-container"><LoaderMusic /></div>;
    }


    return (
        <div className="user-container flex">
        <ProfileComponent userid={user.accountId} profileuser={profileUser} setProfileUser={setProfileUser} activeTab={activeTab} setActiveTab={setActiveTab} isCurrentUser={isCurrentUser} reviews={reviewed} ratings={rated} listened={listened} playlists={playlists} loadingListens={loadingListens} loadingReviews={loadingReviews} loadingRatings={loadingRatings} following={following} />
        </div>
    );
};

export default NewProfile;