import React, { useState, useEffect } from "react";
import { Playlist as PlaylistType, PSong, IUser } from "@/types";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Link } from "react-router-dom";

const GRID_LAYOUT = "grid-cols-[30px_1fr_40px] sm:grid-cols-[40px_4fr_3fr_40px]";

interface PlaylistProps {
  playlist: PlaylistType;
  currentUser: IUser;
  onUpdate?: (updatedPlaylist: PlaylistType) => Promise<void>;
}

export const Playlist: React.FC<PlaylistProps> = ({ playlist, currentUser, onUpdate }) => {
  const isOwner = playlist.creators?.some((c) => c.accountId === currentUser.accountId);
  const [songs, setSongs] = useState<PSong[]>(playlist.songs || []);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if playlist prop changes externally
  useEffect(() => {
    setSongs(playlist.songs || []);
  }, [playlist.songs]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const reordered = Array.from(songs);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    
    // Update local UI immediately for snappiness
    setSongs(reordered);
  };

  const handleSave = async () => {
    if (onUpdate) {
      setIsSaving(true);
      await onUpdate({ ...playlist, songs });
      setIsSaving(false);
    }
    setEditMode(false);
  };

  const removeSong = (songId: string) => {
    setSongs(prev => prev.filter(s => s.songId !== songId));
  };

  return (
    <div className="common-container max-w-5xl mx-auto pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row gap-8 items-end mb-10 px-4">
        <div className="relative group overflow-hidden rounded-xl shadow-2xl w-48 h-48 sm:w-60 sm:h-60 shrink-0">
          <img
            src={playlist.cover_url || "/assets/icons/music-placeholder.svg"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {isOwner && (
             <div className="absolute inset-0 bg-black/40 flex-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-white text-sm font-bold">Change Cover</span>
             </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-emerald-500 font-bold uppercase tracking-[0.2em] text-xs">Public Playlist</p>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-none">{playlist.name}</h1>
          <div className="flex items-center gap-2 text-gray-400 text-sm mt-4">
            <span className="font-bold text-gray-200">{playlist.creators?.[0]?.username}</span>
            <span>•</span>
            <span>{songs.length} songs</span>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold p-4 rounded-full transition-transform hover:scale-105 shadow-lg">
              <img src="/assets/icons/play.svg" className="w-6 h-6" />
            </button>
            {isOwner && (
              <button 
                onClick={() => editMode ? handleSave() : setEditMode(true)}
                className={`px-6 py-2 rounded-full font-bold border-2 transition-all ${
                    editMode ? "border-emerald-500 text-emerald-500 bg-emerald-500/10" : "border-gray-700 text-white hover:border-white"
                }`}
              >
                {isSaving ? "Saving..." : editMode ? "Finish Editing" : "Edit Playlist"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SONGS LIST */}
      <div className="w-full">
        {/* Table Header */}
        <div className={`grid ${GRID_LAYOUT} px-4 py-2 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-800/50`}>
          <span className="text-center">#</span>
          <span>Title</span>
          <span className="hidden sm:block">Album</span>
          <span></span>
        </div>

        {editMode ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="playlist-editor">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="mt-2">
                  {songs.map((song, index) => (
                    <Draggable key={song.songId} draggableId={song.songId} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`grid ${GRID_LAYOUT} items-center px-4 py-3 mb-1 rounded-lg border transition-all ${
                            snapshot.isDragging ? "bg-gray-800 border-emerald-500/50 shadow-2xl z-50" : "bg-gray-900/40 border-transparent hover:bg-gray-800/40"
                          }`}
                        >
                          <div {...provided.dragHandleProps} className="flex-center">
                            <img src="/assets/icons/drag-handle.svg" className="w-4 h-4 opacity-40" />
                          </div>
                          <div className="flex items-center gap-3">
                            <img src={song.album_cover_url} className="w-10 h-10 rounded shadow-md" />
                            <p className="text-white font-medium truncate">{song.title}</p>
                          </div>
                          <span className="hidden sm:block text-gray-500 text-sm truncate">{song.album}</span>
                          <button onClick={() => removeSong(song.songId)} className="text-gray-500 hover:text-red-500 transition-colors">
                            <img src="/assets/icons/delete.svg" className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div className="flex flex-col">
            {songs.map((song, index) => (
              <Link
                key={song.songId}
                to={`/song/${song.songId}`}
                className="group grid ${GRID_LAYOUT} items-center px-4 py-3 hover:bg-white/5 transition-colors rounded-lg"
              >
                <span className="text-gray-500 group-hover:text-emerald-400 text-sm text-center">{index + 1}</span>
                <div className="flex items-center gap-4 min-w-0">
                  <img src={song.album_cover_url} className="w-10 h-10 rounded shadow-md" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-medium truncate">{song.title}</span>
                    <span className="text-gray-500 text-xs truncate">{song.artists?.[0]?.name}</span>
                  </div>
                </div>
                <span className="hidden sm:block text-gray-400 text-sm truncate">{song.album}</span>
                <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity">
                  <img src="/assets/icons/more.svg" className="w-5 h-5" />
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};