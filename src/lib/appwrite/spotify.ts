import { Song } from "@/types";

const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

export async function getSpotifyToken(): Promise<string> {
    try {
        const clientId = '4d487e3a0dd4402794ac7b79f866b0b4'//import.meta.env.SPOTIFY_CLIENT_ID;
        const clientSecret = 'f5c0403f37e24ed0a7ef739184c0a6e8'//import.meta.env.SPOTIFY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error("Missing Spotify client ID or secret in environment variables.");
        }

        const credentials = `${clientId}:${clientSecret}`;
        const encodedCredentials = btoa(credentials); // Base64 encoding

        const response = await fetch(SPOTIFY_TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${encodedCredentials}`,
            },
            body: "grant_type=client_credentials",
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
            return data.access_token; // Return the token
        } else {
            console.error("Failed to fetch Spotify token:", data);
            throw new Error(data.error || "Failed to fetch Spotify token");
        }
    } catch (error) {
        console.error("Error fetching Spotify token:", error);
        throw error;
    }
}


export async function searchSongInSpotify(query: string, token: string) {
    try {
        const response = await fetch(
            `${SPOTIFY_API_BASE_URL}/search?type=track&q=${encodeURIComponent(query)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        const data = await response.json();
        if (data.tracks.items.length > 0) {
            const track = data.tracks.items[0];
            return {
                title: track.name,
                album_cover_url: track.album.images[0]?.url || "",
                songId: track.id,
                spotify_url: track.external_urls.spotify,
                album: track.album.name,
                release_date: track.album.release_date,
                popularity: track.popularity
            };
        }
        return null;
    } catch (error) {
        console.error("Error searching song in Spotify:", error);
        return null;
    }
}

export async function searchSongsInSpotify(query: string, token: string) {
    try {
        const response = await fetch(
            `${SPOTIFY_API_BASE_URL}/search?type=track&q=${encodeURIComponent(query)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        const data = await response.json();
        if (data.tracks.items.length > 0) {
            const tracks = data.tracks.items.map((track: any) => ({
                title: track.name || "",
                album_cover_url: track.album?.images?.[0]?.url || "",
                songId: track.id || "",
                spotify_url: track.external_urls.spotify || "",
                album: track.album?.name || "",
                release_date: track.album?.release_date || "",
                popularity: track.popularity || 0
            }));
            return tracks;
        }
        return [];
    } catch (error) {
        console.error("Error searching song in Spotify:", error);
        return [];
    }
}