import TrendingList from "@/components/TrendingList";
import { getTrendingAlbums } from "@/lib/appwrite/api";
import { useEffect, useState } from "react";
import LoaderMusic from "@/components/shared/loaderMusic";
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

    if (loading) return <LoaderMusic />;

    return <TrendingList title="Top Albums" items={albums} type="albums" />;
};

export default TrendingAlbumsPage;