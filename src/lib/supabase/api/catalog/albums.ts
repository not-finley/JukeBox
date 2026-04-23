import { AlbumDetails, SpotifyAlbum, SpotifyAlbumWithTracks, SpotifyTrack } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { normalizeReleaseDate } from "../utils/dates";

export async function getAlbumDetailsById(albumId: string): Promise<AlbumDetails | null> {
    try {
        // Fetch the album
        const { data: albumData, error: albumError } = await supabase
            .from("albums")
            .select("*")
            .eq("album_id", albumId)
            .single();

        if (albumError) throw albumError;
        if (!albumData) throw new Error("Album not found");

        if (albumData.fully_loaded === false) return null;



        // fetch all song information
        const { data: songData, error: songError } = await supabase
            .from("songs")
            .select("*")
            .eq("album_id", albumId)
            .order("track_number", { ascending: true });


        if (songError) throw songError;
        if (!songData) throw new Error("No songs found");

        const trackInputs = songData.map(s => ({
            songId: s.song_id,
            title: s.title,
            artist: s.artist, // Assuming s.artist is the primary artist string
            isrc: s.isrc
        }));

        const { data: enrichmentData, error: enrichmentError } = await supabase.functions.invoke('enrich-album', {
            body: { tracks: trackInputs }
        });


        // fetch artists 
        const { data: artists, error: artistError } = await supabase
            .from("artistalbum")
            .select(`
                artist:artists(*)  
            `)
            .eq("album_id", albumId);

        if (artistError) throw artistError;
        if (!artists || artists.length === 0) throw new Error("Artist(s) not found");

        // Extract the artist info
        const artistList = artists.map(a => a.artist);



        // fetch album reviews
        const { data: reviews, error: reviewError } = await supabase
            .from("reviews")
            .select("*, creator:users(*), likes:reviewlikes(*)")
            .eq("album_id", albumId)
            .order("created_at", { ascending: false });

        if (reviewError) throw reviewError;

        //get preview url's 
        const previewMap = new Map();
        if (!enrichmentError && enrichmentData?.tracks) {
            enrichmentData.tracks.forEach((t: any) => {
                previewMap.set(t.songId, t.preview_url);
            });
        }

        const album: AlbumDetails = {
            albumId: albumData.album_id,
            title: albumData.title,
            spotify_url: albumData.spotify_url,
            album_cover_url: albumData.album_cover_url,
            release_date: albumData.release_date,
            tracks: songData.map((s: any) => ({
                songId: s.song_id,
                title: s.title,
                album: albumData.title,
                album_id: albumData.album_id,
                reviews: [],
                ratings: [],
                artists: [],
                spotify_url: s.spotify_url,
                album_cover_url: albumData.album_cover_url,
                release_date: albumData.release_date,
                popularity: s.pop,
                isrc: s.isrc, 
                preview_url: previewMap.get(s.song_id) || null,
            })),
            album_type: albumData.album_type,
            artists: artistList,
            reviews: await Promise.all(
                reviews.map(async (r: any) => {
                    let imageUrl = "";
                    try {
                        const { data: signedData, error: signedError } = await supabase.storage
                            .from("profiles")
                            .createSignedUrl(`${r.creator.user_id}/profile.jpg`, 60 * 60); // 1 hour

                        if (!signedError && signedData?.signedUrl) {
                            imageUrl = signedData.signedUrl;
                        }
                    } catch (err) {
                        console.error("Failed to generate signed URL:", err);
                    }

                    return {
                        reviewId: r.review_id,
                        text: r.review_text,
                        title: r.review_title,
                        creator: {
                            accountId: r.creator.user_id,
                            name: r.creator.name,
                            username: r.creator.username,
                            email: r.creator.email,
                            imageUrl,
                            bio: r.creator.bio ?? ""
                        },
                        album: albumData,
                        likes: r.likes.length,
                        createdAt: r.created_at,
                        updatedAt: r.created_at,
                    };
                })
            ),
        };
        return album
    } catch (error) {
        console.error("Failed to fetch Album:", error);
        return null;
    }
}


export async function getAlbumTrackRatings(
    albumId: string,
    userId: string
): Promise<{ songId: string; rating: number }[]> {
    const { data, error } = await supabase
        .from("song_rating")
        .select("song_id, rating, songs!inner(album_id)")
        .eq("songs.album_id", albumId)
        .eq("user_id", userId);

    if (error) {
        console.error("Error fetching user track ratings:", error);
        return [];
    }

    if (!data) return [];

    // Simplify the structure to just song_id and rating
    return data.map((t) => ({
        songId: t.song_id,
        rating: t.rating,
    }));
}



export async function addAlbumSimple(album: SpotifyAlbum, artist_id: string) {
    try {
        // --- Check album ---
        const { data: existingAlbum } = await supabase
            .from("albums")
            .select("*")
            .eq("album_id", album.id)
            .single();

        if (!existingAlbum) {
            const { error: albumError } = await supabase
                .from("albums")
                .insert([{
                    album_id: album.id,
                    title: album.name,
                    spotify_url: album.external_urls.spotify,
                    album_cover_url: album.images[0]?.url,
                    release_date: normalizeReleaseDate(album.release_date),
                    total_tracks: album.total_tracks,
                    fully_loaded: false
                }]);
            if (albumError) throw albumError;
        }

        if (existingAlbum) {
            return;
        }



        const { error: artistError } = await supabase
            .from("artistalbum")
            .upsert([{ album_id: album.id, artist_id: artist_id }]);

        if (artistError) throw artistError


    } catch (error) {
        console.error("Error adding Album to database:", error);
        throw error;
    }
}

