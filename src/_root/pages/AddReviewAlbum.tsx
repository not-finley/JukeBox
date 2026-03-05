import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUserContext } from "@/lib/AuthContext";
import { addReviewAlbum, getAlbumDetailsById } from "@/lib/appwrite/api";
import { AlbumDetails } from "@/types";
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import LoaderMusic from "@/components/shared/loaderMusic";
import { toast } from "@/hooks/use-toast";
import Loader from "@/components/shared/loader";
import { FaSpotify } from "react-icons/fa";

const formSchema = z.object({
  title: z.string().max(100, "Title is too long!").optional(),
  text: z.string().min(1, "Review cannot be empty.").max(10000, "Too long!"),
});

const AddReviewAlbum = () => {
  const { id } = useParams();
  const [album, setAlbum] = useState<AlbumDetails | null>(null);
  const { user } = useUserContext();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      title: "",
      text: "" 
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const review = await addReviewAlbum(album?.albumId || "", user.accountId, values.text, values.title);

      if (!review) {
        toast({ title: "Failed to add review. Please try again." });
        setLoading(false);
        return;
      }

      toast({ title: "Review Added!" });
      form.reset();
      navigate(`/album/${album?.albumId}`);
    } catch (error) {
      console.error("Error adding review:", error);
      toast({ title: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const fetchAlbum = async () => {
      const fetchedalbum = await getAlbumDetailsById(id || "");
      setAlbum(fetchedalbum);
    };
    fetchAlbum();
  }, [id]);

  if (!album) {
    return (
      <div className="common-container">
        <LoaderMusic />
      </div>
    );
  }

  return (
    <div className="common-container text-white">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
        {/* LEFT COLUMN - Album Info */}
        <div className="lg:w-1/3 flex flex-col items-center text-center">
          <img
            src={album.album_cover_url}
            alt={album.title}
            className="rounded-lg shadow-lg mb-4"
          />
          <h1 className="text-3xl font-bold mb-2">{album.title}</h1>
          <p className="text-gray-400 mb-2">
            {album.artists?.map((a, i) => (
              <span key={a.artist_id}>
                <Link
                  to={`/artist/${a.artist_id}`}
                  className="hover:text-emerald-400"
                >
                  {a.name}
                </Link>
                {i < album.artists.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Released {album.release_date?.slice(0, 4)}
          </p>

          {album.spotify_url && (
            <a
              href={album.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-black font-semibold py-2 px-4 rounded-lg shadow-md transition w-fit"
            >
              <FaSpotify className="text-xl" />
              <span>Listen on Spotify</span>
            </a>
          )}

          <Link
            to={`/album/${album.albumId}`}
            className="mt-4 text-sm text-emerald-400 hover:underline"
          >
            ← Back to Album
          </Link>
        </div>

        {/* RIGHT COLUMN - Review Form */}
        <div className="lg:w-2/3">
          <h2 className="text-2xl font-bold mb-6">Write Your Review</h2>

          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Title (Optional)</FormLabel>
                      <FormControl>
                        <input
                          className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                          placeholder="Summarize your review..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">
                        Share your thoughts:
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="shad-textarea text-white mt-2 h-48 resize-none"
                          placeholder="What did you think of this album?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  className="shad-button_primary w-full"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex-center gap-2">
                      <Loader /> Submitting...
                    </div>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddReviewAlbum;
