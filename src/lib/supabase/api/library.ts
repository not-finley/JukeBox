import { Listened, RatingGeneral, Review } from "@/types";
import { supabase } from "@/lib/supabaseClient";

export async function getListenedWithLimit(
    userId: string, 
    limit: number, 
    offset: number,
    sortBy: "newest" | "oldest" = "newest",
    filterType: "all" | "song" | "album" = "all",
    searchQuery: string = ""
): Promise<Listened[]> {
    try {
        // 1. Simple query to the enhanced view
        let query = supabase
            .from("user_history_view")
            .select("*")
            .eq("user_id", userId);

        // 2. Optional: Search by name
        if (searchQuery) {
            query = query.ilike("name", `%${searchQuery}%`);
        }

        // 3. Media Type Filtering
        if (filterType !== "all") {
            query = query.eq("type", filterType);
        }

        // 4. Chronological Ordering
        query = query.order("listen_date", { ascending: sortBy === "oldest" });

        // 5. Server-side Pagination
        const { data: history, error } = await query.range(offset, offset + limit - 1);

        if (error) throw error;

        // 6. Instant Mapping
        return (history || []).map((h: any) => ({
            type: h.type,
            id: h.item_id,
            name: h.name ?? "Unknown",
            album_cover_url: h.album_cover_url,
            listen_date: h.listen_date,
            createdAt: h.listen_date 
        }));

    } catch (error) {
        console.error("Failed to fetch listened history:", error);
        return [];
    }
}

// Fetch all (no limit)
export async function getListened(userId: string): Promise<Listened[]> {
    try {
        const { data: songsListened, error: songsError } = await supabase
            .from("song_listens")
            .select(`
        listen_date,
        song_id,
        songs (
          title,
          albums:songs_album_id_fkey (
            album_cover_url
          )
        )
      `)
            .eq("user_id", userId);

        if (songsError) throw songsError;

        const { data: albumsListened, error: albumsError } = await supabase
            .from("album_listens")
            .select(`
        listen_date,
        album_id,
        albums (
          title,
          album_cover_url
        )
      `)
            .eq("user_id", userId);

        if (albumsError) throw albumsError;

        const combined: Listened[] = [
            ...(songsListened?.map((s: any) => ({
                type: "song" as const,
                id: s.song_id,
                name: s.songs?.title ?? "Unknown Song",
                album_cover_url: s.songs?.albums?.album_cover_url ?? null,
                listen_date: s.listen_date,
            })) ?? []),
            ...(albumsListened?.map((a: any) => ({
                type: "album" as const,
                id: a.album_id,
                name: a.albums?.title ?? "Unknown Album",
                album_cover_url: a.albums?.album_cover_url ?? null,
                listen_date: a.listen_date,
            })) ?? []),
        ];

        return combined.sort(
            (a, b) =>
                new Date(b.listen_date).getTime() - new Date(a.listen_date).getTime()
        );
    } catch (error) {
        console.error("Failed to fetch listened:", error);
        return [];
    }
}

export async function getRatedWithLimit(
    userId: string, 
    limit: number, 
    offset: number,
    sortBy: "newest" | "oldest" | "rating" = "newest",
    filterType: "all" | "song" | "album" = "all",
    searchQuery: string = ""
): Promise<RatingGeneral[]> {
    try {
        let query = supabase
            .from("user_ratings_view")
            .select("*") // Everything is already flattened in the view
            .eq("user_id", userId);

        // 1. Search Logic
        if (searchQuery) {
            query = query.ilike("title", `%${searchQuery}%`);
        }

        // 2. Media Filter
        if (filterType !== "all") {
            query = query.eq("type", filterType);
        }

        // 3. Ordering
        if (sortBy === "oldest") {
            query = query.order("rating_date", { ascending: true });
        } else if (sortBy === "rating") {
            query = query.order("rating", { ascending: false });
        } else {
            query = query.order("rating_date", { ascending: false });
        }

        const { data: ratings, error } = await query.range(offset, offset + limit - 1);

        if (error) throw error;

        // No more async maps! Just return the data.
        return (ratings || []).map((r: any) => ({
            type: r.type,
            id: r.item_id,
            rating: r.rating,
            title: r.title ?? "Unknown",
            album_cover_url: r.album_cover_url,
            rating_date: r.rating_date,
            createdAt: r.rating_date
        }));

    } catch (error) {
        console.error('Failed to fetch ratings:', error);
        return [];
    }
}

