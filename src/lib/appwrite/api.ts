import { ID } from 'appwrite';

import { AlbumDetails, ArtistDetails, INewUser, IUser, IFollow, Listened, Rating, RatingGeneral, Review, Song, SongDetails, SpotifyAlbum, SpotifyAlbumWithTracks, SpotifyArtistDetailed, SpotifySong } from "@/types";
import { account, appwriteConfig, databases } from './config';
import { supabase } from "@/lib/supabaseClient";

function normalizeReleaseDate(dateStr: string): string | null {
    if (!dateStr) return null;

    // year only
    if (/^\d{4}$/.test(dateStr)) return `${dateStr}-01-01`;
    // year-month
    if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
    // already full
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    return null; // fallback
}

const getProfileUrl = async (userId: string): Promise<string> => {
    const possibleExts = ["jpg", "jpeg", "png", "webp"];
    for (const ext of possibleExts) {
        const { data: signedData, error } = await supabase.storage
            .from("profiles")
            .createSignedUrl(`${userId}/profile.${ext}`, 60 * 60); // 1 hour
        if (!error && signedData?.signedUrl) {
            return signedData.signedUrl;
        }
    }
    // Fallback placeholder
    return "/assets/default-avatar.png";
};


export async function getCurrentUser() {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session?.user || null;
}



