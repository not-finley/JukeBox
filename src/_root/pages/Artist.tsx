import { useEffect, useState, useRef } from 'react';
import { addUpdateArtist, getArtistDetailsById } from '@/lib/appwrite/api';
import { ArtistDetails } from '@/types';
import { Link, useParams } from 'react-router-dom';
import { getSpotifyToken, SpotifyArtistById } from '@/lib/appwrite/spotify';
import LoaderMusic from '@/components/shared/loaderMusic';
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const Artist = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [heroHeight, setHeroHeight] = useState(0);

  const { scrollY } = useScroll({ container: scrollContainerRef });

  // Update hero height
  useEffect(() => {
    if (heroRef.current) setHeroHeight(heroRef.current.offsetHeight);
  }, [artist]);

  // Listen to scroll
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > heroHeight * .25) setScrolled(true);
    else setScrolled(false);
  });

  // Fetch artist
  const addArtist = async () => {
    try {
      const token = await getSpotifyToken();
      const spotifyArtist = await SpotifyArtistById(id || "", token);
      if (!spotifyArtist) return;
      await addUpdateArtist(spotifyArtist);
      const fetchedArtist = await getArtistDetailsById(id || "");
      setArtist(fetchedArtist);
    } catch {
      setNotFound(true);
    }
  };

  const fetchArtist = async () => {
    try {
      const fetchedArtist = await getArtistDetailsById(id || "");
      if (!fetchedArtist) await addArtist();
      else {
        fetchedArtist.albums.sort((a, b) =>
          new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
        );
        setArtist(fetchedArtist);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching artist:", error);
    }
  };

  useEffect(() => { if (id) fetchArtist(); }, [id]);

  return (
    <div className="flex flex-col min-h-screen w-full md:overflow-hidden">
      {/* Sticky header */}
      {artist && (
        <motion.div
          className={`sticky top-16 md:top-0 z-50 px-4 md:px-6 transition-all duration-300 py-3 bg-black/50 backdrop-blur-md shadow-lg md:bg-transparent ${
            scrolled ? "bg-black/50 backdrop-blur-md shadow-lg" : "bg-transparent"
          }`}
          // animate={{ backgroundColor: scrolled ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0)" }}
        >
          <motion.h1
            className={`text-white font-extrabold transition-all duration-300 ${
              scrolled ? "text-2xl md:text-3xl" : "text-4xl md:text-5xl lg:text-6xl"
            } truncate`}
          >
            {artist.name}
          </motion.h1>
        </motion.div>
      )}

      {/* Scrollable content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto common-container -mt-10 p-10 px-6">
        {loading && <div className='mt-20'><LoaderMusic /> </div>}
        {notFound && <h1 className="text-2xl text-gray-300 text-center mt-20">Artist not found</h1>}

        {artist && (
          <div className="max-w-7xl w-full mx-auto">
            {/* Hero with overlay text */}
            <div ref={heroRef} className="relative h-[50vh] md:h-[60vh] w-full rounded-lg overflow-hidden shadow-lg mt-6">
              <img
                src={artist.image_url}
                alt={artist.name}
                className="absolute inset-0 w-full h-full object-cover object-top brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

              {/* Text overlay */}
              {/* <div className="absolute inset-0 flex items-end pb-6 md:pb-10 px-4 md:px-6">
                <h1 className="text-white font-extrabold text-4xl md:text-5xl lg:text-6xl drop-shadow-lg">
                  {artist.name}
                </h1>
              </div> */}
            </div>

            {/* Albums */}
            <section className="mt-6 md:mt-10">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">Albums</h2>

                  <Link
                    to={`/artist/${artist.artistId}/discography`}
                    className="text-sm md:text-base font-semibold text-gray-400 hover:text-white transition"
                  >
                    See all
                  </Link>
              </div>

              {artist.albums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {artist.albums.slice(0, 5).map(album => (
                    <Link key={album.albumId} to={`/album/${album.albumId}`} className="group">
                      <div className="relative overflow-hidden rounded-xl shadow-md bg-neutral-900 transition-transform transform group-hover:scale-105 group-hover:shadow-lg">
                        <img src={album.album_cover_url} alt={album.title} className="w-full aspect-square object-cover" />
                      </div>
                      <p className="mt-2 text-sm md:text-base text-gray-200 text-center font-medium truncate group-hover:text-white">
                        {album.title}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center mt-4">No albums found</p>
              )}
            </section>

            {/* Top Reviews */}
            <section className=" mt-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Top Reviews</h2>
              <div className="bg-neutral-900/50 rounded-xl p-4 md:p-6 text-gray-400 text-center">
                Coming soon...
              </div>
            </section>

            {/* Similar Artists */}
            <section className="mt-10 mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Similar Artists</h2>
              <div className="bg-neutral-900/50 rounded-xl p-4 md:p-6 text-gray-400 text-center">
                Coming soon...
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Artist;
