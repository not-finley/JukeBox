import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUserContext } from "@/lib/AuthContext";
import { addReviewSong, getSongDetailsById } from "@/lib/appwrite/api";
import { Song } from "@/types";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import LoaderMusic from "@/components/shared/loaderMusic";
import { toast } from "@/hooks/use-toast";



const formSchema = z.object({
  text: z.string().min(1).max(100000),
})

const AddReviewSong = () => {
  const { id } = useParams();
  const [song, setSong] = useState<SongDetails | null>(null);
  const { user } = useUserContext();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
    },
  })


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const review = await addReviewSong(song ? song.songId : '', user.accountId, values.text);
    if (!review) {
      return toast({ title: "Failed to add review. Please try again." })
    }

    form.reset();
    navigate(`/song/${song?.songId}`);
    setLoading(false);
    return toast({ title: "Review Added!" })
  }

  useEffect(() => {
    const fetchSong = async () => {
      const fetchedSong = await getSongDetailsById(id || "");
      setSong(fetchedSong);
    };

    fetchSong();
  }, [id]);

  if (!song) {
    return (
      <div className="common-container">
        <LoaderMusic />
      </div>
    )
  }

  return (
    <div className="common-container">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row">
        <div className="lg:w-1/3 flex-shrink-0 mb-8 lg:mb-0">
          <img
            src={song.album_cover_url}
            alt="Album Cover"
            className="rounded-lg shadow-lg"
          />
        </div>

        <div className="lg:w-2/3 lg:ml-8">
          <h1 className="lg:text-4xl md:text-2xl sm:text-3xl xs:text-2xl mb-4"><p className="font-bold">{song.title}</p> {song.album}</h1>
          <p className="text-lg text-gray-300 mb-4">
            <span>{song?.release_date.slice(0, 4)}</span> | By{" "}
            {song?.artists.map((a: any, i: number) => (
              <Link to={`/artist/${a.artist_id}`} key={a.id} className="hover:text-white">
                {a.name}
                {i < song.artists.length - 1 ? ", " : ""}
              </Link>
            ))}
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Write your review:</FormLabel>
                    <FormControl>
                      <Textarea className="shad-textarea text-white mt-2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="shad-button_primary" type="submit">
                {loading ? (
                  <div className="flex-center gap-2">
                    <LoaderMusic />
                  </div>
                ) : 'Submit'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}

export default AddReviewSong