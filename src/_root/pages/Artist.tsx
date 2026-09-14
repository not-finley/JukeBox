import { useEffect, useState } from 'react';
import { addUpdateArtist, getArtistDetailsById } from '@/lib/supabase/api';
import { ArtistDetails } from '@/types';
import { Link, useParams } from 'react-router-dom';
import { getSpotifyToken, SpotifyArtistById } from '@/lib/integrations/spotify';
import { ArtistPageSkeleton } from '@/components/shared/PageSkeletons';
import NotFound from '@/components/shared/NotFound';

const Artist = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch artist data
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
      setLoading(true);
      let data = await getArtistDetailsById(id || "");

      if (!data) {
        await addArtist();
        data = await getArtistDetailsById(id || "");
      }

      if (data) {
        // Ensure albums are sorted and filtered to primary albums only
        data.albums = data.albums
          .filter(album => album.album_type === "album")
          .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
        
        setArtist(data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching artist:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (id) fetchArtist(); 
  }, [id]);

  if (loading) {
    return (
      <div className="common-container">
        <ArtistPageSkeleton />
      </div>
    );
  }

  if (notFound || !artist) {
    return <NotFound />;
  }

  return (
    <div className="common-container pb-20">
      {artist && (
        <div className="max-w-6xl w-full mx-auto">
          
          {/* MOBILE & DESKTOP FRIENDLY HERO BANNER */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-gray-900 to-black p-6 sm:p-8 md:p-12 border border-white/5 shadow-2xl">
            
            {/* Background blurred ambiance image */}
            <div className="absolute inset-0 overflow-hidden opacity-25">
              <img
                src={artist.image_url}
                alt={artist.name}
                className="w-full h-full object-cover filter blur-2xl scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

            {/* Header Content Layout */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
              <img
                src={artist.image_url}
                alt={artist.name}
                className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 object-cover rounded-full sm:rounded-2xl shadow-2xl border-2 border-white/10 shrink-0 object-top"
              />
              <div className="flex flex-col justify-end min-w-0 flex-1">
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1.5">Artist</span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight break-words">
                  {artist.name}
                </h1>
              </div>
            </div>
          </div>

          {/* Albums Section */}
          <section className="mt-8 md:mt-12">
            <div className="flex justify-between items-center mb-4 md:mb-6 px-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Albums</h2>
              <Link
                to={`/artist/${artist.artistId}/discography`}
                className="text-xs sm:text-sm font-semibold text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                See all
              </Link>
            </div>

            {artist.albums.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {artist.albums.slice(0, 5).map(album => (
                  <Link key={album.albumId} to={`/album/${album.albumId}`} className="group">
                    <div className="relative overflow-hidden rounded-xl shadow-lg bg-gray-900 border border-white/5 transition-all duration-300 group-hover:scale-[1.02] group-hover:border-white/15">
                      <img src={album.album_cover_url} alt={album.title} className="w-full aspect-square object-cover" />
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-gray-200 font-medium truncate group-hover:text-emerald-400 transition-colors text-center">
                      {album.title}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8 bg-gray-900/40 rounded-2xl border border-white/5 text-sm">
                No albums found
              </p>
            )}
          </section>

          {/* Top Reviews Section */}
          <section className="mt-10 md:mt-14">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white px-1">Top Reviews</h2>
            <div className="bg-gray-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-6 text-gray-400 text-center text-sm">
              Coming soon...
            </div>
          </section>

        </div>
      )}
    </div>
  );
};

export default Artist;