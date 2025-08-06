import LoaderMusic from "@/components/shared/loaderMusic";
import { getLastWeekPopularSongs } from "@/lib/appwrite/api";
import { Song } from "@/types";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, EffectCoverflow, Mousewheel } from 'swiper/modules';

import 'swiper/css';
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "./css/SongCarousel.css";
import { Link } from "react-router-dom";

const Home = () => {
  const [popularSongs, setPopularSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  

  
  useEffect(() => {
    const fetchTopTracks = async () => {
      try { 
        const topSongs = await getLastWeekPopularSongs();
        setPopularSongs(topSongs.splice(0,9));
      }
      catch(error) {
        console.log(error);
      }
      setLoading(false);
    }
    fetchTopTracks();
  }, []);


  return (
    <div className="song-container">
      <h1 className="text-4xl font-bold">Home</h1>
      <div className="w-full flex items-center justify-between border-b-2 -m-5 border-gray-500">
        <h2 className="text-2xl">Top Songs</h2>
        <Link to='/toptracks' className="text-md text-gray-400 hover:text-gray-200">See more</Link>
      </div>
      {loading?(<LoaderMusic />): (
        <div className="jukebox-carousel">
        <Swiper
          modules={[EffectCoverflow, Pagination, Mousewheel]}
          effect="coverflow"
          grabCursor={true}
          loop={true}
          centeredSlides={true}
          slidesPerView="auto"
          coverflowEffect={{
            rotate: 30,
            stretch: -20,
            depth: 100,
            modifier: 1,
            slideShadows: false, // Cleaner modern look without shadows
          }}
          mousewheel={{
            forceToAxis: true,
            sensitivity: 2,  
          }}
          pagination={{ clickable: true }}
          className="swiper-container"
        >
          {popularSongs.map((song) => (
            <SwiperSlide key={song.songId}>
              <Link key={song.songId} to={`/song/${song.songId}`}>
                <div className="song-card">
                  <img
                    src={song.album_cover_url}
                    alt={song.title}
                    className="album-cover"
                  />
                  
                  <h3 className="song-title">{song.title}</h3>
                  
                </div>
              </Link>
              
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      )}




      <div className="w-full flex items-center justify-between border-b-2 border-gray-500">
        <h2 className="text-2xl">Popular Reviews</h2>
        <h2 className="text-md text-gray-400">See more</h2>
      </div>
        <p className="text-gray-500 text-lg">Coming soon</p>


      <div className="w-full flex items-center justify-between border-b-2 border-gray-500">
        <h2 className="text-2xl">Recent Activity</h2>
        <h2 className="text-md text-gray-400">See more</h2>
      </div>
        <p className="text-gray-500 text-lg">Coming soon</p>



    </div>
  )
}

export default Home