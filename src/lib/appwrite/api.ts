import { ID, Query } from 'appwrite';

import { INewUser, IUser, Review, Song, SongDeatils } from "@/types";
import { account, appwriteConfig, avatars, databases } from './config';

export async function createUserAccount(user: INewUser) {
    try{
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        );

        if(!newAccount) throw Error;

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

export async function signInAccount(user: { email: string; password: string;}) {
    try {
        const session = await account.createEmailPasswordSession(user.email, user.password);

        return session;
    } catch (error) {
        console.log(error);
    }
}

export async function getCurrentUser() {
    try {
        const currentAccount = await account.get();

        if (!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionID,
            [Query.equal('accountId', currentAccount.$id)]
        )
        
        if(!currentUser) throw Error;
        
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
        console.log("a")
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.songsCollectionID,
            [
                Query.limit(limit),
                Query.offset((page - 1) * limit),
                Query.orderAsc("title")
            ]
        );
        console.log("here")
        return response.documents as unknown as Song[];
    }
    catch (error) {
        console.log(error);
        return []
    }
}


export async function addReview(songId : string, userId : string, reviewText : string) {
    const id = ID.unique();
    const date = Date.now();
    try {
      const review = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.reviewsCollectionID,
        id, // Auto-generate a unique document ID
        {
          reviewId: id,
          song: songId, // Reference to the song
          creator: userId, // User submitting the review
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


  export async function fetchReviews(songId : string, limit = 20): Promise<Review[]> {
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
        const userData = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionID,
            userId
        );

        if (!userData) {
            throw new Error('User not found');
        }

        // Validate or map the returned songData to a Song type
        const user: IUser = {
            accountId: userData.accountId,
            name: userData.name,
            username: userData.username,
            email: userData.email,
            imageUrl: userData.imageUrl,
            bio: userData.bio
            // Add all required fields as per your Song interface
        };

        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return null;
    }
}

export async function getSongDetailsById(songId: string): Promise<SongDeatils | null> {
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
        const song: SongDeatils = {
            songId: songData.songId,
            title: songData.title,
            album: songData.album,
            release_date: songData.release_date,
            spotify_url: songData.spotify_url,
            album_cover_url: songData.album_cover_url,
            popularity: songData.popularity,
            review: songData.review,
            ratings: songData.ratings
        };

        return song;
    } catch (error) {
        console.error('Failed to fetch song:', error);
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

export async function addSongToDatabase(song : Song) {
    try {
        const response = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.songsCollectionID,
            song.songId,
            song
        );
        return response;
    } catch (error) {
        console.error("Error adding song to database:", error);
        throw error;
    }
}


