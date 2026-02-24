import TrendingList from "@/components/TrendingList";
import { getTrendingSongs } from "@/lib/appwrite/api";
import { useEffect, useState } from "react";
import LoaderMusic from "@/components/shared/loaderMusic";
import { SongActivity } from "@/types";

const TrendingSongsPage = () => {
    const [songs, setSongs] = useState<SongActivity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrendingSongs = async () => {
        const data = await getTrendingSongs(100);
        setSongs(data);
        setLoading(false);
    }

    useEffect(() => {
        fetchTrendingSongs();
    }, []);

    if (loading) return <LoaderMusic />;

    return <TrendingList title="Top Songs" items={songs} type="songs" />;
};

export default TrendingSongsPage;