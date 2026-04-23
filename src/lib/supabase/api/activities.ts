import { Activity } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { getProfileUrl } from "./users";

export async function getRecentFollowedActivities(
    userId: string,
    limit: number = 10,
    offset: number = 0,
): Promise<Activity[]> {
    try {
        // 1️⃣ Get list of followed user IDs
        const { data: followed, error: followsError } = await supabase
            .from("followers")
            .select("following_id")
            .eq("follower_id", userId);

        if (followsError) throw followsError;
        if (!followed || followed.length === 0) return [];

        const followedIds = followed.map((f) => f.following_id);

        const poolSize = limit * 3;

        const [
            { data: songListens, error: songListensError },
            { data: albumListens, error: albumListensError },
            { data: reviews, error: reviewsError },
            { data: songRatings, error: songRatingsError },
            { data: albumRatings, error: albumRatingsError }
        ] = await Promise.all([
            supabase
                .from("song_listens")
                .select(`
                    user_id,
                    song_id,
                    listen_date,
                    song:songs(title, album_id, albums(album_cover_url, title)),
                    user:users(username)
                    `)
                .in("user_id", followedIds)
                .order("listen_date", { ascending: false })
                .limit(poolSize),
            supabase
                .from("album_listens")
                .select(`
                    user_id,
                    album_id,
                    listen_date,
                    album:albums(title, album_cover_url),
                    user:users(username)
                    `)
                .in("user_id", followedIds)
                .order("listen_date", { ascending: false })
                .limit(poolSize),
            supabase
                .from("reviews")
                .select(`
                    review_id,
                    user_id,
                    review_text,
                    review_type,
                    song_id,
                    album_id,
                    created_at,
                    song:songs(title, albums(album_cover_url)),
                    album:albums(title, album_cover_url),
                    user:users(username)
                    `)
                .in("user_id", followedIds)
                .order("created_at", { ascending: false })
                .limit(poolSize),
            supabase
                .from("song_rating")
                .select(`
                    user_id,
                    rating,
                    song_id,
                    rating_date,
                    song:songs(title, album_id, albums(album_cover_url, title)),
                    user:users(username)
                `)
                .in("user_id", followedIds)
                .order("rating_date", { ascending: false })
                .limit(poolSize),
            supabase
                .from("album_rating")
                .select(`
                    user_id,
                    rating,
                    album_id,
                    rating_date,
                    album:albums(title, album_cover_url),
                    user:users(username)
                    `)
                .in("user_id", followedIds)
                .order("rating_date", { ascending: false })
                .limit(poolSize),
        ]);

        if (songListensError) throw songListensError;
        if (albumListensError) throw albumListensError;
        if (reviewsError) throw reviewsError;
        if (songRatingsError) throw songRatingsError;
        if (albumRatingsError) throw albumRatingsError;

        const activities: Activity[] = [];

        // helper to handle supabase returning nested relations as arrays
        const first = (v: any) => (Array.isArray(v) ? v[0] : v) as any;

        // SONG LISTENS
        for (const l of songListens || []) {
            const userObj = first(l.user);
            const songObj = first(l.song);
            const songAlbum = first(songObj?.albums);
            activities.push({
                id: `songlisten-${l.user_id}-${l.song_id}-${l.listen_date}`,
                userId: l.user_id,
                username: userObj?.username ?? "Unknown",
                type: "listen",
                targetType: "song",
                targetId: l.song_id,
                targetName: songObj?.title ?? "Unknown Song",
                album_cover_url: songAlbum?.album_cover_url ?? "",
                date: l.listen_date,
                targetAlbumId: songObj.album_id,
                targetAlbumName : songAlbum?.title ?? "Unknown Album",
                isAggregated: false,
                groupedActivities: []
            });
        }

        // ALBUM LISTENS
        for (const l of albumListens || []) {
            const userObj = first(l.user);
            const albumObj = first(l.album);
            activities.push({
                id: `albumlisten-${l.user_id}-${l.album_id}-${l.listen_date}`,
                userId: l.user_id,
                username: userObj?.username ?? "Unknown",
                type: "listen",
                targetType: "album",
                targetId: l.album_id,
                targetName: albumObj?.title ?? "Unknown Album",
                album_cover_url: albumObj?.album_cover_url ?? "",
                date: l.listen_date,
                targetAlbumId: l.album_id,
                targetAlbumName : albumObj?.title ?? "Unknown Album",
                isAggregated: false,
                groupedActivities: []
            });
        }

        // REVIEWS
        for (const r of reviews || []) {
            const userObj = first(r.user);
            const songObj = first(r.song);
            const albumObj = first(r.album);
            const songAlbum = first(songObj?.albums);
            activities.push({
                id: `${r.review_id}`,
                userId: r.user_id,
                username: userObj?.username ?? "Unknown",
                type: "review",
                targetType: r.review_type === "song" ? "song" : "album",
                targetId: r.review_type === "song" ? r.song_id : r.album_id,
                targetName:
                    r.review_type === "song"
                        ? songObj?.title ?? "Unknown Song"
                        : albumObj?.title ?? "Unknown Album",
                album_cover_url:
                    r.review_type === "song"
                        ? songAlbum?.album_cover_url ?? ""
                        : albumObj?.album_cover_url ?? "",
                date: r.created_at,
                text: r.review_text,
                targetAlbumId: r.album_id,
                targetAlbumName : songAlbum?.title ?? "Unknown Album",
                isAggregated: false,
                groupedActivities: []
            });
        }

        // SONG RATINGS
        for (const r of songRatings || []) {
            const userObj = first(r.user);
            const songObj = first(r.song);
            const songAlbum = first(songObj?.albums);
            activities.push({
                id: `songrating-${r.user_id}-${r.song_id}-${r.rating_date}`,
                userId: r.user_id,
                username: userObj?.username ?? "Unknown",
                type: "rating",
                targetType: "song",
                targetId: r.song_id,
                targetName: songObj?.title ?? "Unknown Song",
                album_cover_url: songAlbum?.album_cover_url ?? "",
                date: r.rating_date,
                rating: r.rating,
                targetAlbumId:  songObj.album_id,
                targetAlbumName : songAlbum?.title ?? "Unknown Album",
                isAggregated: false,
                groupedActivities: []
            });
        }

        // ALBUM RATINGS
        for (const r of albumRatings || []) {
            const userObj = first(r.user);
            const albumObj = first(r.album);
            activities.push({
                id: `albumrating-${r.user_id}-${r.album_id}-${r.rating_date}`,
                userId: r.user_id,
                username: userObj?.username ?? "Unknown",
                type: "rating",
                targetType: "album",
                targetId: r.album_id,
                targetName: albumObj?.title ?? "Unknown Album",
                album_cover_url: albumObj?.album_cover_url ?? "",
                date: r.rating_date,
                rating: r.rating,
                targetAlbumId: r.album_id,
                targetAlbumName : albumObj?.title ?? "Unknown Album",
                isAggregated: false,
                groupedActivities: []
            });
        }

        activities.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const aggregatedActivities = combineAndAggregate(activities);

        const paginated = aggregatedActivities.slice(offset, offset + limit);

        const uniqueUserIds = Array.from(new Set(paginated.map(a => a.userId)));

        const avatarPromises = await Promise.all(
            uniqueUserIds.map(async (id) => ({
                id,
                avatarUrl: await getProfileUrl(id),
            }))
        );
        const avatarMap = Object.fromEntries(avatarPromises.map((a) => [a.id, a.avatarUrl]));

        return paginated.map((a) => ({
            ...a,
            profileUrl: avatarMap[a.userId] || "/assets/default-avatar.png",
        }));


    } catch (err) {
        console.error("Failed to fetch recent followed activities:", err);
        return [];
    }
}

