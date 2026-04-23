import { Activity } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { getProfileUrl } from "./users";

export type FollowFeedCursor = { ts: string; key: string };

type RpcFeedRow = {
    event_ts: string;
    cursor_key: string;
    event_kind: string;
    user_id: string;
    username: string | null;
    song_id: string | null;
    album_id: string | null;
    review_id: string | null;
    /** Postgres numeric may arrive as string from PostgREST */
    rating: number | string | null;
    review_type: string | null;
    review_text: string | null;
    song_title: string | null;
    album_title: string | null;
    album_cover_url: string | null;
    song_album_id: string | null;
    song_album_title: string | null;
};

function attachProfileUrlsToActivities(activities: Activity[]): Activity[] {
    const uniqueUserIds = Array.from(new Set(activities.map((a) => a.userId)));
    const avatarMap = Object.fromEntries(uniqueUserIds.map((id) => [id, getProfileUrl(id)]));

    const mapOne = (a: Activity): Activity => ({
        ...a,
        profileUrl: avatarMap[a.userId] || "/assets/default-avatar.png",
        groupedActivities: (a.groupedActivities || []).map(mapOne),
    });

    return activities.map(mapOne);
}

function rpcNumericRating(r: number | string | null | undefined): number | undefined {
    if (r == null) return undefined;
    const n = typeof r === "number" ? r : Number(r);
    return Number.isFinite(n) ? n : undefined;
}

function mapRpcFeedRowToActivity(row: RpcFeedRow): Activity {
    const u = row.username ?? "Unknown";
    const base = {
        userId: row.user_id,
        username: u,
        date: row.event_ts,
        isAggregated: false as const,
        groupedActivities: [] as Activity[],
    };

    switch (row.event_kind) {
        case "song_listen":
            return {
                ...base,
                id: `songlisten-${row.user_id}-${row.song_id}-${row.event_ts}`,
                type: "listen",
                targetType: "song",
                targetId: row.song_id!,
                targetName: row.song_title ?? "Unknown Song",
                album_cover_url: row.album_cover_url ?? "",
                targetAlbumId: row.song_album_id ?? undefined,
                targetAlbumName: row.song_album_title ?? "Unknown Album",
            };
        case "album_listen":
            return {
                ...base,
                id: `albumlisten-${row.user_id}-${row.album_id}-${row.event_ts}`,
                type: "listen",
                targetType: "album",
                targetId: row.album_id!,
                targetName: row.album_title ?? "Unknown Album",
                album_cover_url: row.album_cover_url ?? "",
                targetAlbumId: row.album_id!,
                targetAlbumName: row.album_title ?? "Unknown Album",
            };
        case "review":
            return {
                ...base,
                id: `${row.review_id}`,
                type: "review",
                targetType: row.review_type === "song" ? "song" : "album",
                targetId: row.review_type === "song" ? row.song_id! : row.album_id!,
                targetName:
                    row.review_type === "song"
                        ? row.song_title ?? "Unknown Song"
                        : row.album_title ?? "Unknown Album",
                album_cover_url: row.album_cover_url ?? "",
                text: row.review_text ?? undefined,
                targetAlbumId:
                    row.review_type === "song"
                        ? row.song_album_id ?? row.album_id ?? undefined
                        : row.album_id ?? undefined,
                targetAlbumName:
                    row.review_type === "song"
                        ? row.song_album_title ?? "Unknown Album"
                        : row.album_title ?? "Unknown Album",
            };
        case "song_rating":
            return {
                ...base,
                id: `songrating-${row.user_id}-${row.song_id}-${row.event_ts}`,
                type: "rating",
                targetType: "song",
                targetId: row.song_id!,
                targetName: row.song_title ?? "Unknown Song",
                album_cover_url: row.album_cover_url ?? "",
                rating: rpcNumericRating(row.rating),
                targetAlbumId: row.song_album_id ?? undefined,
                targetAlbumName: row.song_album_title ?? "Unknown Album",
            };
        case "album_rating":
            return {
                ...base,
                id: `albumrating-${row.user_id}-${row.album_id}-${row.event_ts}`,
                type: "rating",
                targetType: "album",
                targetId: row.album_id!,
                targetName: row.album_title ?? "Unknown Album",
                album_cover_url: row.album_cover_url ?? "",
                rating: rpcNumericRating(row.rating),
                targetAlbumId: row.album_id!,
                targetAlbumName: row.album_title ?? "Unknown Album",
            };
        default:
            return {
                ...base,
                id: row.cursor_key,
                type: "listen",
                targetType: "song",
                targetId: row.song_id || "",
                targetName: "Unknown",
                album_cover_url: "",
            };
    }
}

