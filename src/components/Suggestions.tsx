import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { getInternalSuggestions } from '@/lib/appwrite/api';
import { getArtistDiscographySuggestions } from '@/lib/appwrite/spotify';
import { useUserContext } from '@/lib/AuthContext';

interface SuggestedAlbum {
    id: string;
    title: string;
    artist_name: string;
    album_cover_url: string;
    label?: string; // Add this!
}

const Suggestions = ({ currentAlbumId, artistId }: { currentAlbumId: string; artistId: string }) => {
    const {user} = useUserContext();
    const [suggestions, setSuggestions] = useState<SuggestedAlbum[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);
    
    const { ref, inView } = useInView({
        triggerOnce: true,
        rootMargin: '200px 0px',
    });

    useEffect(() => {
        if (inView) {
            const fetchAll = async () => {
                setHasLoaded(false);
                
                const internalRaw = await getInternalSuggestions(currentAlbumId, user?.accountId, 2);
                const internal = internalRaw.map(album => ({ 
                    ...album, 
                    label: "Recommended" 
                }));

                const externalRaw = await getArtistDiscographySuggestions(artistId, currentAlbumId, 4);
                const external = externalRaw.map(album => ({ 
                    ...album, 
                    label: "More from Artist" 
                }));
                
                // 3. Combine with Fill Logic
                const combined = [...internal];
                const needed = 4 - combined.length;
                
                if (needed > 0) {
                    // Ensure we don't duplicate something if it's already in 'internal'
                    const extra = external.filter(ext => !combined.some(int => int.id === ext.id));
                    combined.push(...extra.slice(0, needed));
                }

                setSuggestions(combined);
                setHasLoaded(true);
            };
            fetchAll();
        }
    }, [inView, currentAlbumId, artistId, user?.accountId]);

    return (
        <div ref={ref} className=" border-t border-gray-800 pt-12">
        <h3 className="text-2xl font-bold mb-6">You might also like...</h3>
        
        {!hasLoaded ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square w-full bg-gray-900 animate-pulse rounded-lg" />
            ))}
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {suggestions.map((album) => (
                <Link to={`/album/${album.id}`} key={album.id} className="relative group hover:scale-105 transition-all">
                    {album.label && (
                        <span className="absolute -top-3 left-2 z-10 bg-emerald-600 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full shadow-lg">
                            {album.label}
                        </span>
                    )}
                    <img src={album.album_cover_url} className="aspect-square object-cover rounded-lg shadow-lg mb-2" />
                    <p className="font-bold text-white truncate">{album.title}</p>
                    <p className="text-sm text-gray-400 truncate">{album.artist_name}</p>
                </Link>
            ))}
            </div>
        )}
        </div>
    );
};

export default Suggestions;