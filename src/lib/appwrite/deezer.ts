import { supabase } from "@/lib/supabaseClient";

export const getDeezerPreview = async (title: string, artist: string, isrc?: string) => {
    try {
        const { data, error } = await supabase.functions.invoke('enrich-preview', {
            body: { 
                title: title, 
                artist: artist, 
                isrc: isrc 
            }
        });

        if (error) {
            console.error("Edge Function Error:", error);
            return null;
        }

        // Return the preview_url returned by the Edge Function
        return data?.preview_url || null;
        
    } catch (error) {
        console.error("Failed to invoke enrich-preview function:", error);
        return null;
    }
};