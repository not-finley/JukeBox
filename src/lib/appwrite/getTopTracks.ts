import axios from "axios";
import { addsong } from "./api_Lastfm.js";

const LASTFM_API_KEY = '4ea4422229f3280c60bbb90b6102a153';
const LASTFM_URL = "http://ws.audioscrobbler.com/2.0/";


const fetchTopSongs = async () => {
    try {
        const response = await axios.get(LASTFM_URL, {
            params: {
                method: "chart.gettoptracks",
                api_key: LASTFM_API_KEY,
                format: "json",
                limit: 100
            },
        });
        return response.data.tracks.track
    } catch (error) {
        console.log(error);
        throw error;
    }
};


export const populateSongs = async () => {
    try {
        console.log("Fetching top songs from Last.fm ...");
        const topSongs = await fetchTopSongs();

        console.log(`Fetched ${topSongs.length} songs. Populating database...`);

        for (const track of topSongs) {
            const songData = {
                songId: track.mbid || track.url.split("/").pop(),
                title: track.name,
                album: null,
                coverUrl: track.image?.pop()?.["#text"] || "",
                created_at: new Date().toISOString(),
            }

            try {
                const result = await addsong(songData);
                console.log(`✅ Added song: ${songData.title}`);
            } catch (err) {
                console.log(`❌ failed to add song: ${songData.title}`);
            }
        }
        console.log("Database population complete!");
    } catch (err) {
        console.log("An error occured")
    }
}