// add album with tracks 
export async function addAlbumComplex(album: SpotifyAlbumWithTracks) {
    try {

        // --- Check album ---
        const { data: existingAlbum } = await supabase
            .from("albums")
            .select("*")
            .eq("album_id", album.id)
            .single();

        if (!existingAlbum) {
            const { error: albumError } = await supabase
                .from("albums")
                .insert([{
                    album_id: album.id,
                    title: album.name,
                    spotify_url: album.external_urls.spotify,
                    album_cover_url: album.images[0]?.url,
                    release_date: normalizeReleaseDate(album.release_date),
                    total_tracks: album.total_tracks,
                    fully_loaded: true,
                    album_type: album.album_type
                }]);
            if (albumError) throw albumError;
        } else if (existingAlbum.fully_loaded === true) {
            return; // Already loaded
        } else {
            const { error: albumUpdate } = await supabase
                .from("albums")
                .update([{
                    title: album.name,
                    spotify_url: album.external_urls.spotify,
                    album_cover_url: album.images[0]?.url,
                    release_date: normalizeReleaseDate(album.release_date),
                    total_tracks: album.total_tracks,
                    fully_loaded: true,
                    album_type: album.album_type
                }])
                .eq("album_id", album.id);
            if (albumUpdate) throw albumUpdate;
        }

        // --- Batch insert artists ---
        const artistInserts = album.artists.map(a => ({
            artist_id: a.id,
            name: a.name,
            spotify_url: a.external_urls.spotify
        }));

        await supabase
            .from("artists")
            .upsert(artistInserts);

        // --- Link album & artists ---
        const artistAlbumLinks = album.artists.map(a => ({
            album_id: album.id,
            artist_id: a.id
        }));

        await supabase
            .from("artistalbum")
            .upsert(artistAlbumLinks);

        // --- Batch insert songs ---

        const songInserts = album.tracks.items.map((s: SpotifyTrack) => ({
            song_id: s.id,
            title: s.name,
            album_id: album.id,
            spotify_url: s.external_urls.spotify,
            pop: s.popularity, 
            isrc: s.external_ids?.isrc || null
        }));

        await supabase
            .from("songs")
            .upsert(songInserts);

        // --- Link songs & artists ---
        const songArtistLinks = album.tracks.items.flatMap((s: any) =>
            s.artists.map((a: any) => ({
                song_id: s.id,
                artist_id: a.id
            }))
        );

        await supabase
            .from("artistsongs")
            .upsert(songArtistLinks);

    } catch (error) {
        console.error("Error adding Album to database:", error);
        throw error;
    }
}

export async function addUpdateRatingAlbum(albumId: string, userId: string, rating: number) {
    const now = new Date();
    const isoString = now.toISOString();
    try {
        const { error: addListen } = await supabase
            .from("album_rating")
            .upsert({
                album_id: albumId,
                user_id: userId,
                rating_date: isoString,
                rating: rating
            })

        const { data: updateListen, error: listenError } = await supabase
            .from("album_listens")
            .upsert({ album_id: albumId, user_id: userId, listen_date: isoString })

        if (listenError) throw listenError;
        if (addListen) throw addListen;

        if (!updateListen) throw new Error("Failed to update listen time");

    } catch (error) {
        console.log(error);
    }
}

export async function deleteRatingAlbum(albumId: string, userId: string) {
    try {
        const { error: deleteRating } = await supabase
            .from("album_rating")
            .delete()
            .eq("user_id", userId)
            .eq("album_id", albumId);

        if (deleteRating) throw deleteRating;

    } catch (error) {
        console.log(error);
    }
}


export async function getRatingAlbum(albumId: string, userId: string): Promise<number> {
    try {
        const { data: rating } = await supabase
            .from("album_rating")
            .select("*")
            .eq("album_id", albumId)
            .eq("user_id", userId)
            .single();

        if (!rating) return 0;


        return rating.rating;
    } catch (error) {
        console.error('Failed to fetch raiting:', error);
        return 0;
    }
}


export async function getAllRatingsOfAlbum(albumId: string): Promise<{
    counts: { rating: number; count: number }[];
    average: number;
    total: number;
}> {
    try {
        const { data: ratings, error } = await supabase
            .from("album_rating")
            .select("rating")
            .eq("album_id", albumId);

        if (error) throw error;
        if (!ratings || ratings.length === 0) return { counts: [], average: 0, total: 0 };

        // 1. Initialize all 10 Letterboxd-style buckets (0.5 to 5.0)
        const possibleRatings = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
        const countsMap = new Map(possibleRatings.map(r => [r, 0]));

        let sum = 0;
        const total = ratings.length;

        ratings.forEach((r) => {
            const val = Number(r.rating); 
            sum += val;

            // Increment the specific half-star bucket
            if (countsMap.has(val)) {
                countsMap.set(val, (countsMap.get(val) || 0) + 1);
            }
        });

        // 2. Format for Recharts
        const counts = possibleRatings.map((r) => ({
            rating: r,
            count: countsMap.get(r) || 0,
        }));

        const average = sum / total;

        return { counts, average, total };
    } catch (error) {
        console.error("Failed to fetch ratings:", error);
        return { counts: [], average: 0, total: 0 };
    }
}
