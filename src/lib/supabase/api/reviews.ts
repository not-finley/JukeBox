import { nanoid } from "nanoid";
import { Review, Comment } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { getProfileUrl } from "./users";

export async function addReviewSong(songId: string, userId: string, reviewText: string, reviewTitle?: string) {
    const id = nanoid();
    const now = new Date();
    const isoString = now.toISOString();
    try {

        const { data: review, error: addReview } = await supabase
            .from("reviews")
            .insert({
                review_id: id,
                song_id: songId,
                user_id: userId,
                review_type: "song",
                review_text: reviewText,
                review_title: reviewTitle,
                created_at: isoString,
            })
            .select()
            .single();

        const { data: getListen, error: getListenError } = await supabase
            .from("song_listens")
            .select("*")
            .eq("song_id", songId)
            .eq("user_id", userId)

        if (getListenError) throw getListenError;

        if (getListen.length === 0) {
            const { error: listenError } = await supabase
                .from("song_listens")
                .insert({ song_id: songId, user_id: userId, listen_date: isoString })
            if (listenError) throw listenError;
        }
        if (addReview) throw addReview;

        if (!review) throw new Error("Failed to add review");

        return review;
    } catch (error) {
        console.log(error);
        return null;
    }
}


export async function addReviewAlbum(albumId: string, userId: string, reviewText: string, reviewTitle?: string) {
    const id = nanoid();
    const now = new Date();
    const isoString = now.toISOString();
    try {

        const { data: review, error: addReview } = await supabase
            .from("reviews")
            .insert({
                review_id: id,
                album_id: albumId,
                user_id: userId,
                review_type: "album",
                review_text: reviewText,
                review_title: reviewTitle,
                created_at: isoString,
            })
            .select()
            .single();

        const { data: getListen, error: getListenError } = await supabase
            .from("album_listens")
            .select("*")
            .eq("album_id", albumId)
            .eq("user_id", userId)

        if (getListenError) throw getListenError;

        if (getListen.length === 0) {
            const { error: listenError } = await supabase
                .from("album_listens")
                .insert({ album_id: albumId, user_id: userId, listen_date: isoString })
            if (listenError) throw listenError;
        }

        if (addReview) throw addReview;

        if (!review) throw new Error("Failed to add review");

        return review;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export async function getReviewById(reviewId: string): Promise<Review | null> {
    try {
        const { data: reviewData, error: reviewError } = await supabase
            .from("reviews")
            .select(`
                *,
                likes:reviewlikes(*),
                creator:users(*),
                comments:reviewcomment(
                comment_id,
                parent_id,
                content,
                created_at,
                updated_at,
                user:users(*)
                )
            `)
            .eq("review_id", reviewId)
            .single();
        if (reviewError) throw reviewError;
        if (!reviewData) throw new Error("Review not found");
        let coverUrl = "";
        let name = "";
        const reviewType: "song" | "album" = reviewData.song_id ? "song" : "album";
        if (reviewData.album_id) {
            const { data: album } = await supabase
                .from("albums")
                .select("*")
                .eq("album_id", reviewData.album_id)
                .single();
            coverUrl = album?.album_cover_url ?? "";
            name = album?.title ?? "";
        } else if (reviewData.song_id) {
            const { data: song } = await supabase
                .from("songs")
                .select("*, album:albums(album_cover_url)")
                .eq("song_id", reviewData.song_id)
                .single();
            coverUrl = song?.album.album_cover_url ?? "";
            name = song?.title ?? "";
        }

        const comments: Comment[] = (reviewData.comments ?? []).map((c: any) => ({
                commentId: c.comment_id,
                parentId: c.parent_id,
                text: c.content,
                createdAt: c.created_at,
                updatedAt: c.updated_at,
                creator: {
                    accountId: c.user.user_id,
                    name: c.user.name,
                    username: c.user.username,
                    email: c.user.email,
                    imageUrl: getProfileUrl(c.user.user_id, c.user.avatar_url),
                    bio: c.user.bio ?? "",
                }
            }));
        

        comments.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        )

        return {
            reviewId: reviewData.review_id,
            text: reviewData.review_text,
            title: reviewData.review_title,
            id: reviewData.song_id ?? reviewData.album_id,
            type: reviewType,
            createdAt: reviewData.created_at,
            name: name,
            album_cover_url: coverUrl,
            likes: reviewData.likes.length,
            comments: comments,
            creator: {
                accountId: reviewData.creator.user_id,
                name: reviewData.creator.name,
                username: reviewData.creator.username,
                email: reviewData.creator.email,
                imageUrl: await getProfileUrl(reviewData.creator.user_id, reviewData.creator.avatar_url),
                bio: reviewData.creator.bio ?? "",
            }
        };
    } catch (error) {
        console.error('Failed to fetch review:', error);
        return null;
    }
}



export async function addLikeToReview(reviewId: string, userId: string): Promise<boolean> {
    const now = new Date();
    const isoString = now.toISOString();
    try {
        const { error } = await supabase
            .from("reviewlikes")
            .insert({
                review_id: reviewId,
                user_id: userId,
                like_date: isoString
            });
        if (error) throw error;
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function removeLikeFromReview(reviewId: string, userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("reviewlikes")
            .delete()
            .eq("review_id", reviewId)
            .eq("user_id", userId);
        if (error) throw error;
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function checkIfUserLikedReview(reviewId: string, userId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from("reviewlikes")
            .select("*")
            .eq("review_id", reviewId)
            .eq("user_id", userId);
        if (error) throw error;
        return data.length > 0;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function addCommentToReview(reviewId: string, userId: string, text: string, parentId?: string): Promise<boolean> {
    const id = nanoid();
    const now = new Date();
    const isoString = now.toISOString();
    try {
        const { error } = await supabase
            .from("reviewcomment")
            .insert({
                review_id: reviewId,
                user_id: userId,
                comment_id: id,
                parent_id: parentId,
                content: text,
                created_at: isoString
            })
        if (error) throw error;
        return true;
    }
    catch (error) {
        console.log(error);
        return false;
    }
}
