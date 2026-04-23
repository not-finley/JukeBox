import { supabase } from "@/lib/supabaseClient";
import { deletePlaylist } from "./playlists";

function throwIfError(error: { message: string } | null, step: string) {
    if (error) throw new Error(`${step}: ${error.message}`);
}

/**
 * Removes the signed-in user's app data and `users` row.
 * Call `supabase.auth.signOut()` afterward. Deleting the Auth user itself
 * requires a service-role Edge Function or Supabase dashboard.
 */
export async function deleteUserAccount(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        const { data: reviewRows, error: reviewSelectError } = await supabase
            .from("reviews")
            .select("review_id")
            .eq("user_id", userId);

        throwIfError(reviewSelectError, "load reviews");

        const reviewIds = (reviewRows ?? []).map((r) => r.review_id).filter(Boolean);

        if (reviewIds.length > 0) {
            const { error: rcErr } = await supabase.from("reviewcomment").delete().in("review_id", reviewIds);
            throwIfError(rcErr, "delete comments on your reviews");

            const { error: rlErr } = await supabase.from("reviewlikes").delete().in("review_id", reviewIds);
            throwIfError(rlErr, "delete likes on your reviews");
        }

        const { error: rcUserErr } = await supabase.from("reviewcomment").delete().eq("user_id", userId);
        throwIfError(rcUserErr, "delete your comments");

        const { error: rlUserErr } = await supabase.from("reviewlikes").delete().eq("user_id", userId);
        throwIfError(rlUserErr, "delete your review likes");

        const { error: revErr } = await supabase.from("reviews").delete().eq("user_id", userId);
        throwIfError(revErr, "delete reviews");

        const { error: srErr } = await supabase.from("song_rating").delete().eq("user_id", userId);
        throwIfError(srErr, "delete song ratings");

        const { error: arErr } = await supabase.from("album_rating").delete().eq("user_id", userId);
        throwIfError(arErr, "delete album ratings");

        const { error: slErr } = await supabase.from("song_listens").delete().eq("user_id", userId);
        throwIfError(slErr, "delete song listens");

        const { error: alErr } = await supabase.from("album_listens").delete().eq("user_id", userId);
        throwIfError(alErr, "delete album listens");

        const { error: folErr } = await supabase
            .from("followers")
            .delete()
            .or(`follower_id.eq.${userId},following_id.eq.${userId}`);
        throwIfError(folErr, "delete follows");

        const { error: n1 } = await supabase.from("notifications").delete().eq("recipient_id", userId);
        if (n1) console.warn("notifications (recipient):", n1.message);

        const { error: n2 } = await supabase.from("notifications").delete().eq("actor_id", userId);
        if (n2) console.warn("notifications (actor):", n2.message);

        const { data: playlistRows, error: pcErr } = await supabase
            .from("playlist_creators")
            .select("playlist_id")
            .eq("user_id", userId);

        throwIfError(pcErr, "load playlists");

        for (const row of playlistRows ?? []) {
            const ok = await deletePlaylist(row.playlist_id);
            if (!ok) throw new Error("delete playlist failed");
        }

        const { error: storageErr } = await supabase.storage.from("profiles").remove([`${userId}/profile.jpg`]);
        if (storageErr) console.warn("profile storage cleanup:", storageErr.message);

        const { error: userErr } = await supabase.from("users").delete().eq("user_id", userId);
        throwIfError(userErr, "delete profile row");

        return { ok: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        console.error("deleteUserAccount:", e);
        return { ok: false, error: message };
    }
}
