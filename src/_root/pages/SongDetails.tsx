
import Loader from "@/components/shared/loader";
import { useLocation, useParams } from "react-router-dom"

const SongDetails = () => {
  const { id } = useParams();
  console.log(id);
  const { pathname } = useLocation();


  // const { data: currentSong } = useGetSongById(id || "");

  // if (!currentSong) 
  //   return (
  //     <div>
  //       <Loader />
  //     </div>
  //   );
  return (
    <div>
      {/* <img
        src={currentSong.coverUrl}
      /> */}
      test
    </div>
  )
}

export default SongDetails