import TrendingList from "@/components/TrendingList";
import { getTrendingAlbums } from "@/lib/supabase/api";
import { useEffect, useState } from "react";
import { TrendingListSkeleton } from "@/components/shared/PageSkeletons";
import { AlbumActivity } from "@/types";

const TrendingAlbumsPage = () => {
    const [albums, setAlbums] = useState<AlbumActivity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrendingAlbums = async () => {
        const data = await getTrendingAlbums(100);
        setAlbums(data);
        setLoading(false);
    }

    useEffect(() => {
        fetchTrendingAlbums();
    }, []);

    if (loading)
        return (
            <div className="common-container max-w-7xl mx-auto px-4 py-10 w-full">
                <TrendingListSkeleton type="albums" />
            </div>
        );

    return <TrendingList title="Top Albums" items={albums} type="albums" />;
};

export default TrendingAlbumsPage;