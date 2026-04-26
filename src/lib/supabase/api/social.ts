import { IFollow, ISearchUser } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { getProfileUrl } from "./users";

export async function addFollow(followingId: string, followerId: string): Promise<IFollow | null> {
    const now = new Date();
    const isoString = now.toISOString();
    try {
        const { data, error } = await supabase
            .from("followers")
            .insert({
                following_id: followingId,
                follower_id: followerId,
                follow_date: isoString,
            });
        if (error) throw error;
        return data;
    }
    catch (error) {
        console.log(error);
        return null;
    }
}

export async function removeFollow(followingId: string, followerId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("followers")
            .delete()
            .eq("following_id", followingId)
            .eq("follower_id", followerId);
        if (error) throw error;
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function checkIfFollowing(followingId: string, followerId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase

            .from("followers")
            .select("*")
            .eq("following_id", followingId)
            .eq("follower_id", followerId);
        if (error) throw error;
        return data.length > 0;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function getFollowersList(userId: string, type: 'followers' | 'following') {
    const columnToMatch = type === 'followers' ? 'following_id' : 'follower_id';
    const columnToSelect = type === 'followers' ? 'follower_id' : 'following_id';

    const { data, error } = await supabase
        .from("followers")
        .select(`
            users!${columnToSelect} (
                user_id,
                name,
                username,
                bio
            )
        `)
        .eq(columnToMatch, userId);

    if (error) {
        console.error("Supabase Error:", error);
        throw error;
    }

    const usersWithImages = await Promise.all(
        data.map(async (item: any) => {
            const user = item.users;
            if (!user) return null;

            return {
                ...user,
                accountId: user.user_id,
                imageUrl: await getProfileUrl(user.user_id, user.avatar_url)
            };
        })
    );
    
    return usersWithImages;
}

export async function getNotifications(userId: string) {
    const { data, error } = await supabase
        .from('notifications')
        .select(`
            id,
            type,
            created_at,
            is_read,
            entity_id,
            actor_id,
            actor:users!notifications_actor_id_fkey ( username )
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(n => ({
        id: n.id,
        type: n.type,
        createdAt: n.created_at,
        isRead: n.is_read,
        entityId: n.entity_id,
        actorId: n.actor_id,
        actorUsername: (n.actor as any)?.username || "Someone",
        actorAvatar: getProfileUrl(n.actor_id)
    }));
}

export async function getFollowerSuggestions(userId: string) {
    if (!userId) return [];

    const { data: suggestions, error: sugError } = await supabase
        .rpc('get_top_mutual_suggestions', { target_user_id: userId });

    if (sugError) throw sugError;
    if (!suggestions || suggestions.length === 0) return [];

    const ids = suggestions.map((s: any) => s.suggested_user);

    // Fetch profiles in one request
    const { data: profiles, error: profError } = await supabase
        .from('users')
        .select('user_id, username, name')
        .in('user_id', ids);

    if (profError) throw profError;

    const avatarPromises = await Promise.all(
        ids.map(async (id: string) => ({
            id,
            avatar_url: await getProfileUrl(id),
        }))
    );
    const avatarMap = Object.fromEntries(avatarPromises.map((a) => [a.id, a.avatar_url]));

    const profilesWithAvatars = (profiles || []).map((a) => ({
        ...a,
        id: a.user_id,
        avatar_url: avatarMap[a.user_id] || "/assets/default-avatar.png",
    }));

    const merged: ISearchUser[] = [];
    for (const s of suggestions as { suggested_user: string; mutual_count: number }[]) {
        const profile = profilesWithAvatars.find((p) => p.user_id === s.suggested_user);
        if (!profile) continue;
        merged.push({
            mutual_count: s.mutual_count,
            ...profile,
        });
    }
    return merged;
}
