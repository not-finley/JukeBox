import { Playlist } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { getProfileUrl } from "./users";

export const getPlaylistById = async (playlistId: string): Promise<Playlist | null> => {
    try {
        const { data, error } = await supabase
            .from('playlists')
            .select(`
                playlist_id,
                name,
                description,
                created_at,
                cover_url,
                playlist_creators (
                    user:users (user_id, name) 
                ),
                playlist_items (
                    id,
                    order,
                    type,
                    song:songs (
                        album:albums(album_cover_url, title), 
                        title, 
                        song_id, 
                        album_id, 
                        isrc, 
                        artists:artists (*)
                    ),
                    album:albums (
                        album_id,
                        title,
                        album_cover_url,
                        artists:artists (*),
                        songs:songs(count)
                    )
                )
            `)
            .eq('playlist_id', playlistId)
            .order('order', { referencedTable: 'playlist_items', ascending: true })
            .single();

        if (error || !data) throw error;

        const resolvedCreators = await Promise.all(
            data.playlist_creators.map(async (pc: any) => ({
                ...pc.user,
                imageUrl: pc.user.user_id ? await getProfileUrl(pc.user.user_id) : "/assets/default-avatar.png",
                accountId: pc.user.user_id,
                name: pc.user.name
            }))
        );

        let songCount = 0;
        let albumCount = 0;
        let totalTracks = 0;

        const mappedItems = data.playlist_items.map((item: any) => {
            if (item.type === 'song') {
                songCount++;
                totalTracks++;
                return {
                    id: item.id,
                    type: 'song' as const,
                    songId: item.song.song_id,
                    title: item.song.title,
                    album: item.song.album,
                    album_cover_url: item.song.album?.album_cover_url,
                    artist: item.song.artists,
                    isrc: item.song.isrc,
                    preview_url: null 
                };
            } else {
                albumCount++;
                // Extract count from the songs(count) subquery
                const trackCount = item.album?.songs?.[0]?.count || 0;
                totalTracks += trackCount;
                
                return {
                    id: item.id,
                    type: 'album' as const,
                    albumId: item.album.album_id,
                    title: item.album.title,
                    album_cover_url: item.album.album_cover_url,
                    artist: item.album.artists,
                    trackCount: trackCount,
                    tracks: [] 
                };
            }
        });

        return {
            playlistId: data.playlist_id,
            name: data.name,
            description: data.description,
            createdAt: data.created_at,
            coverUrl: data.cover_url,
            creators: resolvedCreators,
            items: mappedItems,
            songCount,
            albumCount,
            totalTracks
        };
    } catch (error) {
        console.error("Error fetching playlist metadata:", error);
        return null;
    }
};


export const getAlbumTracks = async (albumId: string) => {
    try {
        const { data, error } = await supabase
            .from('songs')
            .select(`
                song_id,
                title,
                isrc,
                artists:artists (*),
                album:albums (album_cover_url)
            `)
            .eq('album_id', albumId);

        if (error) throw error;

        // Prepare for enrichment
        const trackInputs = data.map(s => ({
            songId: s.song_id,
            title: s.title,
            artist: s.artists.map((a: any) => a.name).join(", "),
            isrc: s.isrc
        }));

        // Only call the Edge Function for this specific album
        const { data: enrichmentData } = await supabase.functions.invoke('enrich-album', {
            body: { tracks: trackInputs }
        });

        const previewMap = new Map();
        enrichmentData?.tracks?.forEach((t: any) => previewMap.set(t.songId || t.song_id, t.preview_url));

        return data.map(s => ({
            songId: s.song_id,
            title: s.title,
            artist: s.artists,
            isrc: s.isrc,
            album_cover_url: s.album[0]?.album_cover_url,
            preview_url: previewMap.get(s.song_id) || null
        }));
    } catch (error) {
        console.error("Error fetching album tracks:", error);
        return [];
    }
};

