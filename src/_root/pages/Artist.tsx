import { useEffect, useState } from 'react'
import { addUpdateArtist, getArtistDetailsById } from '@/lib/appwrite/api';
import { ArtistDetails } from '@/types';
import { Link, useParams } from 'react-router-dom';
import { getSpotifyToken, SpotifyArtistById } from '@/lib/appwrite/spotify';
import LoaderMusic from '@/components/shared/loaderMusic';

const Artist = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);


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
      setLoading(false);
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
      {loading && <LoaderMusic/> }
      {notFound && <h1 className='text-2xl text-gray-300'>Arist not found</h1>}
      {artist &&
        (
          <div className="max-w-7xl w-full mx-auto">
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

            <section className="relative bg-black px-4 py-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">Albums</h2>
              <div className="flex gap-4">
                {artist.albums.map(album => (
                  <Link key={album.albumId} to={`/album/${album.albumId}`} className="flex-none w-36">
                    <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                      <img
                        src={album.album_cover_url}
                        alt={album.title}
                        className="w-32 h-32 object-cover rounded"
                      />
                      <p className="text-white text-sm text-center">{album.title}</p>
                    </div>
                  </Link>))}
              </div>
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