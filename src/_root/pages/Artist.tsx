import React, { useEffect, useState } from 'react'
import { addUpdateArtist, getArtistDetailsById } from '@/lib/appwrite/api';
import { ArtistDetails } from '@/types';
import { Link, useParams } from 'react-router-dom';
import { getSpotifyToken, SpotifyArtistById } from '@/lib/appwrite/spotify';

const Artist = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);


  const addArtist = async () => {
    try {
      const spotifyToken: string = await getSpotifyToken();
      const spotifyArtist = await SpotifyArtistById(id || "", spotifyToken);
      if (!spotifyArtist) {
        return;
      }

      await addUpdateArtist(spotifyArtist);
      const fetchedArtist = await getArtistDetailsById(id || "");
      setArtist(fetchedArtist);
    }
    catch (error) {
      setNotFound(true);
    }
  }


  const fetchArtist = async () => {
    try {
      const fetchedArtist = await getArtistDetailsById(id || "");
      if (!fetchedArtist) {
        await addArtist(); // Only call getSong if the song is not in the database
      } else {
        setArtist(fetchedArtist);
      }
    } catch (error) {
      console.error("Error fetching song or reviews:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchArtist();
    }

  }, [id]);

  return (
    <div className="common-container">
      {artist &&
        (
          <div className="max-w-6xl w-full mx-auto">
            {/* Hero background */}
            <div className="sticky top-0 h-[50vh] z-0">
              <div className="relative w-full h-full">
                <img
                  src={artist.image_url}
                  alt={artist.name}
                  className="absolute inset-0 w-full h-full object-cover object-top rounded-md brightness-110 "
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              </div>
            </div>

            {/* Sticky artist name */}
            <div className="sticky top-0 -mt-36 z-20 ">
              <h1 className="  text-4xl md:text-5xl xl:text-8xl font-black text-white px-4 py-3">
                {artist.name}
              </h1>
            </div>

            <section className="relative h-96 bg-black px-4 py-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">Albums</h2>     
            </section>

            {/* Sections */}
            <section className="relative h-96 bg-black px-4 py-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">Top Reviews</h2>
              {/* <ul>
                {artist.topSongs.map((s) => (
                  <li key={s.songId} className=''>{s.title}</li>))}
              </ul> */}
            </section>

            <section className="relative h-96 bg-black px-4 py-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">Similar Artists</h2>
            </section>
          </div>)}
    </div>
  )
}

export default Artist