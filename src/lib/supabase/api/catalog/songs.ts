import { Song, SongDetails, SpotifySong } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { getDeezerPreview } from "@/lib/integrations/deezer";
import { normalizeReleaseDate } from "../utils/dates";
import { getProfileUrl } from "../users";

export async function getSongById(songId: string): Promise<Song | null> {
    try {
        const { data: songData, error: songError } = await supabase
            .from("songs")
            .select("*")
            .eq("song_id", songId)
            .single();



        if (songError) throw songError;
        if (!songData) throw new Error("Song not found");


        const { data: albumData, error: albumError } = await supabase
            .from("albums")
            .select("*")
            .eq("album_id", songData.album_id)
            .single();

        if (albumError) throw albumError;
        if (!albumData) throw new Error("Album not found");

        // Validate or map the returned songData to a Song type
        const song: Song = {
            songId: songData.song_id,
            title: songData.title,
            album: albumData.titel,
            release_date: albumData.release_date,
            spotify_url: songData.spotify_url,
            album_cover_url: albumData.album_cover_url,
            popularity: songData.popularity
        };

        return song;
    } catch (error) {
        console.error('Failed to fetch song:', error);
        return null;
    }
}

export async function fetchSongs(page = 1, limit = 20): Promise<Song[]> {
    try {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data: songData, error: songError } = await supabase
            .from("songs")
            .select("*, albums:songs_album_id_fkey(album_cover_url)")
            .range(from, to);



        if (songError) throw songError;
        if (!songData) throw new Error("Song not found");

        return songData.map((song: any) => ({
            ...song,
            songId: song.song_id,
            album_cover_url: song.albums?.album_cover_url ?? null,
        }));
    }
    catch (error) {
        console.log(error);
        return []
    }
}

export async function getSongDetailsById(songId: string): Promise<SongDetails | null> {
    try {
        // Fetch the song
        const { data: songData, error: songError } = await supabase
            .from("songs")
            .select("*")
            .eq("song_id", songId)
            .single();

        if (songError) throw songError;
        if (!songData) throw new Error("Song not found");

        // Fetch the album
        const { data: albumData, error: albumError } = await supabase
            .from("albums")
            .select("*")
            .eq("album_id", songData.album_id)
            .single();

        if (albumError) throw albumError;
        if (!albumData) throw new Error("Album not found");

        // Fetch artists
        const { data: artists, error: artistError } = await supabase
            .from("artistsongs")
            .select(`artist:artists(*)`)
            .eq("song_id", songData.song_id);

        if (artistError) throw artistError;
        if (!artists || artists.length === 0) throw new Error("Artist(s) not found");

        const artistList = artists.map((a) => a.artist);

        // Fetch reviews
        const { data: reviews, error: reviewError } = await supabase
            .from("reviews")
            .select("*, creator:users(*), likes:reviewlikes(*)")
            .eq("song_id", songId)
            .order("created_at", { ascending: false });

        if (reviewError) throw reviewError;

        const preview_url = await getDeezerPreview(songData.title, songData.artists, songData.isrc)

        // Build song object
        const song: SongDetails = {
            songId: songData.song_id,
            title: songData.title,
            album: albumData.title,
            album_id: albumData.album_id,
            release_date: albumData.release_date,
            spotify_url: songData.spotify_url,
            album_cover_url: albumData.album_cover_url,
            popularity: songData.popularity,
            artists: artistList,
            ratings: [],
            reviews: await Promise.all(
                reviews.map(async (r: any) => ({
                    reviewId: r.review_id,
                    text: r.review_text,
                    title: r.review_title,
                    creator: {
                        accountId: r.creator.user_id,
                        name: r.creator.name,
                        username: r.creator.username,
                        email: r.creator.email,
                        imageUrl: await getProfileUrl(r.creator.user_id),
                        bio: r.creator.bio ?? "",

                    },
                    song: songData,
                    likes: r.likes.length,
                    createdAt: r.created_at,
                    updatedAt: r.created_at,
                }))
            ),
            isrc: songData.isrc,
            preview_url: preview_url
        };

        return song;
    } catch (error) {
        console.error("Failed to fetch song:", error);
        return null;
    }
}

