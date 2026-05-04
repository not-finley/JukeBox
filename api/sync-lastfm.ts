import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const normalizeReleaseDate = (date: string) => {
    if (!date) return null;
    if (date.length === 4) return `${date}-01-01`;
    if (date.length === 7) return `${date}-01`;
    return date;
};

const getSpotifyToken = async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Missing Spotify Credentials");
    }

    const auth = btoa(`${clientId}:${clientSecret}`);
    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { 
            "Content-Type": "application/x-www-form-urlencoded", 
            Authorization: `Basic ${auth}` 
        },
        body: "grant_type=client_credentials",
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Spotify Auth Failed: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    return data.access_token;
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    const { lastfmUsername, userId } = req.body;
    const token = await getSpotifyToken();

    const lastfmRes = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUsername}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=50`);
    const data = await lastfmRes.json();
    const tracks = data.recenttracks.track.filter((t: any) => t.date);

    const songListensToInsert : any = [];
    const newAlbums = new Map();
    const newSongs = new Map();
    const newArtists = new Map();
    const newArtistSongs = new Map();

    const chunk = tracks.slice(0, 25); 

    await Promise.all(chunk.map(async (track: any) => {
        const trackName = track.name;
        const artistName = track.artist['#text'];
        const listenDate = new Date(parseInt(track.date.uts) * 1000).toISOString();

        // 1. Quick local check
        const { data: matchedSong } = await supabase
            .from('songs')
            .select(`
                song_id,
                artistsongs!inner (
                    artists!inner (
                        name
                    )
                )
            `)
            .ilike('title', trackName)
            .ilike('artistsongs.artists.name', artistName)
            .limit(1)
            .maybeSingle();

        let songId = matchedSong?.song_id;

        // 2. Spotify Search if necessary
        if (!songId) {
            const query = encodeURIComponent(`track:${trackName} artist:${artistName}`);
            const spotRes = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const spotData = await spotRes.json();
            const spotTrack = spotData.tracks?.items[0];

           if (spotTrack) {
            songId = spotTrack.id;

            // 1. Full Album Metadata
            newAlbums.set(spotTrack.album.id, {
                album_id: spotTrack.album.id,
                title: spotTrack.album.name,
                spotify_url: spotTrack.album.external_urls.spotify,
                album_cover_url: spotTrack.album.images[0]?.url,
                release_date: normalizeReleaseDate(spotTrack.album.release_date),
                total_tracks: spotTrack.album.total_tracks,
            });

            // 2. Full Song Metadata
            newSongs.set(spotTrack.id, {
                song_id: spotTrack.id,
                title: spotTrack.name,
                album_id: spotTrack.album.id,
                spotify_url: spotTrack.external_urls.spotify,
                pop: spotTrack.popularity, // Matching your 'pop' column name
                isrc: spotTrack.external_ids?.isrc,
            });

            // 3. Artist Mapping
            spotTrack.artists.forEach((artist: any) => {
                newArtists.set(artist.id, {
                    artist_id: artist.id,
                    name: artist.name,
                    spotify_url: artist.external_urls.spotify
                });
                
                newArtistSongs.set(`${spotTrack.id}-${artist.id}`, {
                    song_id: spotTrack.id,
                    artist_id: artist.id
                });
            });
        }
        }

        if (songId) {
            songListensToInsert.push({
                user_id: userId,
                song_id: songId,
                listen_date: listenDate
            });
        }
    }));

    // 3. BULK UPSERT - This is where you gain all your speed
    if (newArtists.size > 0) await supabase.from('artists').upsert(Array.from(newArtists.values()));
    if (newAlbums.size > 0) await supabase.from('albums').upsert(Array.from(newAlbums.values()));
    if (newSongs.size > 0) await supabase.from('songs').upsert(Array.from(newSongs.values()));
    if (newArtistSongs.size > 0) await supabase.from('artistsongs').upsert(Array.from(newArtistSongs.values()));

    if (songListensToInsert.length > 0) {
        await supabase.from('song_listens').upsert(songListensToInsert, { 
            onConflict: 'user_id, song_id, listen_date' 
        });
    }

    return res.status(200).json({ message: "Sync complete", count: songListensToInsert.length });
};

export default handler;