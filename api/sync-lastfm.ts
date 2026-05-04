import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const getSpotifyToken = async () => {
    const auth = btoa(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`);
    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${auth}` },
        body: "grant_type=client_credentials",
    });
    return (await res.json()).access_token;
};

const handler = async (req: any, res: any) => {
    const { lastfmUsername, userId } = req.body;
    const token = await getSpotifyToken();

    const lastfmRes = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUsername}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=50`);
    const data = await lastfmRes.json();
    const tracks = data.recenttracks.track.filter((t: any) => t.date);

    for (const track of tracks) {
        const trackName = track.name;
        const artistName = track.artist['#text'];
        const albumName = track.album['#text'];
        const listenDate = new Date(parseInt(track.date.uts) * 1000).toISOString();

        // 2. Check if we already have this song in our DB (by name/artist)
        let { data: existingSong } = await supabase
            .from('songs')
            .select('song_id, album_id')
            .ilike('title', trackName)
            .limit(1)
            .maybeSingle();

        let songId = existingSong?.song_id;

        // 3. If not in DB, Search Spotify
        if (!songId) {
            const query = encodeURIComponent(`track:${trackName} artist:${artistName}`);
            const spotRes = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const spotData = await spotRes.json();
            const spotTrack = spotData.tracks?.items[0];

            if (spotTrack) {
                songId = spotTrack.id;
                await supabase.from('albums').upsert({
                    album_id: spotTrack.album.id,
                    title: spotTrack.album.name,
                    album_cover_url: spotTrack.album.images[0]?.url,
                });
                await supabase.from('songs').upsert({
                    song_id: spotTrack.id,
                    album_id: spotTrack.album.id,
                    title: spotTrack.name,
                });
            }
        }
        if (songId) {
            await supabase.from('song_listens').upsert({
                user_id: userId,
                song_id: songId,
                listen_date: listenDate
            }, { onConflict: 'user_id, song_id, listen_date' });
        }
    }

    return res.status(200).json({ message: "Sync complete" });
};