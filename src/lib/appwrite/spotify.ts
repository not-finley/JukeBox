import { AlbumDetails, SpotifyAlbum, SpotifyAlbumWithTracks, SongDetails, SpotifyTrack } from '@/types';

const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET as string;

function computeMatchScore(query: string, text: string): number {
    if (!text) return 0;

    const q = query.toLowerCase();
    const t = text.toLowerCase();

    // Exact match
    if (q === t) return 1000;

    // Starts with query
    if (t.startsWith(q)) return 600;

    // Contains query
    if (t.includes(q)) return 300;

    // Small similarity bonus for partial overlap
    let score = 0;
    const qWords = q.split(" ");
    qWords.forEach(w => {
        if (w.length > 2 && t.includes(w)) score += 50;
    });

    return score;
}

export async function getSpotifyToken(): Promise<string> {
    try {

        if (!clientId || !clientSecret) {
            console.log(clientId);
            console.log(clientSecret);
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

export async function searchSpotify(query: string, token: string): Promise<{ sorted: any[], unsorted: any[] }> {
    try {
        const response = await fetch(
            `${SPOTIFY_API_BASE_URL}/search?type=track,album,artist&q=${encodeURIComponent(query)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await response.json();
        const results: any[] = [];

        const scoreMatch = (title: string, artistNames: string[] = []) => {
            let score = computeMatchScore(query, title);
            artistNames.forEach(name => {
                score = Math.max(score, computeMatchScore(query, name));
            });
            return score;
        };

        // Tracks
        data.tracks?.items?.forEach((track: any) => {
            const artists = track.artists?.map((a: any) => ({ id: a.id, name: a.name })) || [];
            const matchScore = scoreMatch(track.name, artists.map((a: any) => a.name));

            results.push({
                type: "track",
                id: track.id,
                title: track.name || "",
                album_cover_url: track.album?.images?.[0]?.url || "",
                spotify_url: track.external_urls?.spotify || "",
                album: track.album?.name || "",
                release_date: track.album?.release_date || "",
                popularity: track.popularity || 0,
                artists,
                matchScore,
            });
        });

        // Albums
        data.albums?.items?.forEach((album: any) => {
            const artists = album.artists?.map((a: any) => ({ id: a.id, name: a.name })) || [];
            const matchScore = scoreMatch(album.name, artists.map((a: any) => a.name));

            results.push({
                type: "album",
                id: album.id,
                title: album.name || "",
                album_cover_url: album.images?.[0]?.url || "",
                spotify_url: album.external_urls?.spotify || "",
                release_date: album.release_date || "",
                total_tracks: album.total_tracks || 0,
                artists,
                popularity: album.popularity || 0,
                matchScore,
            });
        });

        // Artists
        data.artists?.items?.forEach((artist: any) => {
            const matchScore = scoreMatch(artist.name);

            results.push({
                type: "artist",
                id: artist.id,
                name: artist.name || "",
                image_url: artist.images?.[0]?.url || "",
                spotify_url: artist.external_urls?.spotify || "",
                followers: artist.followers?.total || 0,
                genres: artist.genres || [],
                popularity: artist.popularity || 0,
                matchScore,
            });
        });

        const unsorted = [...results];

        results.sort(
            (a, b) =>
                (b.matchScore * 0.9 + (b.popularity || 0) * 0.1) -
                (a.matchScore * 0.9 + (a.popularity || 0) * 0.1)
        );

        return { sorted: results, unsorted: unsorted };
    } catch (err) {
        console.error("Error searching Spotify:", err);
        return { sorted: [], unsorted: [] };
    }
}


export async function spotifySuggestions(query: string, token: string): Promise<{ sorted: any[], unsorted: any[] }> {
    try {
        if (!query) return { sorted: [], unsorted: [] };

        const formattedQuery = `${query}*`;

        const response = await fetch(
            `${SPOTIFY_API_BASE_URL}/search?type=track,album,artist&q=${encodeURIComponent(formattedQuery)}&limit=10`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await response.json();
        const results: any[] = [];

        const scoreMatch = (title: string, artistNames: string[] = []) => {
            let score = computeMatchScore(query, title);
            artistNames.forEach(name => {
                score = Math.max(score, computeMatchScore(query, name));
            });
            return score;
        };

        data.tracks?.items?.forEach((track: any) => {
            const artists = track.artists?.map((a: any) => ({ id: a.id, name: a.name })) || [];
            const matchScore = scoreMatch(track.name, artists.map((a: any) => a.name));

            results.push({
                type: "track",
                id: track.id,
                title: track.name,
                album_cover_url: track.album?.images?.[0]?.url || "",
                artists,
                matchScore,
            });
        });

        data.albums?.items?.forEach((album: any) => {
            const artists = album.artists?.map((a: any) => ({ id: a.id, name: a.name })) || [];
            const matchScore = scoreMatch(album.name, artists.map((a: any) => a.name));

            results.push({
                type: "album",
                id: album.id,
                title: album.name,
                album_cover_url: album.images?.[0]?.url || "",
                artists,
                matchScore,
            });
        });

        data.artists?.items?.forEach((artist: any) => {
            const matchScore = scoreMatch(artist.name);
            results.push({
                type: "artist",
                id: artist.id,
                name: artist.name,
                image_url: artist.images?.[0]?.url || "",
                matchScore,
            });
        });

        const unsorted = [...results];

        const isLikelyArtistSearch =
            results.some(r => r.type === "artist" && r.matchScore > 0.9);

        const filtered = isLikelyArtistSearch
            ? results.filter(r => r.type !== "track" && r.type !== "album") // hide songs
            : results;

        // sort after filtering
        filtered.sort((a, b) =>
            (b.matchScore * 0.9 + (b.popularity || 0) * 0.1) -
            (a.matchScore * 0.9 + (a.popularity || 0) * 0.1)
        );

        return { sorted: filtered, unsorted };
    } catch (err) {
        console.error("Error searching Spotify:", err);
        return { sorted: [], unsorted: [] };
    }
}

export async function SpotifyTrackById(songId: string, token: string) {
    try {
        const response = await fetch(
            `${SPOTIFY_API_BASE_URL}/tracks/${songId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        const data = await response.json();
        if (data) {
            const track = data;

            return {
                title: track.name,
                album_cover_url: track.album.images[0]?.url || "",
                songId: track.id,
                spotify_url: track.external_urls.spotify,
                album_name: track.album.name,
                album: track.album,
                release_date: track.album.release_date,
                popularity: track.popularity,
                artists: track.artists,
            };
        }
        return null
    } catch (error) {
        console.error("Error searching song in Spotify:", error);
        return null
    }
}

export async function SpotifyArtistById(artistId: string, token: string) {
    try {
        // Fetch artist details
        const response = await fetch(
            `${SPOTIFY_API_BASE_URL}/artists/${artistId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        // Fetch top tracks
        const albumsResponse = await fetch(
            `${SPOTIFY_API_BASE_URL}/artists/${artistId}/albums?include_groups=album&limit=5`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        const data = await response.json();
        const albumsData = await albumsResponse.json();

        console.log(albumsData.items)

        if (data) {
            const artist = data;

            return {
                id: artist.id,
                name: artist.name,
                followers: artist.followers,
                genres: artist.genres,
                external_urls: artist.external_urls,
                images: artist.images,
                albums: albumsData.items
            };
        }

        return null;
    } catch (error) {
        console.error("Error fetching artist from Spotify:", error);
        return null;
    }
}


export async function SpotifyAlbumById(
    albumId: string,
    token: string
): Promise<SpotifyAlbumWithTracks | null> {
    try {
        const response = await fetch(`${SPOTIFY_API_BASE_URL}/albums/${albumId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("Spotify API error:", response.status, response.statusText);
            return null;
        }

        const album: any = await response.json();

        // Spotify tracks come in a paging object
        const tracksPaging = album.tracks ?? { items: [], total: 0, limit: 50, next: null, offset: 0, href: "" };

        // Map tracks to SpotifyTrack shape
        const tracks: SpotifyTrack[] = tracksPaging.items.map((s: any) => ({
            id: s.id,
            name: s.name,
            external_urls: { spotify: s.external_urls.spotify },
            popularity: s.popularity ?? 0,
            artists: s.artists.map((a: any) => ({
                id: a.id,
                name: a.name,
                external_urls: a.external_urls,
            })),
        }));

        // Return SpotifyAlbumWithTracks type
        const result: SpotifyAlbumWithTracks = {
            id: album.id,
            name: album.name,
            album_type: album.album_type,
            external_urls: album.external_urls,
            images: album.images ?? [],
            release_date: album.release_date,
            total_tracks: album.total_tracks,
            artists: album.artists.map((a: any) => ({
                id: a.id,
                name: a.name,
                external_urls: a.external_urls,
            })),
            tracks: {
                ...tracksPaging,
                items: tracks,
            },
        };

        return result;
    } catch (error) {
        console.error("Error fetching album from Spotify:", error);
        return null;
    }
}


export async function getArtistDiscographyFromSpotify(
    artistId: string,
    token: string
): Promise<AlbumDetails[]> {
    try {
        const albums: SpotifyAlbum[] = [];
        let nextUrl: string | null =
            `${SPOTIFY_API_BASE_URL}/artists/${artistId}/albums?include_groups=album,single&limit=50`;

        // --- Fetch paginated album list ---
        while (nextUrl) {
            const response: any = await fetch(nextUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();

            if (data.items?.length) {
                albums.push(...data.items);
            }

            nextUrl = data.next;
        }

        // --- Deduplicate by ID ---
        const uniqueAlbums = Array.from(new Map(
            albums.map(a => [a.id, a])
        ).values());

        const albumDetails: AlbumDetails[] = [];

        // --- Fetch full album info + tracks ---
        for (const album of uniqueAlbums) {
            const resp = await fetch(`${SPOTIFY_API_BASE_URL}/albums/${album.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const full: SpotifyAlbumWithTracks = await resp.json();

            // ✅ tracks always in full.tracks.items
            const trackItems = full.tracks?.items ?? [];

            const formattedTracks: SongDetails[] = trackItems.map((track) => ({
                songId: track.id,
                title: track.name,
                album: full.name,
                album_id: full.id,
                album_cover_url: full.images?.[0]?.url ?? "",
                release_date: full.release_date,
                popularity: track.popularity ?? 0,
                reviews: [],
                ratings: [],
                artists: track.artists,
                spotify_url: track.external_urls?.spotify ?? "",
            }));

            albumDetails.push({
                albumId: full.id,
                title: full.name,
                spotify_url: full.external_urls?.spotify ?? "",
                album_cover_url: full.images?.[0]?.url ?? "",
                release_date: full.release_date,
                artists: full.artists,
                tracks: formattedTracks,
                reviews: [],
                album_type: full.album_type,
            });
        }

        return albumDetails;
    } catch (error) {
        console.error("Error fetching full discography:", error);
        return [];
    }
}