import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, X } from "lucide-react";
import { processPlaylistCover, createPlaylist } from "@/lib/appwrite/api";
import { useUserContext } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";

const CreatePlaylist = () => {
    const { user } = useUserContext();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (rawFile) {
            setLoading(true);
            try {
                const processedBlob = await processPlaylistCover(rawFile);
                const processedFile = new File([processedBlob], "cover.webp", { type: "image/webp" });
                
                setFile(processedFile);
                setPreview(URL.createObjectURL(processedFile));
            } catch (err) {
                console.error("Image processing failed", err);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleCreate = async () => {
        if (!name || !user) return;
        
        setLoading(true);
        try {
            // Process the image first (using the function we designed earlier)
            let processedFile = null;
            if (file) {
            const blob = await processPlaylistCover(file);
            processedFile = new File([blob], "cover.webp", { type: "image/webp" });
            }

            const result = await createPlaylist(
            user.accountId, 
            name, 
            description, 
            processedFile
            );

            if (result.success) {
            toast({ title: "Playlist created!" });
            navigate(`/playlist/${result.playlistId}`);
            } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading  (false);
        }
        };

    return (
        <div className="common-container flex-center">
            {loading ? (
                <p className="text-white text-lg">Processing...</p>
            ) : (
            <div className="max-w-2xl w-full bg-gray-900/40 border border-gray-800 p-8 rounded-3xl backdrop-blur-xl">
                <h2 className="h3-bold md:h2-bold mb-8">Create New Playlist</h2>
                
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Image Upload Area */}
                    <div className="w-full md:w-64 aspect-square bg-dark-3 rounded-2xl border-2 border-dashed border-gray-700 flex-center overflow-hidden relative group">
                        {preview ? (
                            <>
                                <img src={preview} className="w-full h-full object-cover" />
                                <button onClick={() => setPreview("")} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition">
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <label className="flex flex-col items-center cursor-pointer hover:text-emerald-500 transition">
                                <ImagePlus size={40} strokeWidth={1} />
                                <span className="text-xs mt-2 uppercase font-black tracking-widest">Add Cover</span>
                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                        )}
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-gray-400">Playlist Name</label>
                            <Input 
                                placeholder="Give your playlist a name" 
                                className="shad-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-gray-400">Description (Optional)</label>
                            <textarea 
                                placeholder="What's the vibe?" 
                                className="shad-input min-h-[100px] py-3 resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-4 mt-4">
                            <Button variant="ghost" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
                            <Button 
                                onClick={handleCreate} 
                                disabled={!name}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                            >
                                Create
                            </Button>
                        </div>
                    </div>
                </div>
            </div>)}
        </div>
    );
};

export default CreatePlaylist;