export async function addSongToDatabase(song: SpotifySong) {
    try {
        // 1. Upsert Album (onConflict uses the primary key)
        const { error: albumError } = await supabase
            .from("albums")
            .upsert({
                album_id: song.album.id,
                title: song.album.name,
                spotify_url: song.album.external_urls.spotify,
                album_cover_url: song.album_cover_url,
                release_date: normalizeReleaseDate(song.album.release_date),
                total_tracks: song.album.total_tracks,
            }, { onConflict: 'album_id' });

        if (albumError) throw albumError;

        // 2. Upsert Song
        const { error: songInsertError } = await supabase
            .from("songs")
            .upsert({
                song_id: song.songId,
                title: song.title,
                album_id: song.album.id,
                spotify_url: song.spotify_url,
                pop: song.popularity,
                isrc: song.isrc,
            }, { onConflict: 'song_id' });

        if (songInsertError) throw songInsertError;

        // 3. Upsert Artists and link them
        for (const artist of song.artists) {
            await supabase.from("artists").upsert({
                artist_id: artist.id,
                name: artist.name,
                spotify_url: artist.external_urls.spotify,
            }, { onConflict: 'artist_id' });

            await supabase.from("artistsongs").upsert({
                song_id: song.songId, 
                artist_id: artist.id 
            }, { onConflict: 'song_id, artist_id' });
        }

        return true;
    } catch (error) {
        console.error("Error syncing song to database:", error);
        throw error;
    }
}

export async function batchSyncSongsToDatabase(songs: any[]) {
    try {
        // 1. Prepare unique Albums
        const uniqueAlbums = Array.from(new Map(songs.map(s => [s.album.id, {
        album_id: s.album.id,
        title: s.album.name,
        spotify_url: s.album.external_urls.spotify,
        album_cover_url: s.album.images?.[0]?.url || s.album_cover_url,
        release_date: normalizeReleaseDate(s.album.release_date),
        total_tracks: s.album.total_tracks,
        }])).values());

        // 2. Prepare Songs
        const songsToUpsert = songs.map(s => ({
        song_id: s.id,
        title: s.name || s.title,
        album_id: s.album.id,
        spotify_url: s.external_urls?.spotify,
        pop: s.popularity,
        isrc: s.external_ids?.isrc,
        preview_url: s.preview_url,
        track_number: s.track_number
        }));

        // 3. Prepare Artists (Flattened unique list)
        const artistMap = new Map();
        const artistLinks: any[] = [];
        
        songs.forEach(s => {
        s.artists.forEach((a: any) => {
            artistMap.set(a.id, {
            artist_id: a.id,
            name: a.name,
            spotify_url: a.external_urls?.spotify
            });
            artistLinks.push({ song_id: s.id, artist_id: a.id });
        });
        });

        // EXECUTE BATCHES
        const { error: albErr } = await supabase.from("albums").upsert(uniqueAlbums, { onConflict: 'album_id' });
        if (albErr) throw albErr;

        const { error: songErr } = await supabase.from("songs").upsert(songsToUpsert, { onConflict: 'song_id' });
        if (songErr) throw songErr;

        const { error: artErr } = await supabase.from("artists").upsert(Array.from(artistMap.values()), { onConflict: 'artist_id' });
        if (artErr) throw artErr;

        const { error: linkErr } = await supabase.from("artistsongs").upsert(artistLinks, { onConflict: 'song_id, artist_id' });
        if (linkErr) throw linkErr;

        return { success: true };
    } catch (error) {
        console.error("Batch sync failed:", error);
        throw error;
    }
}

export async function addListenedSong(songId: string, userId: string) {
    const now = new Date();
    const isoString = now.toISOString();
    try {
        const { error: addListen } = await supabase
            .from("song_listens")
            .insert({
                song_id: songId,
                user_id: userId,
                listen_date: isoString,
            });

        if (addListen) throw addListen;

    } catch (error) {
        console.log(error);
    }
}

export async function addListenedAlbum(albumId: string, userId: string) {
    const now = new Date();
    const isoString = now.toISOString();
    try {
        const { error: addListen } = await supabase
            .from("album_listens")
            .insert({
                album_id: albumId,
                user_id: userId,
                listen_date: isoString,
            });

        if (addListen) throw addListen;

    } catch (error) {
        console.log(error);
    }
}

