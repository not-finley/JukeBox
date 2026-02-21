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
import PlaylistEntry from "@/components/PlaylistEntry";
import { usePlayerContext } from "@/context/PlayerContext";
import { useUserContext } from "@/lib/AuthContext";
import { getPlaylistById, processPlaylistCover, updatePlaylistMetadata, addItemToPlaylist, updatePlaylistCover, addSongToDatabase, updateItemsOrder, deletePlaylist, removeItemFromPlaylist, addAlbumComplex} from "@/lib/appwrite/api";
import { Search } from "lucide-react";
import { searchSpotify, getSpotifyToken, SpotifyTrackById } from "@/lib/appwrite/spotify";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Track } from "@/types";
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

    const fetchPlaylist = async (silent = false) => {
        if (!silent) setLoading(true); // Only show global loader on first load or ID change
        
        const data = await getPlaylistById(id || "");
        setPlaylist(data);
        
        if (!silent) setLoading(false);
        setEditName(data?.name || "");
        setEditDescription(data?.description || "");
    };


    useEffect(() => {
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
                const token = await getSpotifyToken();
                // Call your new function
                const { sorted } = await searchSpotify(searchQuery, token);
                
                // Filter out 'artist' results if you only want to add songs/albums to the playlist
                setSearchResults(sorted.filter(item => item.type !== 'artist'));
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
    const albumCount = playlist?.items?.filter((item: any) => item.type === 'album').length || 0;

    const totalTracks = playlist?.items?.reduce((acc: number, item: any) => {
        if (item.type === 'album') return acc + (item.tracks?.length || 0);
        return acc + 1;
    }, 0) || 0;

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

    const handleAddItem = async (searchResultItem: any) => {
        if (!id) return;

        // 1. Duplicate Check
        const isDuplicate = playlist.items.some((item: any) => 
            (item.type === 'song' && item.songId === searchResultItem.id) || (item.type === 'album' && item.albumId === searchResultItem.id)
        );
        
        if (isDuplicate) {
            toast({ title: `${searchResultItem.type === 'album' ? 'Album' : 'Song'} already in playlist` });
            return;
        }

        setIsAddingSongId(searchResultItem.id);

        try {
            const token = await getSpotifyToken();
            const type = searchResultItem.type === 'track' ? 'song' : 'album';

            // 2. Fetch Full Data & Save to Database
            if (type === 'album') {
                // Fetch full album to get the tracks list for addAlbumComplex
                const response = await fetch(`https://api.spotify.com/v1/albums/${searchResultItem.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fullAlbumData = await response.json();
                await addAlbumComplex(fullAlbumData);
            } else {
                // Fetch full track to get ISRC and detailed metadata for addSongToDatabase
                const fullTrackData = await SpotifyTrackById(searchResultItem.id, token);
                await addSongToDatabase(fullTrackData || searchResultItem);
            }

            // 3. Link to Playlist (Join Table)
            const response = await addItemToPlaylist(
                id, 
                searchResultItem.id, 
                type, 
                playlist.items.length
            );

            if (!response.success) throw new Error("Failed to link item");

            await fetchPlaylist(true); 
            
            toast({ title: `Added ${type} to playlist!` });
        } catch (err) {
            console.error("Error adding item:", err);
            toast({ title: "Failed to add item", variant: "destructive" });
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

        const items = Array.from(playlist.items);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setPlaylist({ ...playlist, items });

        try {
            // Send the new order using the unique playlist_item ID
            await updateItemsOrder(id!, items.map((item: any) => ({
                id: item.id,
                type: item.type,
                songId: item.songId,
                albumId: item.albumId
            })));
        } catch (err) {
            toast({ title: "Failed to save order", variant: "destructive" });
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

    const handlePlayPlaylist = (itemIndex?: number, trackIndexInAlbum?: number) => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        if (!playlist?.items) return;


        // Create a flat list of all tracks for the player
        const flatTracks: Track[] = [];
        let startIndex = 0;

        playlist.items.forEach((item: any, idx: number) => {
            if (item.type === 'album') {
                if (idx === itemIndex) startIndex = flatTracks.length + (trackIndexInAlbum || 0);
                flatTracks.push(...item.tracks.map(formatTrack));
            } else {
                if (idx === itemIndex) startIndex = flatTracks.length;
                flatTracks.push(formatTrack(item));
            }
        });
        console.log(flatTracks)
        playAlbum(flatTracks, startIndex);
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

    const handleRemoveSong = async (itemId: string) => {
        if (!id) return;
        try {
            await removeItemFromPlaylist(id, itemId);
            
            // Update local state to remove the song immediately
            setPlaylist((prev: any) => ({
                ...prev,
                items: prev.items.filter((s: any) => s.id !== itemId)
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
                <div className={`${isEditing? "h-[60vh]": "h-[50vh]"} md:h-[40vh] relative w-full overflow-hidden rounded-b-3xl`}>
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
                                <span className="text-sm text-gray-400 font-semibold">
                                    {albumCount > 0 ? (
                                        <>
                                            {albumCount} {albumCount === 1 ? 'album' : 'albums'}, {totalTracks} tracks
                                        </>
                                    ) : (
                                        <>
                                            {totalTracks} {totalTracks === 1 ? 'track' : 'tracks'}
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ACTION BAR --- */}
                <div className="flex items-center gap-6 p-6 md:px-10">
                    <Button
                        onClick={() => handlePlayPlaylist()}
                        disabled={!playlist.items.length}
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
                                <Droppable droppableId="playlist-items">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef}>
                                            {playlist?.items?.map((item: any, index: number) => (
                                                <Draggable key={String(item.id)} draggableId={String(item.id)} index={index} isDragDisabled={!isCreator}>
                                                    {(provided) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                            <PlaylistEntry 
                                                                item={item}
                                                                index={index}
                                                                isCreator={isCreator}
                                                                isCurrent={currentTrack?.songId === item.songId}
                                                                isPlaying={isPlaying}
                                                                onPlay={handlePlayPlaylist}
                                                                onRemove={handleRemoveSong}
                                                                formatTrack={formatTrack}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
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
                        placeholder="Search for songs, albums, or artists..."
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
                            <div key={result.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg group">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img src={result.album_cover_url} className="w-12 h-12 rounded-md shadow-md" />
                                        {result.type === 'album' && (
                                            <div className="absolute -top-2 -left-2 bg-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded text-black uppercase">
                                                Album
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-sm font-bold text-white">{result.title}</p>
                                        <p className="text-xs text-gray-400">
                                            {result.artists?.map((a: any) => a.name).join(", ")}
                                        </p>
                                    </div>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={isAddingSongId === result.id}
                                    onClick={() => handleAddItem(result)} // Use the new generic handler
                                >
                                    {isAddingSongId === result.id ? <Loader2 className="animate-spin" /> : "Add"}
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