import LoaderMusic from "@/components/shared/loaderMusic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSpotifyToken, searchSongsInSpotify } from "@/lib/appwrite/spotify";
import { Song } from "@/types";
import { useState } from "react";
import { Link } from "react-router-dom";

const Search = () => {
  const [result, setResult] = useState<Song[]|null>(null); // Search result state
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (): Promise<void> => {
    setResult([]);
    setLoading(true);
    const spotifyToken: string = await getSpotifyToken();
    const spotifySongs = await searchSongsInSpotify(searchQuery, spotifyToken);
    setResult(spotifySongs);
    setLoading(false);
  }
  return (
    <div className="common-container">
      <div className="flex items-center">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="shad-input"
          placeholder="Search for a song..."
        />
        <Button onClick={handleSearch} disabled={loading} className="shad-button_primary m-2 h-5/6">
          Search
        </Button>
      </div>
      <div className="song-grid">
        {result?.length === 0 ? (
          <p></p>
        ) : (
          result?.map((track) => (
            <Link key={track.songId} to={`/song/${track.songId}`}>
              <div className="song-card" key={track.songId}>
                <img src={track.album_cover_url} alt={track.title} className="song-image" />
                <p className="song-title">{track.title}</p>
              </div>
            </Link>
          ))
        )}
        {loading ? (
          <LoaderMusic/>): 
          ("")
        }
      </div>
    </div>
  );
};

export default Search;