export async function deletePlaylist(playlistId: string) {
    try {
        // 1. Delete from DB and get the cover_url back
        const { data, error } = await supabase
            .from('playlists')
            .delete()
            .eq('playlist_id', playlistId)
            .select('cover_url')
            .single();

        if (error) throw error;

        const isStorageUrl = data?.cover_url?.includes('storage/v1/object/public/playlists/');

        if (data?.cover_url && isStorageUrl) {
            const parts = data.cover_url.split('/playlists/');
            const filePath = parts[1]; 

            if (filePath) {
                const { error: storageError } = await supabase
                    .storage
                    .from('playlists')
                    .remove([filePath]);

                if (storageError) {
                    console.error("Storage cleanup failed:", storageError.message);
                }
            }
        }

        return true;
    } catch (err) {
        console.error("Failed to delete playlist:", err);
        return false;
    }
}


// Generic add function for both types
export async function addItemToPlaylist(
    playlistId: string, 
    itemId: string, 
    type: 'song' | 'album', 
    index: number
) {
    const insertData: any = {
        id: itemId,
        playlist_id: playlistId,
        order: index,
        type: type
    };

    if (type === 'song') insertData.song_id = itemId;
    else insertData.album_id = itemId;

    const { error } = await supabase
        .from('playlist_items')
        .insert(insertData);

    if (error) {
        if (error.code === '23505') return { success: true, message: 'Already in playlist' };
        throw error;
    }

    return { success: true };
}

export async function batchAddItemsToPlaylist(items: { 
    id: string,
    playlist_id: string, 
    song_id: string, 
    type: string, 
    order: number 
}[]) {
    try {
        const { data, error } = await supabase
            .from("playlist_items")
            .insert(items);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error batch adding to playlist:", error);
        throw error;
    }
}

// Update the remove function to handle the generic item ID
export async function removeItemFromPlaylist(playlistId: string, itemId: string) {
    try {
        // Find by the row ID (playlist_items.id) rather than song_id
        const { data: itemData, error: fetchError } = await supabase
            .from('playlist_items')
            .select('"order"')
            .eq('id', itemId)
            .single();

        if (fetchError) throw fetchError;

        const { error: deleteError } = await supabase
            .from('playlist_items')
            .delete()
            .eq('id', itemId);

        if (deleteError) throw deleteError;

        await supabase.rpc('reorder_items_on_delete', {
            p_playlist_id: playlistId,
            p_deleted_order: itemData.order
        });

        return true;
    } catch (err) {
        console.error("Failed to remove item:", err);
        return false;
    }
}

