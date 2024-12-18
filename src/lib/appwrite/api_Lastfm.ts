import { ID } from 'appwrite';
import { appwriteConfig, databases } from './config';


export async function addsong(song : {
    songId: string;
    title: string;
    album: string,
    coverUrl: string,
    created_at: string,
}) {
    try {
        const newSong = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.songsCollectionID,
            ID.unique(),
            song
        )
        return newSong
    } catch (error) {
        console.log(error);
        return error;
    }
}