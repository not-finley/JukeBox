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

// export async function addsong(song : SpotifyTrack) {
//     const formattedSong: AppwriteSong = {
//         songId: song.id,
//         title: song.name,
//         album: song.album.name,
//         coverUrl: song.album.images[0]?.url || '',
//         created_at: new Date().toISOString(),
//         artist: song.artists.map((artist) => artist.name).join(', '),
//     };
//     try {
//         await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.songsCollectionID,
//             ID.unique(),
//             formattedSong
//         )
//         console.log(`Added song: ${formattedSong.title}`)
//     } catch (error) {
//         console.log(error);
//         return error;
//     }
// }


// export async function getSongById(songId: string) {
//     try {
//         const song = await databases.getDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.songsCollectionID,
//             songId
//         );

//         if (!song) throw Error;

//         return song;
//     } catch (error) {
//         console.log(error);
//     }
// }

export async function fetchSongs(page = 1, limit = 20): Promise<Song[]> {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.songsCollectionID,
            [
                Query.limit(limit),
                Query.offset((page - 1) * limit),
                Query.orderAsc("release_date"),
            ]
        );
        return response.documents as unknown as Song[];
    }
    catch (error) {
        console.log(error);
        return []
    }
}