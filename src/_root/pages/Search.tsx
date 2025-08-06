import LoaderMusic from "@/components/shared/loaderMusic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSpotifyToken, searchSongsInSpotify } from "@/lib/appwrite/spotify";
import { Song } from "@/types";
import { useState } from "react";
import { Link } from "react-router-dom";


const trending = [
  "Taylor Swift",
  "Drake",
  "Billie Eilish",
  "Olivia Rodrigo",
  "The Weeknd",
  "SZA",
];

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

  const handleTrendingClick = async (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    const spotifyToken: string = await getSpotifyToken();
    const spotifySongs = await searchSongsInSpotify(searchQuery, spotifyToken);
    setResult(spotifySongs);
    setLoading(false);

  };

  return (
    <div className="song-container">
      <div className="w-full max-w-xl flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-2 text-center">Search for Music</h1>
        <p className="text-gray-400 mb-6 text-center">Find your favorite songs, artists, and albums powered by Spotify.</p>
        <div className="flex items-center w-full mb-4">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="shad-input flex-1"
            placeholder="Search for a song..."
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          />
          <Button onClick={handleSearch} disabled={loading} className="shad-button_primary m-2 h-5/6">
            Search
          </Button>
        </div>
        {(!result || result.length === 0) && !loading && (
          <div className="flex flex-col items-center mt-10">
            <img src="/assets/icons/search.svg" alt="Search Icon" className="w-16 h-16 mb-4" />
            <p className="text-lg text-gray-400 mb-2">Start typing to search for music</p>
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2 text-center">Trending searches:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {trending.map((item) => (
                  <button
                    key={item}
                    className="px-3 py-1 rounded-full bg-gray-800 text-gray-200 text-xs hover:bg-indigo-600 transition"
                    onClick={() => handleTrendingClick(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="song-grid text-center">
        {result?.length === 0 ? (
          <></>
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
        
      </div>
      {loading ? (
          <LoaderMusic/>): 
          ("")
      }
    </div>
  );
};

export default Search;