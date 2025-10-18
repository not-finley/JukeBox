import { ID, Query } from 'appwrite';

import { AlbumDetails, ArtistDetails, INewUser, IUser, Listened, Rating, Review, Song, SongDetails, SpotifyAlbum, SpotifyAlbumWithTracks, SpotifyArtistDetailed, SpotifySong } from "@/types";
import { account, appwriteConfig, avatars, databases } from './config';
import { supabase } from "@/lib/supabaseClient";


async function getAccountIdbyUserId(userId: string): Promise<string> {
    const usersResult = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionID,
        [Query.equal("accountId", [userId])]
    );

    if (usersResult.total === 0) {
        console.warn(`No user document found for accountID: ${userId}`);
        return '';
    }

    return usersResult.documents[0].$id;
}



export async function createUserAccount(user: INewUser) {
    try {
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        );

        if (!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(user.name);

        const newUser = await saveUserToDB({
            accountId: newAccount.$id,
            name: newAccount.name,
            email: newAccount.email,
            username: user.username,
            imageUrl: new URL(avatarUrl),
        });

        return newUser;
    } catch (error) {
        console.log(error);
        return error;
    }
}

export async function saveUserToDB(user: {
    accountId: string;
    email: string;
    name: string;
    imageUrl: URL;
    username?: string;
}) {
    try {
        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionID,
            ID.unique(),
            user,
        )
        return newUser
    } catch (error) {
        console.log(error);
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

export async function getCurrentUser() {
    try {
        const currentAccount = await account.get();

        if (!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionID,
            [Query.equal('accountId', currentAccount.$id)]
        )

        if (!currentUser) throw Error;

        return currentUser.documents[0];
    } catch (error) {
        console.log(error);
    }
}

export async function signOutAccount() {
    try {
        const session = await account.deleteSession("current");
        return session;
    } catch (error) {
        console.log(error);
    }
}



export async function getSongById(songId: string): Promise<Song | null> {
    try {
        const songData = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.songsCollectionID,
            songId
        );

        if (!songData) {
            throw new Error('Song not found');
        }

        // Validate or map the returned songData to a Song type
        const song: Song = {
            songId: songData.songId,
            title: songData.title,
            album: songData.album,
            release_date: songData.release_date,
            spotify_url: songData.spotify_url,
            album_cover_url: songData.album_cover_url,
            popularity: songData.popularity
            // Add all required fields as per your Song interface
        };

        return song;
    } catch (error) {
        console.error('Failed to fetch song:', error);
        return null;
    }
}

export async function fetchSongs(page = 1, limit = 20): Promise<Song[]> {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.songsCollectionID,
            [
                Query.limit(limit),
                Query.offset((page - 1) * limit),
                Query.orderAsc("title")
            ]
        );
        return response.documents as unknown as Song[];
    }
    catch (error) {
        console.log(error);
        return []
    }
}


export async function addReview(songId: string, userId: string, reviewText: string) {
    const id = ID.unique();
    const date = Date.now();
    try {
        const userDocId = await getAccountIdbyUserId(userId);
        const review = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.reviewsCollectionID,
            id, // Auto-generate a unique document ID
            {
                reviewId: id,
                song: songId, // Reference to the song
                creator: userDocId, // User submitting the review
                text: reviewText, // Review text
                createdAt: date,
                updatedAt: date
            }
        );

        return review;
    } catch (error) {
        console.log(error);
        return null;
    }
}


export async function fetchReviews(songId: string, limit = 20): Promise<Review[]> {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.reviewsCollectionID,
            [
                Query.equal('song', songId),
                Query.limit(limit),
                Query.orderAsc("createdAt"),
            ]
        );
        return response.documents as unknown as Review[];
    }
    catch (error) {
        console.log(error);
        return []
    }
}


