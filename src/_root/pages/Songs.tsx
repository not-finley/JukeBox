import LoaderMusic from "@/components/shared/loaderMusic";

const Songs = () => {
  const isPostLoading = true;
  const songs = null;

  return (
    <div className="flex flex-1">
      <div className="songs-container">
        <div className="songs">
          <h2 className="h3-bold md:h2-bold text-left w-full">Songs</h2>
          {isPostLoading && !songs ?
          (<LoaderMusic/>)
          : (<ul>
              
          </ul>)}
        </div>
      </div>
    </div>
  )
}

export default Songs