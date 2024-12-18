import LoaderMusic from "@/components/shared/loaderMusic";
import { Button } from "@/components/ui/button";
import { fetchSongs } from "@/lib/appwrite/api";
import { Song } from "@/types";
import { useState, useEffect } from "react";

const Songs = () => {
  const [song, setSongs] = useState<Song[]>([]);
  const [page, setPage] = useState(1); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSongs = async () => {
      setLoading(true);
      const newSongs = await fetchSongs(page);
      setSongs((prevSongs: Song[]) => [...prevSongs, ...newSongs]);
      setLoading(false);
    };
    loadSongs();
  }, [page])



  const loadMore = () => {
    setPage((prevPage) => prevPage + 1)
  }
  
  return (
    <div className="song-container">
            <h1>Top Songs</h1>
            <div className="song-grid">
                {song.map((s) => (
                    <div className="song-card" key={s.songId}>
                        <img src={s.coverUrl} alt={s.title} className="song-image" />
                        <p className="song-title">{s.title} - {s.album}</p>
                    </div>
                ))}
            </div>

        <div className="mt-1, text-center">
          {loading ? (
            <LoaderMusic />): 
            (
            <Button className="shad-button_primary"onClick={loadMore}>
              Load More
            </Button>
          )}
        </div>
    </div>
  )
}

export default Songs