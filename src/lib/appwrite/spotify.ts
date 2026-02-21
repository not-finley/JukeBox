import {SpotifyAlbumWithTracks, SpotifyTrack } from '@/types';

const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

export async function getSpotifyToken(): Promise<string> {
    const now = Date.now();

    // 1. Try to get existing token from storage
    const cachedToken = localStorage.getItem("spotify_token");
    const expiry = localStorage.getItem("spotify_token_expiry");

    // 2. If it exists and hasn't expired (with a 5-min safety buffer), use it!
    if (cachedToken && expiry && now < parseInt(expiry) - 300000) {
        return cachedToken;
    }

    // 3. Otherwise, fetch a new one
    try {
        const response = await fetch("/api/spotify-token");
        const data = await response.json();

        if (data && data.access_token) {
            // Calculate expiry: Current time + (3600 seconds * 1000)
            const expiresInMs = (data.expires_in || 3600) * 1000;
            const absoluteExpiry = now + expiresInMs;

            // 4. Save to storage for next time
            localStorage.setItem("spotify_token", data.access_token);
            localStorage.setItem("spotify_token_expiry", absoluteExpiry.toString());

            return data.access_token;
        }

        throw new Error("Token not found in response");
    } catch (error) {
        console.error("Token Error:", error);
        throw error;
    }
}

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

        // We use a slightly higher limit to allow for better filtering/sorting
        const response = await fetch(
            `${SPOTIFY_API_BASE_URL}/search?type=track,album,artist&q=${encodeURIComponent(query)}&limit=15`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await response.json();
        const results: any[] = [];

        // Helper to score results
        const getBaseScore = (name: string, type: string) => {
            const match = computeMatchScore(query.toLowerCase(), name.toLowerCase());
            
            // TIERED WEIGHTING:
            // 1.0 = Tracks (Users usually want the song first)
            // 0.9 = Albums
            // 0.8 = Artists (Prevents artists from drowning out songs)
            const typeWeight = type === 'track' ? 1.0 : type === 'album' ? 0.9 : 0.8;
            
            return match * typeWeight;
        };

        // Process Tracks
        data.tracks?.items?.forEach((track: any) => {
            results.push({
                type: "track",
                id: track.id,
                title: track.name,
                // Changed to image_url to match artists and UI expectations
                image_url: track.album?.images?.[0]?.url || "", 
                artists: track.artists?.map((a: any) => ({ id: a.id, name: a.name })),
                popularity: track.popularity || 0,
                matchScore: getBaseScore(track.name, 'track'),
            });
        });

        // Process Albums
        data.albums?.items?.forEach((album: any) => {
            results.push({
                type: "album",
                id: album.id,
                title: album.name,
                // Changed to image_url
                image_url: album.images?.[0]?.url || "", 
                artists: album.artists?.map((a: any) => ({ id: a.id, name: a.name })),
                matchScore: getBaseScore(album.name, 'album'),
            });
        });

        // Process Artists
        data.artists?.items?.forEach((artist: any) => {
            results.push({
                type: "artist",
                id: artist.id,
                name: artist.name,
                image_url: artist.images?.[0]?.url || "",
                popularity: artist.popularity || 0,
                matchScore: getBaseScore(artist.name, 'artist'),
            });
        });

        const unsorted = [...results];

        // FINAL SORTING LOGIC:
        // We prioritize Match Score heavily, but use Popularity as a tie-breaker.
        const sorted = results.sort((a, b) => {
            // If one is a significantly better text match, it wins
            if (Math.abs(b.matchScore - a.matchScore) > 0.1) {
                return b.matchScore - a.matchScore;
            }
            // Otherwise, let popularity decide (to show "The Weeknd" before a local artist)
            return (b.popularity || 0) - (a.popularity || 0);
        });

        // Return top 7 most relevant items (mixed types)
        return { sorted: sorted.slice(0, 7), unsorted };
    } catch (err) {
        console.error("Error in spotifySuggestions:", err);
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
                isrc: track.external_ids?.isrc || ""
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
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return null;
        const album: any = await response.json();

        // 1. Accumulate ALL track objects (handling pagination)
        let allTrackItems = [...album.tracks.items];
        let nextUrl = album.tracks.next;

        while (nextUrl) {
            const nextResponse = await fetch(nextUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!nextResponse.ok) break;
            const nextData = await nextResponse.json();
            allTrackItems = [...allTrackItems, ...nextData.items];
            nextUrl = nextData.next;
        }

        const allTrackIds = allTrackItems.map((t: any) => t.id);
        const fullTracks: SpotifyTrack[] = [];

        // 2. Fetch "Full Track Objects" in chunks of 50
        for (let i = 0; i < allTrackIds.length; i += 50) {
            const chunk = allTrackIds.slice(i, i + 50).join(',');
            const tracksResponse = await fetch(`${SPOTIFY_API_BASE_URL}/tracks?ids=${chunk}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (tracksResponse.ok) {
                const fullTracksData = await tracksResponse.json();
                const mappedTracks = fullTracksData.tracks.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    external_urls: { spotify: s.external_urls.spotify },
                    popularity: s.popularity ?? 0,
                    external_ids: { isrc: s.external_ids?.isrc || "" },
                    artists: s.artists.map((a: any) => ({
                        id: a.id,
                        name: a.name,
                        external_urls: a.external_urls,
                    })),
                }));
                fullTracks.push(...mappedTracks);
            }
        }

        // 3. Construct the final result with ALL tracks
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
                ...album.tracks,
                items: fullTracks,
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
): Promise<any[]> { // Change type to a partial AlbumDetails
    try {
        const albums: any[] = [];
        let nextUrl: string | null =
            `${SPOTIFY_API_BASE_URL}/artists/${artistId}/albums?include_groups=album,single&limit=50`;

        while (nextUrl) {
            const response : any = await fetch(nextUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.items?.length) albums.push(...data.items);
            nextUrl = data.next;
        }

        // Deduplicate and return ONLY the basic info
        return Array.from(new Map(albums.map(a => [a.id, a])).values()).map(full => ({
            albumId: full.id,
            title: full.name,
            spotify_url: full.external_urls?.spotify ?? "",
            album_cover_url: full.images?.[0]?.url ?? "",
            release_date: full.release_date,
            artists: full.artists,
            album_type: full.album_type,
            tracks: [], 
            isLoaded: false 
        }));
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}