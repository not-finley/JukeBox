import type { User } from "@supabase/supabase-js";
import { INewUser, IUser, ISearchUser } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { processProfileImage } from "./utils/images";

function slugFromString(value: string): string {
    const s = value
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 24);
    return s || "user";
}

async function pickUniqueUsername(base: string): Promise<string> {
    const slug = slugFromString(base).toLowerCase();
    
    for (let i = 0; i <= 20; i++) {
        const candidate = i === 0 ? slug : `${slug}${i}`;
        
        const { data } = await supabase
            .from("users")
            .select("user_id")
            .eq("username", candidate)
            .maybeSingle();

        if (!data) return candidate.slice(0, 30);
    }

    return `${slug}_${Math.random().toString(36).slice(2, 5)}`.slice(0, 30);
}
/**
 * Ensures a `users` row exists for the given auth user (email/password or OAuth).
 */
export async function ensureUserRowFromAuth(user: User): Promise<void> {
    const { data: existing } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
    
    if (existing) return;

    const meta = user.user_metadata ?? {};
    const email = user.email ?? "";

    // 1. Determine Display Name
    const name =
        (typeof meta.full_name === "string" && meta.full_name.trim()) ||
        (typeof meta.name === "string" && meta.name.trim()) ||
        email.split("@")[0] || 
        "Jukeboxd User";

    // 2. Determine Username Base (Google usually provides 'name' or 'email')
    const usernameBase =
        (typeof meta.username === "string" && meta.username.trim()) ||
        (typeof meta.preferred_username === "string" && meta.preferred_username.trim()) ||
        (typeof meta.user_name === "string" && meta.user_name.trim()) ||
        email.split("@")[0] ||
        "user";

    const username = await pickUniqueUsername(usernameBase);

    // 3. Insert into public.users
    const { error } = await supabase.from("users").insert({
        user_id: user.id,
        name,
        email: email || `${user.id}@oauth.placeholder`,
        username,
        avatar_url: meta.avatar_url || meta.picture || null, // Capture Google Profile Pic
    });

    if (error) {
        console.error("Error creating user row:", error.message);
        throw error;
    }

    // 4. Sync metadata back to Auth for session consistency
    await supabase.auth.updateUser({
        data: { name, username },
    });
}

export const getProfileUrl = (userId: string): string => {
    if (!userId) return "/assets/icons/profile-placeholder.svg";

    // This is your project reference from your URL
    const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "akneztqjuwaharlzqwvc"; 
    
    // Construct the direct link to the public object
    return `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/profiles/${userId}/profile.jpg` || "/assets/icons/profile-placeholder.svg";
};

export async function getCurrentUser() {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session?.user || null;
}

export async function createUserAccount(user: INewUser) {
    try {
        // Create auth user in Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
                data: {
                    name: user.name,
                    username: user.username,
                },
            },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create user");

        // Save to users table
        const { data: newUser, error: dbError } = await supabase
            .from("users")
            .insert({
                user_id: authData.user.id,
                name: user.name,
                email: user.email,
                username: user.username,
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return newUser;
    } catch (error) {
        console.error("createUserAccount error:", error);
        return null;
    }
}

export async function saveUserToDB(user: {
    accountId: string;
    email: string;
    name: string;
    username?: string;
}) {
    try {

        const { data: newUser } = await supabase
            .from("users")
            .insert(user)

        return newUser
    } catch (error) {
        console.log(error);
    }
}

export async function updateUser({
    accountId,
    bio,
    imageFile,
    topFive, 
}: {
    accountId: string;
    bio: string;
    imageFile?: File | null;
    topFive?: any[]; 
}) {
    try {
        if (imageFile) {
            const processedImage = await processProfileImage(imageFile);
            const fileName = `profile.jpg`;
            const filePath = `${accountId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("profiles")
                .upload(filePath, processedImage, { upsert: true });

            if (uploadError) throw uploadError;
        }

        // Update user info including the new top_five column
        const { data, error } = await supabase
            .from("users")
            .update({
                bio,
                top_five: topFive, 
            })
            .eq("user_id", accountId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Error updating user:", err);
        throw err;
    }
}

export async function updateUsername(userId: string, newUsername: string) {
    try {
        const { data, error: tableError } = await supabase
        .from("users") 
        .update({ username: newUsername })
        .eq("user_id", userId)
        .select()
        .single();

    if (tableError) throw tableError;

    const { error: authError } = await supabase.auth.updateUser({
        data: { username: newUsername }
    });

    if (authError) console.error("Auth metadata sync failed, but table updated.");

    return data;
    } catch (error) {
        throw error;
    }
}

export async function searchUsers(query: string): Promise<ISearchUser[]> {
    try {
        if (!query) return [];

        // Search in username or name columns
        const { data: usersData, error } = await supabase
            .from("users")
            .select("user_id, username, name")
            .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
            .limit(20);

        if (error) throw error;
        if (!usersData) return [];

        const results = usersData.map((user: any) => ({
            id: user.user_id,
            username: user.username,
            name: user.name,
            avatar_url: getProfileUrl(user.user_id),
        }))
        

        return results;
    } catch (error) {
        console.error("Failed to search users:", error);
        return [];
    }
}

export async function getUserById(userId: string): Promise<IUser | null> {
    try {

        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (userError) throw userError;
        if (!userData) throw new Error("User not found")

        const { data: followersData, error: followersError } = await supabase
            .from("followers")
            .select("follower_id", { count: 'exact' })
            .eq("following_id", userId);

        const { data: followingData, error: followingError } = await supabase
            .from("followers")
            .select("following_id", { count: 'exact' })
            .eq("follower_id", userId);
        if (followersError) console.error("Error fetching followers count:", followersError);
        if (followingError) console.error("Error fetching following count:", followingError);

        const followersCount = followersData ? followersData.length : 0;
        const followingCount = followingData ? followingData.length : 0;


        const user: IUser = {
            accountId: userData.user_id,
            name: userData.name,
            username: userData.username,
            email: userData.email,
            imageUrl: await getProfileUrl(userId),
            bio: userData.bio,
            followersCount,
            followingCount, 
            top_five: userData.top_five
        };

        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return null;
    }
}