export async function createUserAccount(user: INewUser) {
    try {
        // Create auth user in Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
                data: {
                    name: user.name,
                    username: user.username,
                },
            },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create user");

        // Save to users table
        const { data: newUser, error: dbError } = await supabase
            .from("users")
            .insert({
                user_id: authData.user.id,
                name: user.name,
                email: user.email,
                username: user.username,
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return newUser;
    } catch (error) {
        console.error("createUserAccount error:", error);
        return null;
    }
}

export async function saveUserToDB(user: {
    accountId: string;
    email: string;
    name: string;
    username?: string;
}) {
    try {

        console.log("adding user to data:", user);
        const { data: newUser } = await supabase
            .from("users")
            .insert(user)

        return newUser
    } catch (error) {
        console.log(error);
    }
}

function processProfileImage(file: File, maxSize = 500): Promise<Blob> {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            // Determine new dimensions
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }

            // Draw to canvas
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG
            canvas.toBlob((blob) => {
                resolve(blob!);
            }, "image/jpeg", 0.9); // 0.9 quality to save some space
        };
    });
}
export async function updateUser({
    accountId,
    bio,
    imageFile,
}: {
    accountId: string;
    bio: string;
    imageFile?: File | null;
}) {
    try {

        // Upload profile image if provided
        if (imageFile) {
            const processedImage = await processProfileImage(imageFile);

            const fileName = `profile.jpg`; // normalized name
            const filePath = `${accountId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("profiles")
                .upload(filePath, processedImage, { upsert: true });

            if (uploadError) throw uploadError;
        }

        // Update user info in the database
        const { data, error } = await supabase
            .from("users")
            .update({
                bio,
            })
            .eq("user_id", accountId)
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (err) {
        console.error("Error updating user:", err);
        throw err;
    }
}

export const signInAccount = async ({ email, password }: { email: string; password: string }) => {
    try {
        const session = await account.createEmailPasswordSession(email, password);
        console.log("Session created:", session);
        return { session };
    } catch (error) {
        console.error("Sign in error:", error);
        return { error };
    }
};



export async function signOutAccount() {
    try {
        const session = await account.deleteSession("current");
        return session;
    } catch (error) {
        console.log(error);
    }
}

export async function addFollow(followingId: string, followerId: string): Promise<IFollow | null> {
    const now = new Date();
    const isoString = now.toISOString();
    try {
        const { data, error } = await supabase
            .from("followers")
            .insert({
                following_id: followingId,
                follower_id: followerId,
                follow_date: isoString,
            });
        if (error) throw error;
        return data;
    }
    catch (error) {
        console.log(error);
        return null;
    }
}

export async function removeFollow(followingId: string, followerId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("followers")
            .delete()
            .eq("following_id", followingId)
            .eq("follower_id", followerId);
        if (error) throw error;
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function checkIfFollowing(followingId: string, followerId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase

            .from("followers")
            .select("*")
            .eq("following_id", followingId)
            .eq("follower_id", followerId);
        if (error) throw error;
        return data.length > 0;
    } catch (error) {
        console.log(error);
        return false;
    }
}


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

        console.log(songData);



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


export async function addReviewSong(songId: string, userId: string, reviewText: string) {
    const id = ID.unique();
    const now = new Date();
    const isoString = now.toISOString();
    try {

        const { data: review, error: addReview } = await supabase
            .from("reviews")
            .insert({
                review_id: id,
                song_id: songId,
                user_id: userId,
                review_type: "song",
                review_text: reviewText,
                created_at: isoString,
            })
            .select()
            .single();

        if (addReview) throw addReview;

        return review;
    } catch (error) {
        console.log(error);
        return null;
    }
}


export async function addReviewAlbum(albumId: string, userId: string, reviewText: string) {
    const id = ID.unique();
    const now = new Date();
    const isoString = now.toISOString();
    try {

        const { data: review, error: addReview } = await supabase
            .from("reviews")
            .insert({
                review_id: id,
                album_id: albumId,
                user_id: userId,
                review_type: "album",
                review_text: reviewText,
                created_at: isoString,
            })
            .select()
            .single();

        if (addReview) throw addReview;

        return review;
    } catch (error) {
        console.log(error);
        return null;
    }
}




export async function getUserById(userId: string): Promise<IUser | null> {
    try {

        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (userError) throw userError;
        if (!userData) throw new Error("User not found")


        const user: IUser = {
            accountId: userData.user_id,
            name: userData.name,
            username: userData.username,
            email: userData.email,
            imageUrl: await getProfileUrl(userId),
            bio: userData.bio
        };

        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return null;
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
            .select("*, creator:users(*)")
            .eq("song_id", songId)
            .order("created_at", { ascending: false });

        if (reviewError) throw reviewError;



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
                    creator: {
                        accountId: r.creator.user_id,
                        name: r.creator.name,
                        username: r.creator.username,
                        email: r.creator.email,
                        imageUrl: await getProfileUrl(r.creator.user_id),
                        bio: r.creator.bio ?? "",
                    },
                    song: songData,
                    likes: [],
                    createdAt: r.created_at,
                    updatedAt: r.created_at,
                }))
            ),
        };

        return song;
    } catch (error) {
        console.error("Failed to fetch song:", error);
        return null;
    }
}


export async function getArtistDetailsById(artistId: string): Promise<ArtistDetails | null> {
    try {
        // Fetch the Artist
        const { data: artistData, error: artistError } = await supabase
            .from("artists")
            .select("*, albums:artistalbum(album:albums(*))")
            .eq("artist_id", artistId)
            .single();

        if (artistError) throw artistError;
        if (!artistData) throw new Error("Artist not found");

        if (artistData.fully_loaded == false) return null;

        const artist: ArtistDetails = {
            artistId: artistData.artist_id,
            name: artistData.name,
            spotify_url: artistData.spotify_url,
            image_url: artistData.image_url,
            followers: artistData.followers,
            genres: [],
            albums: artistData.albums.map((a: any) => ({
                albumId: a.album.album_id,
                title: a.album.title,
                spotify_url: a.album.spotify_url,
                album_cover_url: a.album.album_cover_url,
                release_date: a.album.release_date,
                tracks: [],
                artists: []
            }))
        };

        console.log("fetched artist", artist)

        return artist;
    } catch (error) {
        console.error("Failed to fetch Artist:", error);
        return null;
    }
}


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
            .eq("album_id", albumId);


        if (songError) throw songError;
        if (!songData) throw new Error("No songs found");


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
            .select("*, creator:users(*)")
            .eq("album_id", albumId)
            .order("created_at", { ascending: false });

        if (reviewError) throw reviewError;

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
                spotify_url: s.spotify_url,
                album_cover_url: albumData.album_cover_url,
                release_date: albumData.release_date,
                popularity: s.pop
            })),
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
                        creator: {
                            accountId: r.creator.user_id,
                            name: r.creator.name,
                            username: r.creator.username,
                            email: r.creator.email,
                            imageUrl,
                            bio: r.creator.bio ?? ""
                        },
                        album: albumData,
                        likes: [],
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



// add song, album artist into the relevant tables depending if they are there or not 
export async function addSongToDatabase(song: SpotifySong) {
    try {
        // --- Check if song exists ---
        const { data: existingSong, error: selectSongError } = await supabase
            .from("songs")
            .select("*")
            .eq("song_id", song.songId)
            .single();

        if (selectSongError && selectSongError.code !== "PGRST116") {
            // PGRST116 = no rows found
            throw selectSongError;
        }

        // --- Insert album if it doesn't exist ---
        const { data: existingAlbum } = await supabase
            .from("albums")
            .select("*")
            .eq("album_id", song.album.id)
            .single();

        if (!existingAlbum) {
            const { error: albumError } = await supabase
                .from("albums")
                .insert([{
                    album_id: song.album.id,
                    title: song.album.name,
                    spotify_url: song.album.external_urls.spotify,
                    album_cover_url: song.album_cover_url,
                    release_date: normalizeReleaseDate(song.album.release_date),
                    total_tracks: song.album.total_tracks,
                }]);

            if (albumError) throw albumError;
        }

        // --- Insert song if it doesn't exist ---
        if (!existingSong) {
            const { error: songInsertError } = await supabase
                .from("songs")
                .insert([{
                    song_id: song.songId,
                    title: song.title,
                    album_id: song.album.id,
                    spotify_url: song.spotify_url,
                    pop: song.popularity,
                }]);
            if (songInsertError) throw songInsertError;
        }

        // --- Insert artists for song if they don't exist ---
        for (const artist of song.artists) {
            const { data: existingArtist } = await supabase
                .from("artists")
                .select("*")
                .eq("artist_id", artist.id)
                .single();

            if (!existingArtist) {
                const { error: artistError } = await supabase
                    .from("artists")
                    .insert([{
                        artist_id: artist.id,
                        name: artist.name,
                        spotify_url: artist.external_urls.spotify,
                    }]);
                if (artistError) throw artistError;
            }

            // --- Link song and artist ---
            const { data: existingLink } = await supabase
                .from("artistsongs")
                .select("*")
                .eq("song_id", song.songId)
                .eq("artist_id", artist.id)
                .single();

            if (!existingLink) {
                const { error: linkError } = await supabase
                    .from("artistsongs")
                    .insert([{ song_id: song.songId, artist_id: artist.id }]);
                if (linkError) throw linkError;
            }
        }



        return true;
    } catch (error) {
        console.error("Error adding song to database:", error);
        throw error;
    }
}

export async function addUpdateArtist(artist: SpotifyArtistDetailed) {
    try {
        // --- Check if song exists ---
        const { data: existingArtist } = await supabase
            .from("artists")
            .select("*")
            .eq("artist_id", artist.id)
            .single();



        if (!existingArtist) {
            const { error: insertError } = await supabase
                .from("artists")
                .insert([
                    {
                        artist_id: artist.id,
                        name: artist.name,
                        spotify_url: artist.external_urls.spotify,
                        fully_loaded: false,
                        image_url: artist.images?.[0]?.url ?? null,
                    },
                ]);

            if (insertError) throw insertError;
        } else if (existingArtist.fully_loaded == true) {
            return;
        } else {
            const { error: updateError } = await supabase
                .from("artists")
                .update({
                    name: artist.name,
                    spotify_url: artist.external_urls.spotify,
                    fully_loaded: true,
                    image_url: artist.images?.[0]?.url ?? null,
                })
                .eq("artist_id", artist.id);
            if (updateError) throw updateError;
        }

        // -- Add albums if not there 

        const { data: existingAlbums, error: fetchError } = await supabase
            .from("albums")
            .select("album_id, fully_loaded")
            .in("album_id", artist.albums.map(a => a.id));

        if (fetchError) throw fetchError;

        const existingMap = new Map(existingAlbums?.map(a => [a.album_id, a.fully_loaded]) ?? []);

        const albumInserts = artist.albums.map(a => {
            const isFullyLoaded = existingMap.get(a.id) === true;

            return {
                album_id: a.id,
                title: a.name,
                album_cover_url: a.images[0].url,
                release_date: normalizeReleaseDate(a.release_date),
                total_tracks: a.total_tracks,
                spotify_url: a.external_urls.spotify,
                // keep fully_loaded true if it already is
                fully_loaded: isFullyLoaded ? true : false
            };
        });

        const { error: addingAlbums } = await supabase.from("albums").upsert(albumInserts);

        if (addingAlbums) throw addingAlbums

        const albumArtistLinks = artist.albums.map(a =>
            ({ album_id: a.id, artist_id: artist.id })
        );

        await supabase
            .from("artistalbum")
            .upsert(albumArtistLinks);


        return true;
    } catch (error) {
        console.error("Error adding artist to database:", error);
        throw error;
    }
}


// add album without adding all tracks
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
                    fully_loaded: true
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
                    fully_loaded: true
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
        const songInserts = album.tracks.map(s => ({
            song_id: s.songId,
            title: s.title,
            album_id: album.id,
            spotify_url: s.spotify_url,
            pop: s.popularity
        }));

        await supabase
            .from("songs")
            .upsert(songInserts);

        // --- Link songs & artists ---
        const songArtistLinks = album.tracks.flatMap(s =>
            s.artists.map(a => ({
                song_id: s.songId,
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

        if (addListen) throw addListen;

    } catch (error) {
        console.log(error);
    }
}

export async function deleteRaitingSong(songId: string, userId: string) {
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


export async function getAllRatingsOfaSong(songId: string): Promise<Rating[]> {
    try {
        const { data: ratings } = await supabase
            .from("song_rating")
            .select("*")
            .eq("song_id", songId)

        if (!ratings) return [];


        return ratings;
    } catch (error) {
        console.error('Failed to fetch ratings:', error);
        return [];
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

        if (addListen) throw addListen;

    } catch (error) {
        console.log(error);
    }
}

export async function deleteRaitingAlbum(albumId: string, userId: string) {
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
        if (!ratings) return { counts: [], average: 0, total: 0 };

        // Initialize count map
        const counts = [1, 2, 3, 4, 5].map((r) => ({ rating: r, count: 0 }));

        // Count each rating
        ratings.forEach((r) => {
            if (r.rating >= 1 && r.rating <= 5) {
                counts[r.rating - 1].count++;
            }
        });

        // Total count
        const total = ratings.length;

        // Average rating
        const sum = counts.reduce((acc, c) => acc + c.rating * c.count, 0);
        const average = total > 0 ? sum / total : 0;

        return { counts, average, total };
    } catch (error) {
        console.error("Failed to fetch ratings:", error);
        return { counts: [], average: 0, total: 0 };
    }
}


export async function getListenedWithLimit(
    userId: string,
    limit: number
): Promise<Listened[]> {
    try {
        // fetch songs listened with join to albums
        const { data: songsListened, error: songsError } = await supabase
            .from("song_listens")
            .select(`
                listen_date,
                song_id,
                songs (
                    title,
                        albums:songs_album_id_fkey (
                            album_cover_url
                        )
                )
            `)
            .eq("user_id", userId);

        if (songsError) throw songsError;

        // fetch albums listened
        const { data: albumsListened, error: albumsError } = await supabase
            .from("album_listens")
            .select(`
        listen_date,
        album_id,
        albums (
          title,
          album_cover_url
        )
      `)
            .eq("user_id", userId);

        if (albumsError) throw albumsError;

        // normalize both into one array
        const combined: Listened[] = [
            ...(songsListened?.map((s: any) => ({
                type: "song" as const,
                id: s.song_id,
                name: s.songs?.title ?? "Unknown Song",
                album_cover_url: s.songs?.albums?.album_cover_url ?? null,
                listen_date: s.listen_date,
            })) ?? []),
            ...(albumsListened?.map((a: any) => ({
                type: "album" as const,
                id: a.album_id,
                name: a.albums?.title ?? "Unknown Album",
                album_cover_url: a.albums?.album_cover_url ?? null,
                listen_date: a.listen_date,
            })) ?? []),
        ];

        // sort DESC and apply limit
        return combined
            .sort(
                (a, b) =>
                    new Date(b.listen_date).getTime() -
                    new Date(a.listen_date).getTime()
            )
            .slice(0, limit);
    } catch (error) {
        console.error("Failed to fetch listened:", error);
        return [];
    }
}

// Fetch all (no limit)
export async function getListened(userId: string): Promise<Listened[]> {
    try {
        const { data: songsListened, error: songsError } = await supabase
            .from("song_listens")
            .select(`
        listen_date,
        song_id,
        songs (
          title,
          albums:songs_album_id_fkey (
            album_cover_url
          )
        )
      `)
            .eq("user_id", userId);

        if (songsError) throw songsError;

        const { data: albumsListened, error: albumsError } = await supabase
            .from("album_listens")
            .select(`
        listen_date,
        album_id,
        albums (
          title,
          album_cover_url
        )
      `)
            .eq("user_id", userId);

        if (albumsError) throw albumsError;

        const combined: Listened[] = [
            ...(songsListened?.map((s: any) => ({
                type: "song" as const,
                id: s.song_id,
                name: s.songs?.title ?? "Unknown Song",
                album_cover_url: s.songs?.albums?.album_cover_url ?? null,
                listen_date: s.listen_date,
            })) ?? []),
            ...(albumsListened?.map((a: any) => ({
                type: "album" as const,
                id: a.album_id,
                name: a.albums?.title ?? "Unknown Album",
                album_cover_url: a.albums?.album_cover_url ?? null,
                listen_date: a.listen_date,
            })) ?? []),
        ];

        return combined.sort(
            (a, b) =>
                new Date(b.listen_date).getTime() - new Date(a.listen_date).getTime()
        );
    } catch (error) {
        console.error("Failed to fetch listened:", error);
        return [];
    }
}

export async function getRatedWithLimit(userId: string, limit: number): Promise<RatingGeneral[]> {
    try {
        const { data: songsRated, error: songsError } = await supabase
            .from("song_rating")
            .select(`
        rating_date,
        song_id,
        songs (
          title,
          albums:songs_album_id_fkey (
            album_cover_url
          )
        )
      `)
            .eq("user_id", userId);

        if (songsError) throw songsError;

        const { data: albumsRated, error: albumsError } = await supabase
            .from("album_rating")
            .select(`
        rating_date,
        album_id,
        albums (
          title,
          album_cover_url
        )
      `)
            .eq("user_id", userId);

        if (albumsError) throw albumsError;

        const combined: RatingGeneral[] = [
            ...(songsRated.map((s: any) => ({
                type: "song" as const,
                id: s.song_id,
                rating: s.rating,
                title: s.songs?.title ?? "Unknown Song",
                album_cover_url: s.songs?.albums?.album_cover_url ?? null,
                rating_date: s.listen_date,
            })) ?? []),
            ...(albumsRated?.map((a: any) => ({
                type: "album" as const,
                id: a.album_id,
                rating: a.rating,
                title: a.albums?.title ?? "Unknown Album",
                album_cover_url: a.albums?.album_cover_url ?? null,
                rating_date: a.listen_date,
            })) ?? []),
        ];

        return combined.sort(
            (a, b) =>
                new Date(b.rating_date).getTime() - new Date(a.rating_date).getTime()
        ).slice(0, limit);
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return [];
    }
}

export async function getRated(userId: string): Promise<RatingGeneral[]> {
    try {
        const { data: songsRated, error: songsError } = await supabase
            .from("song_rating")
            .select(`
                rating,
                rating_date,
                song_id,
                songs (
                title,
                albums:songs_album_id_fkey (
                    album_cover_url
                )
                )
            `)
            .eq("user_id", userId);

        if (songsError) throw songsError;

        const { data: albumsRated, error: albumsError } = await supabase
            .from("album_rating")
            .select(`
                rating_date,
                rating,
                album_id,
                albums (
                    title,
                    album_cover_url
                )
            `)
            .eq("user_id", userId);

        if (albumsError) throw albumsError;

        const combined: RatingGeneral[] = [
            ...(songsRated.map((s: any) => ({
                type: "song" as const,
                id: s.song_id,
                rating: s.rating,
                title: s.songs?.title ?? "Unknown Song",
                album_cover_url: s.songs?.albums?.album_cover_url ?? null,
                rating_date: s.rating_date,
            })) ?? []),
            ...(albumsRated?.map((a: any) => ({
                type: "album" as const,
                id: a.album_id,
                rating: a.rating,
                title: a.albums?.title ?? "Unknown Album",
                album_cover_url: a.albums?.album_cover_url ?? null,
                rating_date: a.rating_date,
            })) ?? []),
        ];


        return combined.sort(
            (a, b) =>
                new Date(b.rating_date).getTime() - new Date(a.rating_date).getTime()
        );
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return [];
    }
}

export async function getReviewedWithLimit(userId: string, limit: number): Promise<Review[]> {
    try {


        const { data: reviews, error } = await supabase
            .from("reviews")
            .select(`
                review_id,
                review_text,
                song_id,
                album_id,
                created_at,
                user_id
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .range(0, limit - 1);
            
        if (error) throw error;
        if (!reviews) return [];




        const results = await Promise.all(
            reviews.map(async (r: any) => {
                let coverUrl = "";
                const reviewType: "song" | "album" = r.song_id ? "song" : "album";
                let name = "";

                if (r.album_id) {
                    const { data: album } = await supabase
                        .from("albums")
                        .select("*")
                        .eq("album_id", r.album_id)
                        .single();
                    coverUrl = album?.album_cover_url ?? "";
                    name = album?.title ?? "";
                } else if (r.song_id) {
                    const { data: song } = await supabase
                        .from("songs")
                        .select("*, album:albums(album_cover_url)")
                        .eq("song_id", r.song_id)
                        .single();
                    coverUrl = song?.album.album_cover_url ?? "";
                    name = song?.title ?? "";
                }

                return {
                    reviewId: r.review_id,
                    text: r.review_text,
                    id: r.song_id ?? r.album_id,
                    name: name,
                    userId: r.user_id,
                    type: reviewType,
                    createdAt: r.created_at,
                    album_cover_url: coverUrl,
                };
            })
        );
        return results;
    } catch (err) {
        console.error("Failed to fetch user reviews:", err);
        return [];
    }
}

export async function getReviewed(userId: string): Promise<Review[]> {
    try {
        const { data: reviews, error } = await supabase
            .from("reviews")
            .select(`
                review_id,
                review_text,
                song_id,
                album_id,
                created_at,
                user_id
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (error) throw error;
        if (!reviews) return [];




        const results = await Promise.all(
            reviews.map(async (r: any) => {
                let coverUrl = "";
                const reviewType: "song" | "album" = r.song_id ? "song" : "album";
                let name = "";

                if (r.album_id) {
                    const { data: album } = await supabase
                        .from("albums")
                        .select("*")
                        .eq("album_id", r.album_id)
                        .single();
                    coverUrl = album?.album_cover_url ?? "";
                    name = album?.title ?? "";
                } else if (r.song_id) {
                    const { data: song } = await supabase
                        .from("songs")
                        .select("*, album:albums(album_cover_url)")
                        .eq("song_id", r.song_id)
                        .single();
                    coverUrl = song?.album.album_cover_url ?? "";
                    name = song?.title ?? "";
                }

                return {
                    reviewId: r.review_id,
                    text: r.review_text,
                    id: r.song_id ?? r.album_id,
                    name: name,
                    userId: r.user_id,
                    type: reviewType,
                    createdAt: r.created_at,
                    album_cover_url: coverUrl,
                };
            })
        );
        return results;
    } catch (err) {
        console.error("Failed to fetch user reviews:", err);
        return [];
    }
}


export async function getLastWeekPopularSongs(): Promise<Song[]> {

    const cachedData = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.cacheDataCollectionID
    );

    const rawData = cachedData.documents[0]?.data;

    if (!rawData) {
        throw Error("no data found");
    }

    let topSongs: Song[] = [];

    try {
        topSongs = JSON.parse(rawData);
    } catch (error) {
        console.error("Failed to parse cached data:", error);
        throw new Error("Invalid cached data format.");
    }

    return topSongs.map((item) => ({
        songId: item.songId,
        title: item.title,
        album_cover_url: item.album_cover_url,
    })) as Song[];
}


// export async function getRecentFollowedActivities(userId: string, limit: number = 4): Promise<Activity[]> {
//     try {
//         // 1️⃣ Get list of followed user IDs
//         const { data: followed, error: followsError } = await supabase
//             .from("follows")
//             .select("followed_id")
//             .eq("follower_id", userId);

//         if (followsError) throw followsError;
//         if (!followed || followed.length === 0) return [];

//         const followedIds = followed.map(f => f.followed_id);

//         // 2️⃣ Fetch recent listens
//         const { data: listens } = await supabase
//             .from("listened")
//             .select(`
//         id,
//         user_id,
//         type,
//         song_id,
//         album_id,
//         listen_date,
//         song:songs(name, album_cover_url),
//         album:albums(name, album_cover_url),
//         user:users(username)
//       `)
//             .in("user_id", followedIds)
//             .order("listen_date", { ascending: false })
//             .limit(limit);

//         const listenActivities: Activity[] = (listens || []).map(l => ({
//             id: `listen-${l.id}`,
//             userId: l.user_id,
//             username: l.user.username,
//             type: "listen",
//             targetType: l.song_id ? "song" : "album",
//             targetId: l.song_id ?? l.album_id,
//             targetName: l.song_id ? l.song.name : l.album.name,
//             album_cover_url: l.song_id ? l.song.album_cover_url : l.album.album_cover_url,
//             date: l.listen_date,
//         }));

//         // 3️⃣ Fetch recent reviews
//         const { data: reviews } = await supabase
//             .from("reviews")
//             .select(`
//         review_id,
//         user_id,
//         text:review_text,
//         song_id,
//         album_id,
//         created_at,
//         song:songs(name, album_cover_url),
//         album:albums(name, album_cover_url),
//         user:users(username)
//       `)
//             .in("user_id", followedIds)
//             .order("created_at", { ascending: false })
//             .limit(limit);

//         const reviewActivities: Activity[] = (reviews || []).map(r => ({
//             id: `review-${r.review_id}`,
//             userId: r.user_id,
//             username: r.user.username,
//             type: "review",
//             targetType: r.song_id ? "song" : "album",
//             targetId: r.song_id ?? r.album_id,
//             targetName: r.song_id ? r.song.name : r.album.name,
//             album_cover_url: r.song_id ? r.song.album_cover_url : r.album.album_cover_url,
//             date: r.created_at,
//             text: r.text,
//         }));

//         // 4️⃣ Fetch recent ratings
//         const { data: ratings } = await supabase
//             .from("ratings")
//             .select(`
//         rating_id,
//         user_id,
//         rating,
//         song_id,
//         album_id,
//         created_at,
//         song:songs(name, album_cover_url),
//         album:albums(name, album_cover_url),
//         user:users(username)
//       `)
//             .in("user_id", followedIds)
//             .order("created_at", { ascending: false })
//             .limit(limit);

//         const ratingActivities: Activity[] = (ratings || []).map(r => ({
//             id: `rating-${r.rating_id}`,
//             userId: r.user_id,
//             username: r.user.username,
//             type: "rating",
//             targetType: r.song_id ? "song" : "album",
//             targetId: r.song_id ?? r.album_id,
//             targetName: r.song_id ? r.song.name : r.album.name,
//             album_cover_url: r.song_id ? r.song.album_cover_url : r.album.album_cover_url,
//             date: r.created_at,
//             rating: r.rating,
//         }));

//         // 5️⃣ Combine and sort by date descending
//         const combined: Activity[] = [...listenActivities, ...reviewActivities, ...ratingActivities]
//             .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
//             .slice(0, limit); // only top `limit`

//         return combined;

//     } catch (err) {
//         console.error("Failed to fetch recent followed activities:", err);
//         return [];
//     }
// }