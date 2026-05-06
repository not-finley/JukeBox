import { Link, useNavigate } from "react-router-dom";
import { Music, ArrowLeft, Home, Search } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="common-container flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      {/* Animated Icon Section */}
      <div className="relative mb-8">
        <Music className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 text-emerald-500 animate-pulse" />
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
        404: Item Not Found
      </h1>
      <p className="text-gray-400 text-lg max-w-md mb-10 leading-relaxed">
        The user, song, album, artist, or playlist you're looking for doesn't exist.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-800 text-gray-200 hover:bg-gray-700 transition-all border border-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>

        <Link
          to="/"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
        >
          <Home className="w-4 h-4" />
          Back to Feed
        </Link>

        <Link
          to="/search"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-emerald-400 hover:text-emerald-300 transition-all border border-emerald-900/30"
        >
          <Search className="w-4 h-4" />
          Find Music
        </Link>
      </div>
    </div>
  );
};

export default NotFound;