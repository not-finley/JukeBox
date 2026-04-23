import { TrendingResponse, SongActivity, AlbumActivity, ReviewActivity } from "@/types";
import { supabase } from "@/lib/supabaseClient";

export async function getTrendingData(limit: number = 10): Promise<TrendingResponse> {
    try {
        const [songsRes, albumsRes, reviewsRes] = await Promise.all([
            supabase.from("trending_songs").select("*").order("play_count", { ascending: false }).limit(limit),
            supabase.from("trending_albums").select("*").order("play_count", { ascending: false }).limit(limit),
            supabase.from("trending_reviews").select("*").order("like_count", { ascending: false }).limit(limit)
        ]);

        return {
            topSongs: (songsRes.data || []).map(s => ({
                songId: s.song_id,
                title: s.song_title,
                albumCoverUrl: s.album_cover_url,
                playCount: s.play_count
            })),
            topAlbums: (albumsRes.data || []).map(a => ({
                albumId: a.album_id,
                title: a.album_title,
                albumCoverUrl: a.album_cover_url,
                playCount: a.play_count
            })),
            recentReviews: (reviewsRes.data || []).map(r => ({
                reviewId: r.review_id,
                userId: r.user_id,
                username: r.username,
                targetType: r.review_type as "song" | "album",
                targetId: r.review_type === "song" ? r.song_id : r.album_id,
                targetName: r.target_name,
                albumCoverUrl: r.album_cover_url,
                reviewText: r.review_text,
                createdAt: r.created_at,
                likeCount: r.like_count || 0,
            }))
        };
    } catch (err) {
        console.error(err);
        return { topSongs: [], topAlbums: [], recentReviews: [] };
    }
}

export async function getTrendingSongs( limit: number = 10) : Promise<SongActivity[]> {
    try {
        const songRes = await supabase.from("trending_songs").select("*").order("play_count", { ascending: false }).limit(limit);

        return (songRes.data || []).map(s => ({
            songId: s.song_id,
            title: s.song_title,
            albumCoverUrl: s.album_cover_url,
            playCount: s.play_count
        }));
    }
    catch (err) {
        console.error(err);
        return [];
    }
}

export async function getTrendingAlbums( limit: number = 10) : Promise<AlbumActivity[]> {
    try {
        const albumsRes = await supabase.from("trending_albums").select("*").order("play_count", { ascending: false }).limit(limit);

        return (albumsRes.data || []).map(a => ({
            albumId: a.album_id,
            title: a.album_title,
            albumCoverUrl: a.album_cover_url,
            playCount: a.play_count
        }));
    }
    catch (err) {
        console.error(err);
        return [];
    }
}

export async function getTrendingReviews( limit: number = 10) : Promise<ReviewActivity[]> {
    try {
        const reviewsRes = await supabase.from("trending_reviews").select("*").order("like_count", { ascending: false }).limit(limit);

        return  (reviewsRes.data || []).map(r => ({
            reviewId: r.review_id,
            userId: r.user_id,
            username: r.username,
            targetType: r.review_type as "song" | "album",
            targetId: r.review_type === "song" ? r.song_id : r.album_id,
            targetName: r.target_name,
            albumCoverUrl: r.album_cover_url,
            reviewText: r.review_text,
            createdAt: r.created_at,
            likeCount: r.like_count || 0,
        }));
    }
    catch (err) {
        console.error(err);
        return [];
    }
}
