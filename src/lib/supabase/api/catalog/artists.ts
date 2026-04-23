import { ArtistDetails, SpotifyArtistDetailed } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { normalizeReleaseDate } from "../utils/dates";

export async function getArtistDetailsById(artistId: string): Promise<ArtistDetails | null> {
    try {
        const { data: artistData, error: artistError } = await supabase
            .from("artists")
            .select(`
                *,
                artistalbum (
                albums (*)
                )
            `)
            .eq("artist_id", artistId)
            .single();

        if (artistError) throw artistError;
        if (!artistData) throw new Error("Artist not found");
        if (artistData.fully_loaded == false) return null;

        const albums = (artistData.artistalbum ?? []).map((item: any) => ({
            albumId: item.albums.album_id,
            title: item.albums.title,
            spotify_url: item.albums.spotify_url,
            album_cover_url: item.albums.album_cover_url,
            release_date: item.albums.release_date,
            album_type: item.albums.album_type ?? "",
        }));

        return {
            artistId: artistData.artist_id,
            name: artistData.name,
            spotify_url: artistData.spotify_url,
            image_url: artistData.image_url,
            followers: artistData.followers,
            genres: [],
            albums
        };

    } catch (error) {
        console.error("Failed to fetch Artist:", error);
        return null;
    }
}

export async function addUpdateArtist(artist: SpotifyArtistDetailed) {
    try {
        // 1. Ensure the Artist row exists (but keep fully_loaded: false)
        const { data: existingArtist } = await supabase
            .from("artists")
            .select("artist_id")
            .eq("artist_id", artist.id)
            .single();

        if (!existingArtist) {
            const { error: insError } = await supabase.from("artists").insert([{
                artist_id: artist.id,
                name: artist.name,
                spotify_url: artist.external_urls.spotify,
                fully_loaded: false, 
                image_url: artist.images?.[0]?.url ?? null,
            }]);
            if (insError) throw insError;
        }

        // 2. Prepare and Upsert Albums
        const { data: existingAlbums, error: fetchError } = await supabase
            .from("albums")
            .select("album_id, fully_loaded")
            .in("album_id", artist.albums.map((a: any) => a.id));

        if (fetchError) throw fetchError;

        const existingMap = new Map(existingAlbums?.map(a => [a.album_id, a.fully_loaded]) ?? []);

        const albumInserts = artist.albums.map((a: any) => ({
            album_id: a.id,
            title: a.name,
            album_cover_url: a.images[0]?.url,
            release_date: normalizeReleaseDate(a.release_date),
            total_tracks: a.total_tracks,
            spotify_url: a.external_urls.spotify,
            fully_loaded: existingMap.get(a.id) === true, // Keep its status if it exists
            album_type: a.album_type
        }));

        const { error: addingAlbums } = await supabase.from("albums").upsert(albumInserts);
        if (addingAlbums) throw addingAlbums;

        // 3. Link Artist and Albums
        const albumArtistLinks = artist.albums.map((a: any) => ({ 
            album_id: a.id, 
            artist_id: artist.id 
        }));

        const { error: artistsalbumError } = await supabase
            .from("artistalbum")
            .upsert(albumArtistLinks);

        if (artistsalbumError) throw artistsalbumError;

        // 4. FINAL STEP: Mark as fully loaded
        // We also update name and image here in case they changed on Spotify
        const { error: finalUpdate } = await supabase
            .from("artists")
            .update({ 
                name: artist.name,
                image_url: artist.images?.[0]?.url ?? null,
                fully_loaded: true 
            })
            .eq("artist_id", artist.id);

        if (finalUpdate) throw finalUpdate;

        return true;
    } catch (error) {
        console.error("Error adding artist to database:", error);
        throw error;
    }
}
