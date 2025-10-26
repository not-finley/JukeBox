import LoaderMusic from "@/components/shared/loaderMusic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSpotifyToken, searchSpotify } from "@/lib/appwrite/spotify";
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
  const [songs, setSongs] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = async (): Promise<void> => {
    setSongs([]);
    setAlbums([]);
    setArtists([]);
    setLoading(true);

    const spotifyToken: string = await getSpotifyToken();
    const spotifyResults = await searchSpotify(searchQuery, spotifyToken);

    // Separate by type
    setSongs(spotifyResults.filter((item: any) => item.type === "track"));
    setAlbums(spotifyResults.filter((item: any) => item.type === "album"));
    setArtists(spotifyResults.filter((item: any) => item.type === "artist"));

    setLoading(false);
  };

  const handleTrendingClick = async (query: string) => {
    setSearchQuery(query);
    setLoading(true);

    const spotifyToken: string = await getSpotifyToken();
    const spotifyResults = await searchSpotify(query, spotifyToken);

    setSongs(spotifyResults.filter((item: any) => item.type === "track"));
    setAlbums(spotifyResults.filter((item: any) => item.type === "album"));
    setArtists(spotifyResults.filter((item: any) => item.type === "artist"));

    setLoading(false);
  };

  return (
    <div className="common-container">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-2 text-center">Search for Music</h1>
          <p className="text-gray-400 mb-6 text-center">
            Find your favorite songs, artists, and albums powered by Spotify.
          </p>

          {/* Search Bar */}
          <div className="flex items-center w-full mb-4">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="shad-input flex-1"
              placeholder="Search for a song, artist, or album..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="shad-button_primary m-2 h-5/6"
            >
              Search
            </Button>
          </div>

          {/* Empty / Trending */}
          {songs.length === 0 &&
            albums.length === 0 &&
            artists.length === 0 &&
            !loading && (
              <div className="flex flex-col items-center mt-10">
                <img
                  src="/assets/icons/search.svg"
                  alt="Search Icon"
                  className="w-16 h-16 mb-4"
                />
                <p className="text-lg text-gray-400 mb-2">
                  Start typing to search for music
                </p>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2 text-center">
                    Trending searches:
                  </p>
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

        {/* Results */}
        <div className=" mt-8 flex flex-col gap-6">
          {/* Songs Row */}
          {songs.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-2">Songs</h2>
              <div className="overflow-x-auto">
                <div className="flex gap-4">
                  {songs.map((song) => (
                    <Link key={song.id} to={`/song/${song.id}`} className="flex-none w-36">
                      <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                        <img
                          src={song.album_cover_url}
                          alt={song.title}
                          className="w-32 h-32 object-cover rounded"
                        />
                        <p className="text-white text-sm text-center">{song.title}</p>
                        <p className="text-gray-400 text-xs text-center">
                          {song.artists?.map((a: any) => a.name).join(", ")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Albums Row */}
          {albums.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-2">Albums</h2>
              <div className="overflow-x-auto">
                <div className="flex gap-4">
                  {albums.map((album) => (
                    <Link key={album.id} to={`/album/${album.id}`} className="flex-none w-36">
                      <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                        <img
                          src={album.album_cover_url}
                          alt={album.title}
                          className="w-32 h-32 object-cover rounded"
                        />
                        <p className="text-white text-sm text-center">{album.title}</p>
                        <p className="text-gray-400 text-xs text-center">
                          {album.artists?.map((a: any) => a.name).join(", ")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Artists Row */}
          {artists.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-2">Artists</h2>
              <div className=" overflow-x-auto">
                <div className="flex gap-4">
                  {artists.map((artist) => (
                    <Link key={artist.id} to={`/artist/${artist.id}`} className="flex-none w-36">
                      <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                        <img
                          src={artist.image_url}
                          alt={artist.name}
                          className="w-32 h-32 object-cover rounded-full"
                        />
                        <p className="text-white text-sm text-center">{artist.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Loader */}
      {loading ? <LoaderMusic /> : ""}
    </div>
  );
};

export default Search;
