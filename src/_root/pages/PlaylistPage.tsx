import { getPlaylistById, updatePlaylist } from "@/lib/appwrite/api";
import { useUserContext } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Playlist } from "./Playlist";
import { toast } from "@/hooks/use-toast";
import { Playlist as PlaylistType } from "@/types";


const PlaylistPage = () => {
  const { id } = useParams();
  const { user, isLoading: userLoading } = useUserContext();

  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPlaylist = async () => {
      setLoading(true);
      const data = await getPlaylistById(id);
      setPlaylist(data);
      setLoading(false);
    };

    fetchPlaylist();
  }, [id]);

  const handleUpdate = async (updatedPlaylist: PlaylistType) => {
  try {
    // 1. (Optional) Show a toast to let the user know we're working on it
    // toast({ title: "Saving changes..." });

    // 2. Call the backend function we wrote earlier
    const result = await updatePlaylist(updatedPlaylist);

    if (result.success) {
      // 3. Update the local state so the UI stays in sync
      setPlaylist(updatedPlaylist);
      
      toast({
        title: "Playlist updated",
        description: "Your changes have been saved successfully.",
        variant: "default",
      });
    } else {
      throw new Error("Failed to save");
    }
  } catch (error) {
    // 4. Handle errors (very important for UX!)
    toast({
      title: "Error",
      description: "Could not save playlist. Please try again.",
      variant: "destructive",
    });
  }
};

  if (loading || userLoading) {
    return <div className="flex-center h-full text-white">Loading…</div>;
  }

  if (!playlist) {
    return <div className="text-center text-white mt-10">Playlist not found.</div>;
  }

  return (
    <Playlist 
      playlist={playlist} 
      currentUser={user} 
      onUpdate={handleUpdate} 
    />
  );
};

export default PlaylistPage;