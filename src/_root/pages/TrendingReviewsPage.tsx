import TrendingList from "@/components/TrendingList";
import { getTrendingReviews } from "@/lib/appwrite/api";
import { useEffect, useState } from "react";
import LoaderMusic from "@/components/shared/loaderMusic";
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

    if (loading) return <LoaderMusic />;

    return <TrendingList title="Top Reviews" items={reviews} type="reviews" />;
};

export default TrendingReviewsPage;