export async function getUserById(userId: string): Promise<IUser | null> {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionID,
            [Query.equal('accountId', userId)]
        );

        const userData = response.documents[0];

        if (!userData) {
            throw new Error('User not found');
        }

        const user: IUser = {
            accountId: userData.accountId,
            name: userData.name,
            username: userData.username,
            email: userData.email,
            imageUrl: userData.imageUrl, // or new URL(userData.imageUrl) if needed
            bio: userData.bio
            // Add all required fields as per your IUser interface
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


        const { data: albumData, error: albumError } = await supabase
            .from("albums")
            .select("*")
            .eq("album_id", songData.album_id)
            .single();

        if (albumError) throw albumError;
        if (!albumData) throw new Error("Album not found");

        const { data: artists, error: artistError } = await supabase
            .from("artistsongs")
            .select(`
        artist:artists(*)  
    `)
            .eq("song_id", songData.song_id);

        if (artistError) throw artistError;
        if (!artists || artists.length === 0) throw new Error("Artist(s) not found");

        // Extract the artist info
        const artistList = artists.map(a => a.artist);

        // Fetch related reviews
        const { data: reviews, error: reviewError } = await supabase
            .from("reviews")
            .select("*")
            .eq("song_id", songId)
            .order("created_at", { ascending: false });

        if (reviewError) throw reviewError;



        const song: SongDetails = {
            songId: songData.song_id,
            title: songData.title,
            album: albumData.title,
            album_id: albumData.album_id,
            release_date: albumData.release_date,
            spotify_url: songData.spotify_url,
            album_cover_url: albumData.album_cover_url,
            popularity: songData.popularity,
            review: reviews || [],
            ratings: [],
            artists: artistList
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
            .select("*")
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
            genres: []
        };

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

        const album: AlbumDetails = {
            albumId: albumData.album_id,
            title: albumData.title,
            spotify_url: albumData.spotify_url,
            album_cover_url: albumData.album_cover_url,
            release_date: albumData.release_date,
            tracks: songData.map(s => s),
            artists: artistList
        };

        return album;
    } catch (error) {
        console.error("Failed to fetch Album:", error);
        return null;
    }
}





export async function searchSongInDatabase(query: string) {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.songsCollectionID,
            [
                Query.search("title", query), // Full-text search
            ]
        );

        if (response.documents.length > 0) {
            // Prioritize exact match
            const exactMatch = response.documents.find(
                (doc) => doc.title.toLowerCase() === query.toLowerCase()
            );

            return exactMatch
                ? (exactMatch as unknown as Song)
                : (response.documents[0] as unknown as Song); // Return the first match as fallback
        }

        return null; // No matches found
    } catch (error) {
        console.error("Error searching for song in database:", error);
        return null;
    }
}


export async function getSearchSuggestions(query: string) {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.songsCollectionID,
            [
                Query.search("title", query), // Full-text search
            ]
        );

        if (response.documents.length > 0) {
            return response.documents as unknown as Song[]
        }

        return [];
    } catch (error) {
        console.error("Error searching for song in database:", error);
        return [];
    }
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
                    release_date: song.album.release_date,
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
        const { data: existingArtist, error: selectArtistError } = await supabase
            .from("artists")
            .select("*")
            .eq("artist_id", artist.id)
            .single();

        if (selectArtistError && selectArtistError.code !== "PGRST116") {
            // PGRST116 = no rows found
            throw selectArtistError;
        }



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



        return true;
    } catch (error) {
        console.error("Error adding artist to database:", error);
        throw error;
    }
}


// add album without adding all tracks
export async function addAlbumSimple(album: SpotifyAlbum) {
    try {

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
                    release_date: song.album.release_date,
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
                    release_date: album.release_date,
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
                    release_date: album.release_date,
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




export async function addListened(songId: string, userId: string) {
    const id = ID.unique();
    const date = Date.now();
    try {
        const userDocId = await getAccountIdbyUserId(userId);
        await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.listenedToCollectionID,
            id, // Auto-generate a unique document ID
            {
                listenedId: id,
                song: songId, // Reference to the song
                user: userDocId,
                createdAt: date,
            }
        );
    } catch (error) {
        console.log(error);
    }
}

export async function hasListened(userId: string, songId: string): Promise<Boolean> {
    try {

        const userDocId = await getAccountIdbyUserId(userId);

        const listened = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.listenedToCollectionID,
            [
                Query.equal("user", [userDocId]),
                Query.equal("song", [songId]),
            ]
        );
        if (listened.total === 0) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return false;
    }
}

export async function removeListened(songId: string, userId: string) {
    try {
        const userDocId = await getAccountIdbyUserId(userId);
        const listened = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.listenedToCollectionID,
            [
                Query.equal("user", [userDocId]),
                Query.equal("song", [songId]),
            ]
        );
        await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.listenedToCollectionID,
            listened.documents[0].$id
        )
    } catch (error) {
        console.error('Failed to delete listen:', error);
        return false;
    }
}


export async function addRating(songId: string, userId: string, rating: number) {
    const id = ID.unique();
    const date = Date.now();
    try {
        const userDocId = await getAccountIdbyUserId(userId);
        await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.raitingsCollectionID,
            id, // Auto-generate a unique document ID
            {
                ratingId: id,
                song: songId,
                user: userDocId,
                rating: rating,
                createdAt: date,
            }
        );
    } catch (error) {
        console.log(error);
    }
}

