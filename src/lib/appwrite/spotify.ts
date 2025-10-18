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

export async function searchSpotify(query: string, token: string) {
  try {
    const response = await fetch(
      `${SPOTIFY_API_BASE_URL}/search?type=track,album,artist&q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    // Tracks
    const tracks = data.tracks?.items?.map((track: any) => ({
      type: "track",
      id: track.id,
      title: track.name || "",
      album_cover_url: track.album?.images?.[0]?.url || "",
      spotify_url: track.external_urls?.spotify || "",
      album: track.album?.name || "",
      release_date: track.album?.release_date || "",
      popularity: track.popularity || 0,
      artists: track.artists?.map((a: any) => ({
        id: a.id,
        name: a.name,
      })) || [],
    })) || [];

    // Albums
    const albums = data.albums?.items?.map((album: any) => ({
      type: "album",
      id: album.id,
      title: album.name || "",
      album_cover_url: album.images?.[0]?.url || "",
      spotify_url: album.external_urls?.spotify || "",
      release_date: album.release_date || "",
      total_tracks: album.total_tracks || 0,
      artists: album.artists?.map((a: any) => ({
        id: a.id,
        name: a.name,
      })) || [],
    })) || [];

    // Artists
    const artists = data.artists?.items?.map((artist: any) => ({
      type: "artist",
      id: artist.id,
      name: artist.name || "",
      image_url: artist.images?.[0]?.url || "",
      spotify_url: artist.external_urls?.spotify || "",
      followers: artist.followers?.total || 0,
      genres: artist.genres || [],
    })) || [];

    // Combine & return
    return [...tracks, ...albums, ...artists];
  } catch (error) {
    console.error("Error searching Spotify:", error);
    return [];
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
      `${SPOTIFY_API_BASE_URL}/artists/${artistId}/albums?include_groups=album&limit=10`, 
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

export async function SpotifyAlbumById(albumbId: string, token: string) {
    try {
        const response = await fetch(
            `${SPOTIFY_API_BASE_URL}/albums/${albumbId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        const data = await response.json();
        if (data) {
            const album = data;
            
            return {
                id: album.id,
                name: album.name,
                album_type: album.album_type,
                href: album.href,
                external_urls: album.external_urls,
                images: album.images,
                release_date: album.release_date,
                release_date_precision: album.release_date_precision,
                total_tracks: album.total_tracks,
                type: album.type,
                uri: album.uri,                
                available_markets: album.available_markets,
                tracks: album.tracks.items.map((s:any) => ({
                    songId: s.id, 
                    title: s.name, 
                    spotify_url: s.external_urls.spotify, 
                    album_name: album.name, 
                    album_cover_url: album.images[0].url, 
                    album: album, 
                    artists: s.artists,
                    release_date: album.release_date, 
                    popularity: album.popularity 

                })),
                artists: album.artists
            };    
        }
        return null
    } catch (error) {
        console.error("Error searching song in Spotify:", error);
        return null
    }
}