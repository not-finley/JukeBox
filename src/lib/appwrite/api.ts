import { ID, Query } from 'appwrite';

import { INewUser, Song } from "@/types";
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
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.songsCollectionID,
            [
                Query.limit(limit),
                Query.offset((page - 1) * limit),
                Query.orderDesc("release_date"),
            ]
        );
        return response.documents as unknown as Song[];
    }
    catch (error) {
        console.log(error);
        return []
    }
}