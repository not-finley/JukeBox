import { ISearchUser } from "@/types";
import LoaderMusic from "./shared/loaderMusic";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "hide_suggestions_widget";

const SuggestionsList = ({
  suggestions,
  loading,
  onFollow,
}: {
  suggestions: ISearchUser[];
  loading: boolean;
  onFollow: (id: string) => void;
}) => {
  const [hidden, setHidden] = useState(false);

  // check if user has hidden suggestions previously
  useEffect(() => {
    const flag = localStorage.getItem(STORAGE_KEY);
    if (flag === "true") setHidden(true);
  }, []);

  const hideWidget = () => {
    setHidden(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  // ✅ auto-hide if there are NO suggestions AND not loading
  if (hidden || (!loading && suggestions.length === 0)) return null;

  return (
    <div className="p-4 rounded-xl border border-gray-800 w-full max-w-2xl mx-auto mt-4">
      {/* Title + hide button */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">People you may know</h2>
        <button
          onClick={hideWidget}
          className="text-gray-500 hover:text-gray-300 transition"
        >
          <X size={18} />
        </button>
      </div>

      {loading && <LoaderMusic />}

      <div className="flex overflow-x-auto gap-4 no-scrollbar py-2">
        {suggestions.map((u) => (
          <div
            key={u.id}
            className="flex flex-col items-center min-w-[120px] max-w-[120px]"
          >
            <Link to={`/profile/${u.id}`}>
              <img
                src={u.avatar_url}
                className="w-16 h-16 rounded-full object-cover border border-gray-700"
              />
            </Link>

            <Link to={`/profile/${u.id}`}>
              <p className="text-gray-200 text-sm mt-1 text-center line-clamp-1">
                {u.username}
              </p>
            </Link>

            <p className="text-gray-300 text-sm mt-1 text-center line-clamp-1">{u.mutual_count} mutual follows</p>

            <button
              onClick={() => onFollow(u.id)}
              className="mt-1 text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};


export default SuggestionsList;