function combineAndAggregate(activities: Activity[]): Activity[] {
    if (!activities.length) return [];

    const groups = new Map<string, Activity[]>();
    const TIME_WINDOW_MS = 15 * 60 * 1000; // Increased to 15m for better grouping

    // 1. Initial Grouping by User + Album + Time Window
    activities.forEach(activity => {
        const albumId = activity.targetType === "album" ? activity.targetId : activity.targetAlbumId;
        if (!albumId) {
            groups.set(`single-${activity.id}`, [activity]);
            return;
        }

        const albumKeyPrefix = `${activity.userId}-${albumId}`;
        let foundGroupKey: string | null = null;

        for (const [key, group] of groups.entries()) {
            if (key.startsWith(albumKeyPrefix)) {
                const groupStartTime = new Date(group[0].date).getTime();
                const activityTime = new Date(activity.date).getTime();
                if (Math.abs(activityTime - groupStartTime) <= TIME_WINDOW_MS) {
                    foundGroupKey = key;
                    break;
                }
            }
        }

        if (foundGroupKey) {
            groups.get(foundGroupKey)!.push(activity);
        } else {
            const newKey = `${albumKeyPrefix}-${new Date(activity.date).getTime()}`;
            groups.set(newKey, [activity]);
        }
    });

    const newFeed: Activity[] = [];

    for (const group of groups.values()) {
        // --- SECONDARY AGGREGATION: Merge Listen + Rating for the same song ---
        const mergedByTarget = new Map<string, Activity>();
        
        group.forEach(act => {
            const key = `${act.targetType}-${act.targetId}`;
            if (!mergedByTarget.has(key)) {
                mergedByTarget.set(key, { ...act });
            } else {
                const existing = mergedByTarget.get(key)!;
                // Merge Rating into Listen (or vice versa)
                if (act.rating) existing.rating = act.rating;
                if (act.text) existing.text = act.text;
                // Keep the most recent date
                if (new Date(act.date) > new Date(existing.date)) {
                    existing.date = act.date;
                }
                // If one was a 'review' or 'rating', upgrade the type from 'listen'
                if (act.type === "review" || act.type === "rating") {
                    existing.type = act.type;
                }
            }
        });

        const uniqueActivitiesInGroup = Array.from(mergedByTarget.values());

        // 2. Decide how to display this group
        if (uniqueActivitiesInGroup.length === 1) {
            newFeed.push(uniqueActivitiesInGroup[0]);
        } else {
            // Logic for Aggregated "Juked" Post
            const explicitAlbumActivity = 
                uniqueActivitiesInGroup.find(a => a.targetType === "album" && a.type === "review") || 
                uniqueActivitiesInGroup.find(a => a.targetType === "album" && a.type === "rating") || 
                uniqueActivitiesInGroup.find(a => a.targetType === "album");

            const representative = uniqueActivitiesInGroup[0];
            
            let headline: Activity;
            let children: Activity[];

            if (explicitAlbumActivity) {
                headline = explicitAlbumActivity;
                children = uniqueActivitiesInGroup.filter(a => a.id !== explicitAlbumActivity.id);
            } else {
                // Synthetic Headline
                headline = {
                    ...representative,
                    targetType: "album",
                    targetId: representative.targetAlbumId!,
                    targetName: representative.targetAlbumName!,
                    type: "grouped",
                    rating: undefined,
                    text: undefined,
                };
                children = uniqueActivitiesInGroup;
            }

            newFeed.push({
                ...headline,
                id: `aggregated-${headline.userId}-${headline.targetId}-${new Date(headline.date).getTime()}`,
                isAggregated: true,
                groupedActivities: children,
                type: "grouped",
                targetName: headline.targetAlbumName || headline.targetName,
            });
        }
    }

    return newFeed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
