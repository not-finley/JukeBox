import { SuggestedAlbum } from "@/types";
import { supabase } from "@/lib/supabaseClient";

export async function getInternalSuggestions(
    currentAlbumId: string, 
    userId: string | undefined, 
    limit: number = 4
): Promise<SuggestedAlbum[]> {
    try {
        let query = supabase
        .from('album_listens')
        .select(`
            album_id,
            albums!inner (
                title,
                album_cover_url,
                artistalbum!inner (
                    artists!inner (
                        name
                    )
                )
            )
        `)
        .neq('album_id', currentAlbumId);

        if (userId) {
            const { data: listenedIds } = await supabase
                .from('album_listens')
                .select('album_id')
                .eq('user_id', userId);
            
            if (listenedIds && listenedIds.length > 0) {
                const ids = listenedIds.map(l => l.album_id);
                // Wrap IDs in quotes if they are strings/UUIDs
                query = query.not('album_id', 'in', `(${ids.join(',')})`);
            }
        }

        const { data, error } = await query.order('listen_date', { ascending: false }).limit(20);

        if (error) throw error;
        if (!data) return [];

        const formatted: SuggestedAlbum[] = data.map(item => {
            // 1. Check if albums is an array or object
            const album = Array.isArray(item.albums) ? item.albums[0] : item.albums;
            if (!album) return null;

            // 2. Check if artistalbum is an array or object
            const artistAlbumEntry = Array.isArray(album.artistalbum) 
                ? album.artistalbum[0] 
                : album.artistalbum;

            // 3. Check if artists is an array or object (This is where your current error is)
            const artistData = Array.isArray(artistAlbumEntry?.artists) 
                ? artistAlbumEntry.artists[0] 
                : artistAlbumEntry?.artists;

            const artistName = artistData?.name || "Unknown Artist";

            return {
                id: item.album_id,
                title: album.title,
                artist_name: artistName,
                album_cover_url: album.album_cover_url,
            };
        }).filter((a): a is SuggestedAlbum => a !== null);

        return formatted.sort(() => Math.random() - 0.5).slice(0, limit);
    } catch (error) {
        console.error("Internal Suggestions Error:", error);
        return [];
    }
}