/**
 * Keyset-paged raw events from Postgres (see supabase/migrations). Returns null if the RPC is missing or errors.
 */
export async function fetchFollowFeedRpcBatch(
    viewerId: string,
    cursor: FollowFeedCursor | null,
    batchSize = 120
): Promise<{ rawActivities: Activity[]; nextCursor: FollowFeedCursor | null } | null> {
    if (!viewerId) return null;

    const { data, error } = await supabase.rpc("get_followed_activity_feed", {
        p_viewer: viewerId,
        p_limit: batchSize,
        p_cursor_ts: cursor?.ts ?? null,
        p_cursor_key: cursor?.key ?? null,
    });

    if (error) {
        console.warn("get_followed_activity_feed RPC unavailable:", error.message);
        return null;
    }

    const rows = (data || []) as RpcFeedRow[];
    const rawActivities = rows.map(mapRpcFeedRowToActivity);
    const withUrls = attachProfileUrlsToActivities(rawActivities);

    const nextCursor: FollowFeedCursor | null =
        rows.length >= batchSize && rows.length > 0
            ? {
                  ts: rows[rows.length - 1].event_ts,
                  key: rows[rows.length - 1].cursor_key,
              }
            : null;

    return { rawActivities: withUrls, nextCursor };
}

/** Legacy pool + offset pagination (bounded window per table). */
export async function fetchFollowedActivitiesLegacyPage(
    userId: string,
    limit: number = 10,
    offset: number = 0
): Promise<Activity[]> {
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
        { data: albumRatings, error: albumRatingsError },
    ] = await Promise.all([
        supabase
            .from("song_listens")
            .select(
                `
                    user_id,
                    song_id,
                    listen_date,
                    song:songs(title, album_id, albums(album_cover_url, title)),
                    user:users(username)
                    `
            )
            .in("user_id", followedIds)
            .order("listen_date", { ascending: false })
            .limit(poolSize),
        supabase
            .from("album_listens")
            .select(
                `
                    user_id,
                    album_id,
                    listen_date,
                    album:albums(title, album_cover_url),
                    user:users(username)
                    `
            )
            .in("user_id", followedIds)
            .order("listen_date", { ascending: false })
            .limit(poolSize),
        supabase
            .from("reviews")
            .select(
                `
                    review_id,
                    user_id,
                    review_text,
                    review_type,
                    song_id,
                    album_id,
                    created_at,
                    song:songs(title, album_id, albums(album_cover_url, title)),
                    album:albums(title, album_cover_url),
                    user:users(username)
                    `
            )
            .in("user_id", followedIds)
            .order("created_at", { ascending: false })
            .limit(poolSize),
        supabase
            .from("song_rating")
            .select(
                `
                    user_id,
                    rating,
                    song_id,
                    rating_date,
                    song:songs(title, album_id, albums(album_cover_url, title)),
                    user:users(username)
                `
            )
            .in("user_id", followedIds)
            .order("rating_date", { ascending: false })
            .limit(poolSize),
        supabase
            .from("album_rating")
            .select(
                `
                    user_id,
                    rating,
                    album_id,
                    rating_date,
                    album:albums(title, album_cover_url),
                    user:users(username)
                    `
            )
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

    const first = (v: unknown) => (Array.isArray(v) ? v[0] : v) as Record<string, unknown> | undefined;

    for (const l of songListens || []) {
        const userObj = first(l.user);
        const songObj = first(l.song) as Record<string, unknown> | undefined;
        const songAlbum = first(songObj?.albums) as Record<string, unknown> | undefined;
        activities.push({
            id: `songlisten-${l.user_id}-${l.song_id}-${l.listen_date}`,
            userId: l.user_id,
            username: (userObj?.username as string) ?? "Unknown",
            type: "listen",
            targetType: "song",
            targetId: l.song_id,
            targetName: (songObj?.title as string) ?? "Unknown Song",
            album_cover_url: (songAlbum?.album_cover_url as string) ?? "",
            date: l.listen_date,
            targetAlbumId: songObj?.album_id as string,
            targetAlbumName: (songAlbum?.title as string) ?? "Unknown Album",
            isAggregated: false,
            groupedActivities: [],
        });
    }

    for (const l of albumListens || []) {
        const userObj = first(l.user);
        const albumObj = first(l.album) as Record<string, unknown> | undefined;
        activities.push({
            id: `albumlisten-${l.user_id}-${l.album_id}-${l.listen_date}`,
            userId: l.user_id,
            username: (userObj?.username as string) ?? "Unknown",
            type: "listen",
            targetType: "album",
            targetId: l.album_id,
            targetName: (albumObj?.title as string) ?? "Unknown Album",
            album_cover_url: (albumObj?.album_cover_url as string) ?? "",
            date: l.listen_date,
            targetAlbumId: l.album_id,
            targetAlbumName: (albumObj?.title as string) ?? "Unknown Album",
            isAggregated: false,
            groupedActivities: [],
        });
    }

    for (const r of reviews || []) {
        const userObj = first(r.user);
        const songObj = first(r.song) as Record<string, unknown> | undefined;
        const albumObj = first(r.album) as Record<string, unknown> | undefined;
        const songAlbum = first(songObj?.albums) as Record<string, unknown> | undefined;
        const isSong = r.review_type === "song";
        const targetAlbumId = isSong
            ? ((songObj?.album_id as string) ?? (r.album_id as string))
            : (r.album_id as string);
        const targetAlbumName = isSong
            ? ((songAlbum?.title as string) ?? "Unknown Album")
            : ((albumObj?.title as string) ?? "Unknown Album");

        activities.push({
            id: `${r.review_id}`,
            userId: r.user_id,
            username: (userObj?.username as string) ?? "Unknown",
            type: "review",
            targetType: isSong ? "song" : "album",
            targetId: isSong ? r.song_id : r.album_id,
            targetName: isSong ? ((songObj?.title as string) ?? "Unknown Song") : ((albumObj?.title as string) ?? "Unknown Album"),
            album_cover_url: isSong ? ((songAlbum?.album_cover_url as string) ?? "") : ((albumObj?.album_cover_url as string) ?? ""),
            date: r.created_at,
            text: r.review_text,
            targetAlbumId,
            targetAlbumName,
            isAggregated: false,
            groupedActivities: [],
        });
    }

    for (const r of songRatings || []) {
        const userObj = first(r.user);
        const songObj = first(r.song) as Record<string, unknown> | undefined;
        const songAlbum = first(songObj?.albums) as Record<string, unknown> | undefined;
        activities.push({
            id: `songrating-${r.user_id}-${r.song_id}-${r.rating_date}`,
            userId: r.user_id,
            username: (userObj?.username as string) ?? "Unknown",
            type: "rating",
            targetType: "song",
            targetId: r.song_id,
            targetName: (songObj?.title as string) ?? "Unknown Song",
            album_cover_url: (songAlbum?.album_cover_url as string) ?? "",
            date: r.rating_date,
            rating: r.rating,
            targetAlbumId: songObj?.album_id as string,
            targetAlbumName: (songAlbum?.title as string) ?? "Unknown Album",
            isAggregated: false,
            groupedActivities: [],
        });
    }

    for (const r of albumRatings || []) {
        const userObj = first(r.user);
        const albumObj = first(r.album) as Record<string, unknown> | undefined;
        activities.push({
            id: `albumrating-${r.user_id}-${r.album_id}-${r.rating_date}`,
            userId: r.user_id,
            username: (userObj?.username as string) ?? "Unknown",
            type: "rating",
            targetType: "album",
            targetId: r.album_id,
            targetName: (albumObj?.title as string) ?? "Unknown Album",
            album_cover_url: (albumObj?.album_cover_url as string) ?? "",
            date: r.rating_date,
            rating: r.rating,
            targetAlbumId: r.album_id,
            targetAlbumName: (albumObj?.title as string) ?? "Unknown Album",
            isAggregated: false,
            groupedActivities: [],
        });
    }

    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const aggregatedActivities = combineAndAggregate(activities);

    const paginated = aggregatedActivities.slice(offset, offset + limit);

    const uniqueUserIds = Array.from(new Set(paginated.map((a) => a.userId)));

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
}

export function aggregateFeedActivities(activities: Activity[]): Activity[] {
    return combineAndAggregate(activities);
}

function maxEventTimeMs(acts: Activity[]): number {
    return Math.max(...acts.map((x) => new Date(x.date).getTime()));
}

function combineAndAggregate(activities: Activity[]): Activity[] {
    if (!activities.length) return [];

    const sorted = [...activities].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    /** One juke per (user, album): all actions on that album merge regardless of time gaps. */
    const groups = new Map<string, Activity[]>();

    for (const activity of sorted) {
        const albumId = activity.targetType === "album" ? activity.targetId : activity.targetAlbumId;
        if (!albumId) {
            groups.set(`single:${activity.id}`, [activity]);
            continue;
        }
        const k = `${activity.userId}:${albumId}`;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(activity);
    }

    const newFeed: Activity[] = [];

    for (const rawGroup of groups.values()) {
        const group = [...rawGroup].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const mergedByTarget = new Map<string, Activity>();

        group.forEach((act) => {
            const key = `${act.targetType}-${act.targetId}`;
            if (!mergedByTarget.has(key)) {
                mergedByTarget.set(key, { ...act });
            } else {
                const existing = mergedByTarget.get(key)!;
                if (act.rating) existing.rating = act.rating;
                if (act.text) existing.text = act.text;
                if (new Date(act.date) > new Date(existing.date)) {
                    existing.date = act.date;
                }
                if (act.type === "review" || act.type === "rating") {
                    existing.type = act.type;
                }
            }
        });

        const uniqueActivitiesInGroup = Array.from(mergedByTarget.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        if (uniqueActivitiesInGroup.length === 1) {
            newFeed.push(uniqueActivitiesInGroup[0]);
        } else {
            const explicitAlbumActivity =
                uniqueActivitiesInGroup.find((a) => a.targetType === "album" && a.type === "review") ||
                uniqueActivitiesInGroup.find((a) => a.targetType === "album" && a.type === "rating") ||
                uniqueActivitiesInGroup.find((a) => a.targetType === "album");

            const representative = uniqueActivitiesInGroup[0];

            let headline: Activity;
            let children: Activity[];

            if (explicitAlbumActivity) {
                headline = explicitAlbumActivity;
                children = uniqueActivitiesInGroup.filter((a) => a.id !== explicitAlbumActivity.id);
            } else {
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

            const latestMs = maxEventTimeMs(uniqueActivitiesInGroup);
            const latestIso = new Date(latestMs).toISOString();

            newFeed.push({
                ...headline,
                id: `aggregated-${headline.userId}-${headline.targetId}-${latestMs}`,
                isAggregated: true,
                groupedActivities: children,
                type: "grouped",
                targetName: headline.targetAlbumName || headline.targetName,
                date: latestIso,
            });
        }
    }

    return newFeed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** @deprecated Use fetchFollowFeedRpcBatch + aggregateFeedActivities or fetchFollowedActivitiesLegacyPage */
export async function getRecentFollowedActivities(
    userId: string,
    limit: number = 10,
    offset: number = 0
): Promise<Activity[]> {
    return fetchFollowedActivitiesLegacyPage(userId, limit, offset);
}
