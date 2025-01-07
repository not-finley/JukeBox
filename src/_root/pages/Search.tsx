import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSpotifyToken, searchSongsInSpotify } from "@/lib/appwrite/spotify";
import { Song } from "@/types";
import { useState } from "react";

const Search = () => {
  // const [query, setQuery] = useState<string>(""); // Query input state
  const [result, setResult] = useState<Song[]|null>(null); // Search result state
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  // const [error, setError] = useState<string>(""); // Error message state
  // const [searchQuery, setSearchQuery] = useState("");
  // const [suggestedTracks, setSuggestedTracks] = useState([]);

  // const handleSearch = async (): Promise<void> => {
  //   setLoading(true);
  //   setError("");
  //   setResult(null);

  //   try {
  //     // Step 1: Check the Appwrite database for the song
  //     const cachedSong: Song | null = await searchSongInDatabase(query);
  //     if (cachedSong) {
  //       setResult(cachedSong);
  //       setLoading(false);
  //       return;
  //     }

  //     // Step 2: Fetch from Spotify API if not found in the cache
  //     const spotifyToken: string = await getSpotifyToken();
  //     const spotifySong: Song | null = await searchSongInSpotify(query, spotifyToken);

  //     if (spotifySong) {
  //       // Step 3: Add the Spotify result to the Appwrite database
  //       const savedSong: Song = await addSongToDatabase(spotifySong);
  //       setResult(savedSong);
  //     } else {
  //       setError("Song not found on Spotify.");
  //     }
  //   } catch (e) {
  //     console.error(e);
  //     setError("An error occurred while searching for the song.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (): Promise<void> => {
    setLoading(true);
    const spotifyToken: string = await getSpotifyToken();
    const spotifySongs = await searchSongsInSpotify(searchQuery, spotifyToken);
    console.log(spotifySongs);
    setResult(spotifySongs);
    setLoading(false);
  }

  // return (
  //   <div className="search-page">
  //     <h1>Search for a Song</h1>
  //     <input
  //       type="text"
  //       value={query}
  //       onChange={(e) => setQuery(e.target.value)}
  //       placeholder="Enter song title"
  //       className="search-input text-black"
  //     />
  //     <button onClick={handleSearch} disabled={loading} className="search-button">
  //       {loading ? "Searching..." : "Search"}
  //     </button>
  //     {error && <p className="error-message">{error}</p>}
  //     {result && (
  //       <div className="song-result">
  //         <h2>{result.title}</h2>
  //         <p>Artist:</p>
  //         <img src={result.album_cover_url} alt="Album Cover" />
  //         <a href={result.spotify_url} target="_blank" rel="noopener noreferrer">
  //           Listen on Spotify
  //         </a>
  //       </div>
  //     )}
  //   </div>
  // );

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
        <Button onClick={handleSearch} disabled={loading} className="shad-button_primary m-2">
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>
      <div className="song-grid">
        {/* {suggestedTracks.length === 0 ? (
          <p>No results found. Try a different search!</p>
        ) : (
          suggestedTracks.map((track) => (
            <div key={track.songId} className="flex">
              <img src={track.album_cover_url} className="max-w-sm"/>
              <strong>{track.title}</strong> - {track.album}
            </div>
          ))
        )} */}
        {result?.length === 0 ? (
          <p></p>
        ) : (
          result?.map((track) => (
            <div className="song-card" key={track.songId}>
                <img src={track.album_cover_url} alt={track.title} className="song-image" />
                <p className="song-title">{track.title}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Search;