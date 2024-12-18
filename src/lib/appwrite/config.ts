import { Client, Account, Databases, Storage, Avatars } from 'appwrite'

export const appwriteConfig = {
    url: import.meta.env.VITE_APPWRITE_URL,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    storageID: import.meta.env.VITE_APPWRITE_STORAGE_ID,

    songsCollectionID: import.meta.env.VITE_APPWRITE_SONGS_ID,
    listenedToCollectionID: import.meta.env.VITE_APPWRITE_LISTENEDTO_ID,
    raitingsCollectionID: import.meta.env.VITE_APPWRITE_RATINGS_ID,
    usersCollectionID: import.meta.env.VITE_APPWRITE_USERS_ID,
    reviewsCollectionID: import.meta.env.VITE_APPWRITE_REVIEWS_ID,
    artistsCollectionID: import.meta.env.VITE_APPWRITE_ARTISTS_ID
}

export const client = new Client();

client.setProject(appwriteConfig.projectId);
client.setEndpoint(appwriteConfig.url);


export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);