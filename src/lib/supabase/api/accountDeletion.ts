import { supabase } from "@/lib/supabaseClient";

export async function deleteUserAccount(userId: string) {
    try {
        const { error } = await supabase.functions.invoke('delete-self');
        
        if (error) throw error;

        const { error: deleteUserError } = await supabase.from("users").delete().eq("user_id", userId);

        if (deleteUserError) throw deleteUserError;

        await supabase.auth.signOut();
        
        return { ok: true };
    } catch (e: any) {
        console.error("Deletion failed:", e.message);
        return { ok: false, error: e.message };
    }
}