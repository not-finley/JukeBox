import { Song } from "@/types";
import { Link, useParams } from "react-router-dom"
import { getSongById } from "@/lib/appwrite/api";
import { useEffect, useState } from "react";
import Loader from "@/components/shared/loader";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUserContext } from "@/context/AuthContext";

const SongDetails = () => {
  const { id } = useParams();
  const [song, setSong] = useState<Song | null>(null);
  const { user } = useUserContext();

  useEffect(() => {
    const fetchSong = async () => {
      const fetchedSong = await getSongById(id || "");
      setSong(fetchedSong); // fetchedSong can be null, so it stays consistent
    };

    fetchSong();
  }, [id]);

  if (!song) {
    return (
      <div className="common-container">
        <Loader />
      </div>
    )
  }

  var listened = true;

  return (
    <div className="common-container">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row">
        {/* Left Section: Album Cover */}
        <div className="lg:w-1/3 flex-shrink-0 mb-8 lg:mb-0">
          <img
            src={song.album_cover_url}
            alt="Album Cover"
            className="rounded-lg shadow-lg"
          />
          <div className="flex gap-2 mt-2">
            <Button className="shad-button_primary w-1/2"> 
              <div className="flex-col flex-center">
                <img
                  width={25}
                  src={listened? '/assets/icons/headphones-filled.svg' : '/assets/icons/headphones.svg'}
                />
                <p className="tiny-medium text-black">{listened? 'remove' : 'Listened'}</p> 
              </div>
            </Button>
          
            <Link className={`${buttonVariants({ variant: "default" })} shad-button_primary w-1/2`}
              to={`/song/${song.songId}/add-review`}
              key="add-review" 
            >
              <div className="flex-col flex-center">
                <img
                  width={25}
                  src='/assets/icons/pen-nib.svg'
                />
                <p className="tiny-medium text-black">Review</p> 
              </div>
            </Link>
         
          </div>
        </div>

        {/* Right Section: Details */}
        <div className="lg:w-2/3 lg:ml-8">
          <h1 className="lg:text-4xl md:text-2xl sm:text-3xl xs:text-2xl mb-4"><p className="font-bold">{song.title}</p> {song.album}</h1> 
          <p className="text-lg text-gray-400 mb-4">
            <span>{song.release_date.slice(0,4)}</span> | By <span className="text-white"></span>
          </p>

          {/* Ratings */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-emerald-500 text-xl font-semibold">3.1</span>
              <div className="h-5 w-32 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: "30%" }}></div>
              </div>
              <span className="text-gray-400 text-sm">(none)</span>
            </div>
          </div>
    
          {/* Where to Listen*/}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Where to Listen</h2>
            <div className="space-y-2">
              <Button className="shad-button_primary">
                <a href={song.spotify_url} target="_blank" className="text-black">Spotify</a>
              </Button>
            </div>
          </div>

          {/* Reviews */}
          <div>
            <div className="flex space-x-4 border-b border-gray-700 pb-2 mb-4">
              Popular reviews
            </div>
              <div className="review-container">
                <img
                  src={user.imageUrl}
                  className="h-10 w-10 rounded-full mr-5"
                />
                <div>
                  <p>Reviwed by  <Link to="/" className="underline">User</Link></p>
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt molestie lorem ac pharetra. Nulla lectus mauris, cursus eu lacus.</p>
                </div>
              </div>
            <div className="flex space-x-4 border-b border-gray-700 pb-2 mb-4">
              Recent Reviews
            </div>
            <div className="review-container">
                <img
                  src={user.imageUrl}
                  className="h-10 w-10 rounded-full mr-5"
                />
                <div>
                  <p>Reviwed by  <Link to="/" className="underline">User</Link></p>
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt molestie lorem ac pharetra. Nulla lectus mauris, cursus eu lacus.</p>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SongDetails