export async function hasListenedSong(userId: string, songId: string): Promise<Boolean> {
    try {

        const { data: listened } = await supabase
            .from("song_listens")
            .select("*")
            .eq("song_id", songId)
            .eq("user_id", userId)
            .single();

        if (!listened) return false;

        return true;
    } catch (error) {
        console.error('Failed to fetch listened:', error);
        return false;
    }
}

export async function hasListenedAlbum(userId: string, albumId: string): Promise<Boolean> {
    try {

        const { data: listened } = await supabase
            .from("album_listens")
            .select("*")
            .eq("album_id", albumId)
            .eq("user_id", userId)
            .single();

        if (!listened) return false;

        return true;
    } catch (error) {
        console.error('Failed to fetch listened:', error);
        return false;
    }
}

export async function removeListenedSong(songId: string, userId: string) {
    try {
        await supabase
            .from("song_listens")
            .delete()
            .eq("song_id", songId)
            .eq("user_id", userId);

    } catch (error) {
        console.error('Failed to delete listen:', error);
        return false;
    }
}


export async function removeListenedAlbum(albumId: string, userId: string) {
    try {
        await supabase
            .from("album_listens")
            .delete()
            .eq("album_id", albumId)
            .eq("user_id", userId);

    } catch (error) {
        console.error('Failed to delete listen:', error);
        return false;
    }
}


export async function addUpdateRatingSong(songId: string, userId: string, rating: number) {
    const now = new Date();
    const isoString = now.toISOString();
    try {
        const { error: addListen } = await supabase
            .from("song_rating")
            .upsert({
                song_id: songId,
                user_id: userId,
                rating_date: isoString,
                rating: rating
            })

        const { data: getListen, error: getListenError } = await supabase
            .from("song_listens")
            .select("*")
            .eq("song_id", songId)
            .eq("user_id", userId)

        if (getListenError) throw getListenError;

        if (getListen.length === 0) {
            const { error: listenError } = await supabase
                .from("song_listens")
                .insert({ song_id: songId, user_id: userId, listen_date: isoString })
            if (listenError) throw listenError;
        }

        if (addListen) throw addListen;

    } catch (error) {
        console.log(error);
    }
}

export async function deleteRatingSong(songId: string, userId: string) {
    try {
        const { error: deleteRating } = await supabase
            .from("song_rating")
            .delete()
            .eq("user_id", userId)
            .eq("song_id", songId);

        if (deleteRating) throw deleteRating;

    } catch (error) {
        console.log(error);
    }
}

export async function getRatingSong(songId: string, userId: string): Promise<number> {
    try {
        const { data: rating } = await supabase
            .from("song_rating")
            .select("*")
            .eq("song_id", songId)
            .eq("user_id", userId)
            .single();

        if (!rating) return 0;


        return rating.rating;
    } catch (error) {
        console.error('Failed to fetch raiting:', error);
        return 0;
    }
}

export async function getAllRatingsOfSong(songId: string): Promise<{
    counts: { rating: number; count: number }[];
    average: number;
    total: number;
}> {
    try {
        const { data: ratings, error } = await supabase
            .from("song_rating")
            .select("rating")
            .eq("song_id", songId);

        if (error) throw error;
        if (!ratings || ratings.length === 0) return { counts: [], average: 0, total: 0 };

        // 1. Initialize all 10 Letterboxd-style buckets (0.5 to 5.0)
        const possibleRatings = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
        const countsMap = new Map(possibleRatings.map(r => [r, 0]));

        let sum = 0;
        const total = ratings.length;

        ratings.forEach((r) => {
            // Postgres numeric types often return as strings, so cast to Number
            const val = Number(r.rating); 
            sum += val;

            // Increment the specific bucket
            if (countsMap.has(val)) {
                countsMap.set(val, (countsMap.get(val) || 0) + 1);
            }
        });

        // 2. Format for Recharts
        const counts = possibleRatings.map((r) => ({
            rating: r,
            count: countsMap.get(r) || 0,
        }));

        // 3. Calculate accurate decimal average
        const average = sum / total;

        return { counts, average, total };
    } catch (error) {
        console.error("Failed to fetch song ratings:", error);
        return { counts: [], average: 0, total: 0 };
    }
}

