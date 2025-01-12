import LoaderMusic from "@/components/shared/loaderMusic";
import { getLastWeekPopularSongs } from "@/lib/appwrite/api";
import { Song } from "@/types";
import { useEffect, useState } from "react";

const Home = () => {
  const [popularSongs, setPopularSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  

  
  useEffect(() => {
    const fetchTopTracks = async () => {
      try { 
        const topSongs = await getLastWeekPopularSongs();
        setPopularSongs(topSongs.slice(0,4));
      }
      catch(error) {
        console.log(error);
      }
    }
    fetchTopTracks();
    setLoading(false);
  }, []);

  return (
    <div className="common-container">
      <h1 className="text-4xl font-bold">Home</h1>
      <div className="w-full flex items-center justify-between border-b-2 border-gray-300">
        <h2 className="text-2xl">Top Songs</h2>
        <h2 className="text-md text-gray-400">See more</h2>
      </div>
      {loading?(<LoaderMusic />): ''}
      <div className="flex">
      {popularSongs.map((song) => (
        <div key={song.songId} className="w-52 p-4 border rounded-lg text-center">
          <img
            src={song.album_cover_url}
            alt={`${song.title} Album Cover`}
            className="w-full rounded"
          />
          <h3 className="mt-4 font-semibold">{song.title}</h3>
        </div>
      ))}
      </div>
      <div className="w-full flex items-center justify-between border-b-2 border-gray-300">
        <h2 className="text-2xl">Popular Reviews</h2>
        <h2 className="text-md text-gray-400">See more</h2>
      </div>
    </div>
  )
}

export default Home