export async function hasRating(songId: string, userId: string,): Promise<Boolean> {
    try {
        const userDocId = await getAccountIdbyUserId(userId);
        const rating = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.raitingsCollectionID,
            [
                Query.equal("user", [userDocId]),
                Query.equal("song", [songId]),
            ]
        );
        if (rating.total === 0) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return false;
    }
}

export async function getRating(songId: string, userId: string): Promise<number> {
    try {
        const userDocId = await getAccountIdbyUserId(userId);
        const rating = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.raitingsCollectionID,
            [
                Query.equal("song", songId),
                Query.equal("user", userDocId),
            ]
        );
        if (rating.total === 0) {
            return 0;
        }

        return rating.documents[0].rating;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return 0;
    }
}

export async function updateRating(songId: string, userId: string, value: number) {
    try {
        const userDocId = await getAccountIdbyUserId(userId);
        const date = Date.now();
        const rating = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.raitingsCollectionID,
            [
                Query.equal("song", songId),
                Query.equal("user", userDocId),
            ]
        );

        await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.raitingsCollectionID,
            rating.documents[0].$id,
            {
                rating: value,
                createdAt: date
            }
        );
    } catch (error) {
        console.error('Failed to fetch raitings:', error);
    }
}

export async function getAllRatingsOfaSong(songId: string): Promise<Rating[]> {
    try {
        const listened = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.raitingsCollectionID,
            [
                Query.equal("song", [songId]),
            ]
        );
        if (listened.total === 0) {
            return [];
        }

        return listened.documents as unknown as Rating[];
    } catch (error) {
        console.error('Failed to fetch raitings:', error);
        return [];
    }
}



export async function getListenedWithLimit(userId: string, limit: number): Promise<Listened[]> {
    try {
        const userDocId = await getAccountIdbyUserId(userId);

        const listened = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.listenedToCollectionID,
            [
                Query.equal("user", [userDocId]),
                Query.limit(limit),
                Query.orderDesc('createdAt')
            ]
        );
        if (listened.total === 0) {
            return [];
        }

        return listened.documents as unknown as Listened[];
    } catch (error) {
        console.error('Failed to fetch listened:', error);
        return [];
    }
}

export async function getListened(userId: string): Promise<Listened[]> {
    try {
        const userDocId = await getAccountIdbyUserId(userId);

        const listened = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.listenedToCollectionID,
            [
                Query.equal("user", [userDocId]),
                Query.orderDesc('createdAt')
            ]
        );
        if (listened.total === 0) {
            return [];
        }

        return listened.documents as unknown as Listened[];
    } catch (error) {
        console.error('Failed to fetch listened:', error);
        return [];
    }
}

export async function getRatedWithLimit(userId: string, limit: number): Promise<Rating[]> {
    try {
        const userDocId = await getAccountIdbyUserId(userId);

        const listened = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.raitingsCollectionID,
            [
                Query.equal("user", [userDocId]),
                Query.limit(limit),
                Query.orderDesc('createdAt')
            ]
        );
        if (listened.total === 0) {
            return [];
        }

        return listened.documents as unknown as Rating[];
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return [];
    }
}

export async function getRated(userId: string): Promise<Rating[]> {
    try {
        const userDocId = await getAccountIdbyUserId(userId);

        const listened = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.raitingsCollectionID,
            [
                Query.equal("user", [userDocId]),
                Query.orderDesc('createdAt')
            ]
        );
        if (listened.total === 0) {
            return [];
        }

        return listened.documents as unknown as Rating[];
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return [];
    }
}

export async function getReviewedWithLimit(userId: string, limit: number): Promise<Review[]> {
    try {
        const userDocId = await getAccountIdbyUserId(userId);

        const listened = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.reviewsCollectionID,
            [
                Query.equal("creator", [userDocId]),
                Query.orderDesc('createdAt'),
                Query.limit(limit)
            ]
        );
        if (listened.total === 0) {
            return [];
        }

        return listened.documents as unknown as Review[];
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return [];
    }
}

export async function getReviewed(userId: string): Promise<Review[]> {
    try {
        const userDocId = await getAccountIdbyUserId(userId);

        // Step 2: Find reviews where the creator matches the user document ID
        const reviewsResult = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.reviewsCollectionID,
            [
                Query.equal("creator", [userDocId]),
                Query.orderDesc("createdAt"),
            ]
        );

        return reviewsResult.documents as unknown as Review[];
    } catch (error) {
        console.error("Failed to fetch user reviews:", error);
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