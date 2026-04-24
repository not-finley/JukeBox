import TrendingList from "@/components/TrendingList";
import { getTrendingReviews } from "@/lib/supabase/api";
import { useEffect, useState } from "react";
import { TrendingListSkeleton } from "@/components/shared/PageSkeletons";
import { ReviewActivity } from "@/types";

const TrendingReviewsPage = () => {
    const [reviews, setReviews] = useState<ReviewActivity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrendingReviews = async () => {
        const data = await getTrendingReviews(100);
        setReviews(data);
        setLoading(false);
    }

    useEffect(() => {
        fetchTrendingReviews();
    }, []);

    if (loading)
        return (
            <div className="common-container max-w-7xl mx-auto px-4 py-10 w-full">
                <TrendingListSkeleton type="reviews" />
            </div>
        );

    return <TrendingList title="Top Reviews" items={reviews} type="reviews" />;
};

export default TrendingReviewsPage;