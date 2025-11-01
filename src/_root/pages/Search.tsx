import LoaderMusic from "@/components/shared/loaderMusic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchUsers } from "@/lib/appwrite/api";
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

const States = [
  "All",
  "Songs",
  "Albums",
  "Artists",
  "Users"
]



const Search = () => {
  const [songs, setSongs] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [all, setAll] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [state, setState] = useState<"All" | "Songs" | "Albums" | "Artists" | "Users">("All");

  const handleSearch = async (): Promise<void> => {
    setSongs([]);
    setAlbums([]);
    setArtists([]);
    setAll([]);
    setUsers([]);
    setLoading(true);

    const spotifyToken: string = await getSpotifyToken();
    const spotifyResults = await searchSpotify(searchQuery, spotifyToken);

    const userResults = await searchUsers(searchQuery);

    const allResults = [
      ...userResults.map(user => ({
        type: "user",
        id: user.id,
        name: user.username,
        image_url: user.avatar_url,
      })),
      ...spotifyResults.sorted,
    ];

    setAll(allResults);
    setSongs(spotifyResults.unsorted.filter((item: any) => item.type === "track"));
    setAlbums(spotifyResults.unsorted.filter((item: any) => item.type === "album"));
    setArtists(spotifyResults.unsorted.filter((item: any) => item.type === "artist"));
    setUsers(userResults);
    setLoading(false);
  };

  const handleTrendingClick = async (query: string) => {
    setSearchQuery(query);
    setLoading(true);

    const spotifyToken: string = await getSpotifyToken();
    const spotifyResults = await searchSpotify(query, spotifyToken);
    console.log(spotifyResults);

    setAll(spotifyResults.sorted);
    setSongs(spotifyResults.unsorted.filter((item: any) => item.type === "track"));
    setAlbums(spotifyResults.unsorted.filter((item: any) => item.type === "album"));
    setArtists(spotifyResults.unsorted.filter((item: any) => item.type === "artist"));

    setLoading(false);
  };

  return (
    <div className="common-container">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-2 text-center">Search</h1>
          <p className="text-gray-400 mb-6 text-center">
            Find your favorite songs, artists, and albums powered by Spotify as well as Jukebox Users.
          </p>

          {/* Search Bar */}
          <div className="flex items-center w-full mb-4">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="shad-input flex-1"
              placeholder="Search for a user, song, artist, or album..."
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

        {/* Results widescreen*/}
        <div className=" mt-8 flex-col gap-6 hidden xl:flex">
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

          {/* Users Row */}
          {users.length === 0 && all.length > 0 &&(
            <section>
              <h2 className="text-xl font-bold text-white mb-2">Users</h2>
              <p className="text-gray-400 text-center">No users found.</p>
            </section>
          )}
          {users.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-2">Users</h2>
              <div className=" overflow-x-auto">
                <div className="flex gap-4">
                  {users.map((user) => (
                    <Link key={user.id} to={`/profile/${user.id}`} className="flex-none w-36">
                      <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-32 h-32 object-cover rounded-full"
                        />
                        <p className="text-white text-sm text-center">{user.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

        </div>

        {/* smaller screens */}
        <div className=" mt-8 flex flex-col gap-6 xl:hidden justify-center items-center ">

          {/* Type Selection Tokens */}
          {all.length > 0 && (
            <div className="w-full flex justify-center my-4">
              <div className="flex flex-wrap justify-center gap-3">
                {States.map((s) => (
                  <button
                    key={s}
                    onClick={() => setState(s as any)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${state === s
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}




          {all.length > 0 && state == "All" && (
            <div className="grid gap-4  grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-4">
              {all.map((item) => {
                if (item.type === "user") {
                  return (
                    <Link key={item.id} to={`/profile/${item.id}`} className="flex-none w-36">
                      <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                        <img src={item.image_url} alt={item.name} className="w-32 h-32 object-cover rounded-full" />
                        <p className="text-white text-sm text-center">{item.name}</p>
                      </div>
                    </Link>
                  );
                }
                else if (item.type === "artist") {
                  return (<Link key={item.id} to={`/artist/${item.id}`} className="flex-none w-36">
                    <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-32 h-32 object-cover rounded-full"
                      />
                      <p className="text-white text-sm text-center">{item.name}</p>
                    </div>
                  </Link>)
                } else if (item.type === "track") {
                  return (<Link key={item.id} to={`/song/${item.id}`} className="flex-none w-36">
                    <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                      <img
                        src={item.album_cover_url}
                        alt={item.title}
                        className="w-32 h-32 object-cover rounded"
                      />
                      <p className="text-white text-sm text-center">{item.title}</p>
                      <p className="text-gray-400 text-xs text-center">
                        {item.artists?.map((a: any) => a.name).join(", ")}
                      </p>
                    </div>
                  </Link>
                  )
                } else {
                  return (<Link key={item.id} to={`/album/${item.id}`} className="flex-none w-36">
                    <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                      <img
                        src={item.album_cover_url}
                        alt={item.title}
                        className="w-32 h-32 object-cover rounded"
                      />
                      <p className="text-white text-sm text-center">{item.title}</p>
                      <p className="text-gray-400 text-xs text-center">
                        {item.artists?.map((a: any) => a.name).join(", ")}
                      </p>
                    </div>
                  </Link>)
                }

              })}

            </div>
          )}
          {all.length > 0 && state === "Songs" && (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
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
          )}
          {all.length > 0 && state === "Albums" && (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
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
          )}
          {all.length > 0 && state === "Artists" && (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
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
          )}
          {state === "Users" && users.length === 0 && (
            <p className="text-gray-400 text-center">No users found.</p>
          )}
          {state === "Users" && users.length > 0 && (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {users.map((user) => (
                <Link key={user.id} to={`/profile/${user.id}`} className="flex-none w-36">
                  <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-32 h-32 object-cover rounded-full"
                    />
                    <p className="text-white text-sm text-center">{user.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loader */}
      {loading ? <LoaderMusic /> : ""}
    </div>
  );
};

export default Search;
