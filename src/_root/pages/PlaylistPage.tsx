import { useParams, Link, useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import { Play, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Trash2, Check, Loader2 } from "lucide-react";
import LoaderMusic from "@/components/shared/loaderMusic";
import PlayingVisualizer from "@/components/shared/PlayingVisualizer";
import { usePlayerContext } from "@/context/PlayerContext";
import { useUserContext } from "@/lib/AuthContext";
import { getPlaylistById, processPlaylistCover, updatePlaylistMetadata, addSongToPlaylist, updatePlaylistCover, addSongToDatabase, updateSongsOrder, deletePlaylist, removeSongFromPlaylist } from "@/lib/appwrite/api";
import { Search } from "lucide-react";
import { searchSongsInSpotify, getSpotifyToken, SpotifyTrackById } from "@/lib/appwrite/spotify";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { Track } from "@/types";
import { getDeezerPreview } from "@/lib/appwrite/deezer";
import AuthModal from "@/components/shared/AuthModal";

const PlaylistPage = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { playAlbum, currentTrack, isPlaying } = usePlayerContext();
    const { user, isAuthenticated } = useUserContext();
    const [playlist, setPlaylist] = useState<any>(null);

    // Edit States
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(playlist?.name || "");
    const [editDescription, setEditDescription] = useState(playlist?.description || "");

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [loading, setLoading] = useState(true);

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isAddingSongId, setIsAddingSongId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


    // Placeholder fetch - replace with your Supabase/Appwrite logic
    useEffect(() => {
        const fetchPlaylist = async () => {
            setLoading(true);
            console.log("Fetching playlist with ID:", id);
            const data = await getPlaylistById(id || "");
            console.log("Fetched playlist data:", data);
            setPlaylist(data);
            setLoading(false);
            setEditName(data?.name || "");
            setEditDescription(data?.description || "");
            setSearchResults([])
        };
        fetchPlaylist();
    }, [id]);

    useEffect(() => {
        if (searchQuery.trim().length === 0) {
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setIsSearching(true);
            try {
                const spotifyAccessToken = await getSpotifyToken();
                const results = await searchSongsInSpotify(searchQuery, spotifyAccessToken);
                setSearchResults(results || []);
            } catch (error) {
                console.error(error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const isCreator = playlist?.creators?.some((c: any) => c.accountId === user.accountId);

    const handleSave = async () => {
        if (!editName.trim() || !id) return;
        try {
            await updatePlaylistMetadata(id, { 
                name: editName, 
                description: editDescription 
            });
            
            setPlaylist((prev: any) => ({ ...prev, name: editName, description: editDescription }));
            setIsEditing(false);
            toast({ title: "Playlist updated!" });
        } catch (err) {
            toast({ title: "Error updating playlist", variant: "destructive" });
        }
    };

    const handleAddSong = async (song: any) => {
        if (!id) return;

        // 1. Client-side check: Is it already in the local list?
        const isDuplicate = playlist.songs.some((s: any) => s.songId === song.songId);
        if (isDuplicate) {
            toast({ title: "Song already in playlist", variant: "default" });
            return;
        }

        setIsAddingSongId(song.songId);

        try {
            const spotifyAccessToken = await getSpotifyToken();
            const enrichedSong = await SpotifyTrackById(song.songId, spotifyAccessToken);
            const songToAdd = enrichedSong || song;
            
            await addSongToDatabase(songToAdd);

            // 2. Capture the result of the link operation
            const response = await addSongToPlaylist(id, song.songId, playlist.songs.length);

            if (!response) {
                throw new Error("Duplicate or failed to add");
            }

            const preview_url = await getDeezerPreview(song.title, song.artist, song.isrc);

            

            const formattedSong = {
                ...song,
                artists: enrichedSong?.artists.map((a: any) => ({ name: a.name, artistId: a.id })) || song.artists.map((a: any) => ({ name: a.name, artistId: a.id })),
                preview_url: preview_url,
                album_cover_url: typeof song.album === 'object' ? song.album.album_cover_url : song.album_cover_url
            };

            console.log("Adding song to playlist with data:", formattedSong)
            // 3. Only update UI on verified success
            setPlaylist((prev: any) => ({
                ...prev,
                songs: [...(prev.songs || []), formattedSong]
            }));
            
            toast({ title: "Added to playlist!" });
        } catch (err: any) {
            console.error(err);

            const message = err.message?.includes("409") 
                ? "This song is already in the playlist." 
                : "Failed to add song";
                
            toast({ title: message, variant: "destructive" });
        } finally {
            setIsAddingSongId(null);
        }
    };

    const handleCoverUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;

        setLoading(true);
        try {
            const processedBlob = await processPlaylistCover(file);
            const processedFile = new File([processedBlob], "cover.webp", { type: "image/webp" });
            
            // Call an updatePlaylist function that handles file uploads (like your create logic)
            const result = await updatePlaylistCover(user.accountId, id, processedFile);
            setPlaylist((prev: any) => ({ ...prev, coverUrl: result }));
            
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination || !isCreator) return;

        const items = Array.from(playlist.songs);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setPlaylist({ ...playlist, songs: items });

        try {
            await updateSongsOrder(id!, items.map((s: any) => s.songId));
        } catch (err) {
            toast({ title: "Failed to save order", variant: "destructive" });
            setPlaylist((prev: any) => ({ ...prev, songs: playlist.songs }));
        }
    };

    const formatTrack = (track: any): Track => ({
        title: track.title,
        songId: track.songId,
        artist: track.artist,
        album_cover_url: track.album_cover_url,
        preview_url: track.preview_url,
        isrc: track.isrc
    });

    const handlePlayPlaylist = () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        if (!playlist) return;
        const formattedTracks = playlist.songs.map(formatTrack);
        playAlbum(formattedTracks);
    };

    const handleDeletePlaylist = async () => {
        if (!id) return;
        setIsDeleting(true);

        try {
            const success = await deletePlaylist(id);
            if (success) {
                toast({ title: "Playlist deleted successfully" });
                navigate("/library"); 
            } else {
                throw new Error("Delete failed");
            }
        } catch (error) {
            toast({ 
                title: "Failed to delete playlist", 
                variant: "destructive" 
            });
            setIsDeleting(false);
        }
    };

    const handleRemoveSong = async (songId: string) => {
        if (!id) return;
        try {
            await removeSongFromPlaylist(id, songId);
            
            // Update local state to remove the song immediately
            setPlaylist((prev: any) => ({
                ...prev,
                songs: prev.songs.filter((s: any) => s.songId !== songId)
            }));

            toast({ title: "Removed from playlist" });
        } catch (err) {
            toast({ title: "Failed to remove song", variant: "destructive" });
        }
    };
        
    if (loading) return <div className="common-container"><LoaderMusic /></div>;


    return (
    <div className="common-container">
        {loading && <LoaderMusic />}
        
        {playlist && !loading && (
            <div className="w-full max-w-6xl">
                {/* --- HEADER SECTION --- */}
                <div className="h-[40vh] relative w-full overflow-hidden rounded-b-3xl">
                    <img
                        src={playlist.coverUrl || '/assets/icons/music-placeholder.png'}
                        alt={playlist.name}
                        className="absolute inset-0 w-full h-full object-cover brightness-50 scale-110 blur-2xl"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-dark-1 via-dark-1/40 to-transparent"></div>
                    
                    <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row items-center md:items-end gap-6">
                        <input 
                            type="file" 
                            id="cover-upload" 
                            className="hidden" 
                            onChange={handleCoverUpdate} 
                            accept="image/*" 
                        />
                        <div className="group relative w-40 h-40 md:w-52 md:h-52 flex-shrink-0 shadow-2xl transition-transform hover:scale-[1.02]">
                            <img
                                src={playlist.coverUrl || '/assets/icons/music-placeholder.png'}
                                alt={playlist.name}
                                className="w-full h-full object-cover rounded-xl shadow-2xl border border-white/10"
                            />
                            {isCreator && (
                                <div
                                    onClick={() => document.getElementById('cover-upload')?.click()} 
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl cursor-pointer backdrop-blur-sm">
                                    <p className="text-white text-[10px] font-bold uppercase tracking-widest">Change Cover</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col text-center md:text-left flex-1 min-w-0">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                <h3 className="text-emerald-500 text-xs font-black uppercase tracking-[0.2em]">Playlist</h3>
                                {isCreator && !isEditing && (
                                    <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                                        <Edit2 size={14} />
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="flex flex-col gap-3 mt-1 max-w-xl">
                                    <Input 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="text-3xl md:text-5xl font-black bg-white/10 border-none h-auto py-1 focus-visible:ring-emerald-500"
                                    />
                                    <Textarea 
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="bg-white/10 border-none resize-none min-h-[60px] text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <Button onClick={handleSave} className="bg-emerald-500 text-black font-bold h-9 px-4 rounded-full"><Check size={16} className="mr-1" /> Save</Button>
                                        <Button onClick={() => setIsEditing(false)} variant="ghost" className="h-9 px-4 text-white">Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-normal pb-2 truncate">
                                        {playlist.name}
                                    </h1>
                                    <p className="text-gray-300 bg-transparent text-sm md:text-base mt-2 line-clamp-2 max-w-2xl font-medium opacity-80">
                                        {playlist.description || ""}
                                    </p>
                                </>
                            )}

                            <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                                <div className="flex -space-x-2">
                                    {playlist.creators.map((creator: any) => (
                                        <Link key={creator.accountId} to={`/profile/${creator.accountId}`}>
                                            <img src={creator.imageUrl} className="w-7 h-7 rounded-full border-2 border-dark-1" />
                                        </Link>
                                    ))}
                                </div>
                                <span className="text-sm font-bold text-white">{playlist.creators[0]?.name}</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-sm text-gray-400 font-semibold">{playlist.songs.length} songs</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ACTION BAR --- */}
                <div className="flex items-center gap-6 p-6 md:px-10">
                    <Button
                        onClick={() => handlePlayPlaylist()}
                        disabled={!playlist.songs.length}
                        className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_8px_15px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95"
                    >
                        <Play fill="black" size={24} />
                    </Button>
                    
                    {isCreator && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="text-gray-400 hover:text-red-500 rounded-full">
                                    <Trash2 size={24} />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-dark-2 border-white/10 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-bold">
                                        Delete "{playlist.name}"?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-400">
                                        This action cannot be undone. This will permanently delete your
                                        playlist and remove the cover image from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5">
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleDeletePlaylist}
                                        disabled={isDeleting}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        {isDeleting ? "Deleting..." : "Delete Playlist"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        )}
                </div>

                {/* --- SONG LIST --- */}
                <div className="px-6 md:px-10 max-w-7xl mx-auto w-full">
                    {playlist?.songs?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 border-t border-white/5">
                            <Music size={64} className="text-gray-700 mb-4" />
                            <p className="text-gray-400 text-lg">Your playlist is empty.</p>
                        </div>
                    ) : (
                        <>
                            {/* RESPONSIVE GRID: Album hidden on mobile */}
                            <div className="grid grid-cols-[16px_1fr] md:grid-cols-[110px_2.7fr_2.6fr] gap-4 py-2 px-4 border-b border-white/10 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                                <div>#</div>
                                <div>Title</div>
                                <div className="hidden md:block">Album</div>
                            </div>

                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="playlist-songs">
                                    {(provided) => (
                                        <div 
                                            {...provided.droppableProps} 
                                            ref={provided.innerRef} 
                                            className="flex flex-col mb-12"
                                        >
                                            {playlist?.songs?.map((song: any, index: number) => {
                                                const isCurrent = currentTrack?.songId === song.songId;
                                                const uniqueId = String(song.songId || song.song_id);

                                                return (
                                                    <Draggable 
                                                        key={uniqueId}
                                                        draggableId={uniqueId}
                                                        index={index}
                                                        isDragDisabled={!isCreator} // This prevents the actual drag logic
                                                    >
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...(!isCreator ? {} : {})}
                                                                className={`grid gap-4 py-2 px-4 rounded-md transition-all group items-center ${
                                                                    snapshot.isDragging ? "bg-white/20 shadow-2xl z-50" : "hover:bg-white/10"
                                                                } ${
                                                                    isCreator 
                                                                    ? "grid-cols-[auto_16px_1fr_auto] md:grid-cols-[auto_16px_4fr_3fr_auto]" 
                                                                    : "grid-cols-[16px_1fr] md:grid-cols-[16px_4fr_3fr]"
                                                                }`}
                                                            >
                                                                {/* 1. Conditional Drag Handle */}
                                                                {isCreator && (
                                                                    <div 
                                                                        {...provided.dragHandleProps} 
                                                                        className="text-gray-600 hover:text-white px-1 cursor-grab active:cursor-grabbing"
                                                                    >
                                                                        <GripVertical size={18} />
                                                                    </div>
                                                                )}

                                                                {/* 2. Track Number / Playing Visualizer */}
                                                                <div 
                                                                    className="text-gray-500 text-sm cursor-pointer" 
                                                                    onClick={() => {
                                                                        if (!isAuthenticated) {
                                                                            setShowAuthModal(true);
                                                                            return;
                                                                        }
                                                                        const formattedTracks = playlist.songs.map(formatTrack);
                                                                        playAlbum(formattedTracks, index); 
                                                                    }}
                                                                >
                                                                    {isCurrent && isPlaying ? <PlayingVisualizer isPaused={false} /> : index + 1}
                                                                </div>
                                                                
                                                                {/* 3. Title & Artist */}
                                                                <div 
                                                                    className="flex items-center gap-4 overflow-hidden cursor-pointer" 
                                                                >
                                                                    <img src={song.album_cover_url} className="w-10 h-10 rounded shadow-lg" />
                                                                    <div className="flex flex-col truncate">
                                                                        <Link to={'/song/' + song.songId} className={`text-sm font-semibold truncate ${isCurrent ? 'text-emerald-500' : 'text-white'} hover:text-emerald-400`}>
                                                                            {song.title}
                                                                        </Link>
                                                                        {song?.artists?.map((a: any, i : number) => (
                                                                            <Link to={`/artist/${a.artistId}`} key={a.id} className="hover:text-emerald-400 text-xs text-gray-500 font-semibold truncate">
                                                                                {a.name}
                                                                                {i < a.length - 1 ? ", " : ""}
                                                                            </Link>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* 4. Album (Hidden on mobile) */}
                                                                <div 
                                                                    className="hidden md:block text-sm text-gray-400 truncate pr-4 cursor-pointer" 
                                                                >
                                                                    <Link to={'/album/' + song.album_id}>{typeof song.album === 'object' ? song.album?.title : song.album || "Unknown Album"}</Link>
                                                                </div>
                                                                {isCreator && (
                                                                    <button
                                                                        onClick={() => handleRemoveSong(song.songId)}
                                                                        className="p-2 text-gray-500 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        aria-label="Remove song"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </>
                    )}
                </div>


                {/* --- SEARCH SECTION --- */}
                {isCreator && (
                <div className="mt-12 border-t border-white/5 pt-12 px-6 md:px-10 max-w-7xl mx-auto w-full">
                    <h2 className="text-2xl font-bold text-white mb-6">Let's find something for your playlist</h2>
                    
                    <div className="relative max-w-xl mb-10">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <Input 
                        placeholder="Search for songs or artists..."
                        className="bg-white/10 border-none pl-12 h-14 rounded-full text-lg focus:bg-white/20 transition-all focus-visible:ring-emerald-500/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    {isSearching ? (
                        <div className="col-span-full flex justify-center py-10"><LoaderMusic /></div>
                    ) : (
                        searchResults.map((result) => (
                        <div key={result.songId} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg group transition-all">
                            <div className="flex items-center gap-4">
                            <img src={result.album_cover_url} className="w-12 h-12 rounded-md shadow-md" />
                            <div className="flex flex-col">
                                <p className="text-sm font-bold text-white">{result.title}</p>
                                <p className="text-xs text-gray-400">{result.artist}</p>
                            </div>
                            </div>
                            <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isAddingSongId === result.songId}
                            className="rounded-full border-gray-600 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10 px-6"
                            onClick={() => handleAddSong(result)}
                            >
                            {isAddingSongId === result.songId ? <Loader2 className="animate-spin" /> : "Add"}
                            </Button>
                        </div>
                        ))
                    )}
                    </div>
                </div>
                )}
            </div>
        )}
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
);
};

export default PlaylistPage;