export async function getPlaylists(userId: string): Promise<Playlist[]> {
    try {
        const { data: playlists, error } = await supabase
            .from("playlists")
            .select(`
                playlist_id,
                name,
                description,
                created_at,
                cover_url,
                playlist_creators!inner (user_id),
                playlist_items (
                    type,
                    songs (song_id),
                    albums (
                        album_id,
                        songs (song_id)
                    )
                )
            `)
            .eq("playlist_creators.user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        if (!playlists) return [];

        const results = await Promise.all(
            playlists.map(async (p: any) => {
                const items = p.playlist_items || [];
                
                const albumCount = items.filter((i: any) => i.type === 'album').length;
                
                const soloSongCount = items.filter((i: any) => i.type === 'song').length;

                const totalTracks = items.reduce((acc: number, item: any) => {
                    if (item.type === 'album') {
                        return acc + (item.albums?.songs?.length || 0);
                    }
                    return acc + 1;
                }, 0);

                return {
                    playlistId: p.playlist_id,
                    name: p.name,
                    description: p.description,
                    createdAt: p.created_at,
                    creators: [{
                        accountId: userId,
                        username: "",
                        name: "", 
                        imageUrl: await getProfileUrl(userId), 
                        email: "", 
                        bio: ""
                    }],
                    coverUrl: p.cover_url,
                    items: [], // Keeping this empty as per your original structure
                    albumCount: albumCount,
                    songCount: soloSongCount,
                    totalTracks: totalTracks
                };
            })
        );

        return results;
    } catch (err) {
        console.error("Failed to fetch user playlists:", err);
        return [];                          
    }
}

export async function createPlaylist(
    userId: string, 
    name: string, 
    description: string, 
    imageFile: File | null
): Promise<{ success: boolean; playlistId?: string; error?: string }> {
    try {
        const now = new Date();
        const isoString = now.toISOString();
        // 1. Generate a unique ID for the playlist first
        const playlistId = crypto.randomUUID();
        let coverUrl = null;

        if (imageFile) {
            const fileName = `${userId}/${playlistId}.webp`;
            const { data: _storageData, error: storageError } = await supabase.storage
                .from("playlists")
                .upload(fileName, imageFile, {
                cacheControl: '3600',
                upsert: true
                });

            if (storageError) throw storageError;

            // Get the Public URL for the uploaded image
            const { data: urlData } = supabase.storage
                .from("playlists")
                .getPublicUrl(fileName);
                
            coverUrl = urlData.publicUrl;
        }

        // 3. Insert Playlist Row
        const { error: playlistError } = await supabase
        .from("playlists")
        .insert({
            playlist_id: playlistId,
            name: name,
            description: description,
            created_at: isoString,
            cover_url: coverUrl || "/assets/icons/music-placeholder.png"
        });

        if (playlistError) throw playlistError;

        // 4. Add Creator to playlist_creators (Join Table)
        const { error: creatorError } = await supabase
        .from("playlist_creators")
        .insert({
            playlist_id: playlistId,
            user_id: userId,
        });

        if (creatorError) throw creatorError;

        return { success: true, playlistId };

    } catch (error: any) {
        console.error("Create Playlist Error:", error.message);
        return { success: false, error: error.message };
    }
}

export async function updatePlaylistMetadata(
    playlistId: string, 
    updates: { name: string; description: string }
) {
    const { data, error } = await supabase
        .from('playlists')
        .update({
            name: updates.name,
            description: updates.description,
        })
        .eq('playlist_id', playlistId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function addSongToPlaylist(playlistId: string, songId: string, index: number) {
    const { error } = await supabase
        .from('playlist_items')
        .insert({
            playlist_id: playlistId,
            song_id: songId,
            order: index
        });

    if (error) {
        // Handle unique constraint if the song is already in the playlist
        if (error.code === '23505') return { success: true, message: 'Already in playlist' };
        throw error;
    }

    return { success: true };
}

export async function updatePlaylistCover(
    userId: string, 
    playlistId: string, 
    imageFile: File
): Promise<string> {
    const fileName = `${userId}/${playlistId}.webp`;

    // 1. Upload/Overwrite to Storage
    const { error: storageError } = await supabase.storage
        .from("playlists")
        .upload(fileName, imageFile, {
            cacheControl: '0',
            upsert: true
        });

    if (storageError) throw storageError;

    // 2. Get Public URL
    const { data: urlData } = supabase.storage
        .from("playlists")
        .getPublicUrl(fileName);
        
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // 3. Update the Database row
    const { error: dbError } = await supabase
        .from("playlists")
        .update({ cover_url: publicUrl })
        .eq('playlist_id', playlistId);

    if (dbError) throw dbError;

    return publicUrl;
}

export async function updateSongsOrder(playlistId: string, orderedSongIds: {songId:any, id: any}[]) {
    // We update each song-playlist link with its new index
    const updates = orderedSongIds.map((songId, id, index) => ({
        id: id,
        playlist_id: playlistId,
        song_id: songId,
        order: index
    }));

    const { error } = await supabase
        .from('playlist_items')
        .upsert(updates, { onConflict: 'playlist_id, song_id' });

    if (error) throw error;
}

export async function updateItemsOrder(playlistId: string, orderedItems: any[]) {
    const updates = orderedItems.map((item, index) => ({
        id: item.id, // Using the unique primary key of the join table
        playlist_id: playlistId,
        song_id: item.type === 'song' ? item.songId : null,
        album_id: item.type === 'album' ? item.albumId : null,
        type: item.type,
        order: index
    }));

    const { error } = await supabase
        .from('playlist_items')
        .upsert(updates);

    if (error) throw error;
}