export async function getRated(userId: string): Promise<RatingGeneral[]> {
    try {
        const { data: songsRated, error: songsError } = await supabase
            .from("song_rating")
            .select(`
                rating,
                rating_date,
                song_id,
                songs (
                title,
                albums:songs_album_id_fkey (
                    album_cover_url
                )
                )
            `)
            .eq("user_id", userId);

        if (songsError) throw songsError;

        const { data: albumsRated, error: albumsError } = await supabase
            .from("album_rating")
            .select(`
                rating_date,
                rating,
                album_id,
                albums (
                    title,
                    album_cover_url
                )
            `)
            .eq("user_id", userId);

        if (albumsError) throw albumsError;

        const combined: RatingGeneral[] = [
            ...(songsRated.map((s: any) => ({
                type: "song" as const,
                id: s.song_id,
                rating: s.rating,
                title: s.songs?.title ?? "Unknown Song",
                album_cover_url: s.songs?.albums?.album_cover_url ?? null,
                rating_date: s.rating_date,
            })) ?? []),
            ...(albumsRated?.map((a: any) => ({
                type: "album" as const,
                id: a.album_id,
                rating: a.rating,
                title: a.albums?.title ?? "Unknown Album",
                album_cover_url: a.albums?.album_cover_url ?? null,
                rating_date: a.rating_date,
            })) ?? []),
        ];


        return combined.sort(
            (a, b) =>
                new Date(b.rating_date).getTime() - new Date(a.rating_date).getTime()
        );
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return [];
    }
}

export async function getReviewedWithLimit(
    userId: string, 
    limit: number, 
    offset: number,
    sortBy: "newest" | "oldest" | "rating" = "newest", 
    filterType: "all" | "song" | "album" = "all" ,
    searchQuery: string = ""    
): Promise<Review[]> {
    try {
        // 1. Query the VIEW instead of the TABLE
        let query = supabase
            .from("searchable_reviews")
            .select(`
                *,
                reviewlikes(count)
            `)
            .eq("user_id", userId);

        // 2. Search logic (Now this works perfectly because everything is in one table)
        if (searchQuery) {
            query = query.or(`review_text.ilike.%${searchQuery}%, song_title.ilike.%${searchQuery}%, album_title.ilike.%${searchQuery}%, review_title.ilike.%${searchQuery}%`);
        }

        // 3. Filtering
        if (filterType === "song") query = query.not("song_id", "is", null);
        if (filterType === "album") query = query.not("album_id", "is", null);

        // 4. Ordering
        query = query.order(sortBy === "oldest" ? "created_at" : "created_at", { ascending: sortBy === "oldest" });

        const { data: reviews, error } = await query.range(offset, offset + limit - 1);

        if (error) throw error;

        return reviews.map((r: any) => ({
            reviewId: r.review_id,
            text: r.review_text,
            id: r.song_id ?? r.album_id,
            name: r.song_title ?? r.album_title ?? "Unknown",
            userId: r.user_id,
            type: r.song_id ? "song" : "album",
            createdAt: r.created_at,
            title: r.review_title,
            rating: r.rating,
            album_cover_url: r.effective_cover_url ?? "",
            likes: r.reviewlikes?.[0]?.count || 0,
        }));
    } catch (err) {
        console.error("Failed to fetch user reviews:", err);
        return [];
    }
}

export async function getReviewed(userId: string): Promise<Review[]> {
    try {
        const { data: reviews, error } = await supabase
            .from("reviews")
            .select(`
                review_id,
                review_text,
                review_title,
                song_id,
                album_id,
                created_at,
                user_id
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (error) throw error;
        if (!reviews) return [];




        const results = await Promise.all(
            reviews.map(async (r: any) => {
                let coverUrl = "";
                const reviewType: "song" | "album" = r.song_id ? "song" : "album";
                let name = "";

                if (r.album_id) {
                    const { data: album } = await supabase
                        .from("albums")
                        .select("*")
                        .eq("album_id", r.album_id)
                        .single();
                    coverUrl = album?.album_cover_url ?? "";
                    name = album?.title ?? "";
                } else if (r.song_id) {
                    const { data: song } = await supabase
                        .from("songs")
                        .select("*, album:albums(album_cover_url)")
                        .eq("song_id", r.song_id)
                        .single();
                    coverUrl = song?.album.album_cover_url ?? "";
                    name = song?.title ?? "";
                }

                return {
                    reviewId: r.review_id,
                    text: r.review_text,
                    id: r.song_id ?? r.album_id,
                    title: r.review_title,
                    name: name,
                    userId: r.user_id,
                    type: reviewType,
                    createdAt: r.created_at,
                    album_cover_url: coverUrl,
                    likes: 0
                };
            })
        );
        return results;
    } catch (err) {
        console.error("Failed to fetch user reviews:", err);
        return [];
    }
}
