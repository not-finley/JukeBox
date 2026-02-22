import { Routes, Route } from 'react-router-dom';


import './globals.css';
import AuthLayout from './_auth/AuthLayout';
import RootLayout from './_root/RootLayout';
import SigninForm from './_auth/forms/SigninForm';
import SignupForm from './_auth/forms/SignupForm';
import { Home, Songs, Library, UpdateProfile, AddReviewSong, AddReviewAlbum, Artist, Album, Discography, ReviewPage } from './_root/pages';
import { Toaster } from "@/components/ui/toaster"
import Search from './_root/pages/Search';
import { Helmet } from 'react-helmet';
import SongDetailsSection from './_root/pages/SongDetails';
import LibraryReviews from './_root/pages/LibraryReviews';
import LibraryRatings from './_root/pages/LibraryRatings';
import LibraryListened from './_root/pages/LibraryListened';
import ResetPasswordPage from './_auth/ResetPage';
import ForgotPasswordPage from './_auth/ForgotPasswordPage';
import SignedInLayout from './_root/SignedInLayout';
import SelectAuth from './_auth/forms/SelectAuth';
import PlaylistPage from './_root/pages/PlaylistPage';
import CreatePlaylist from './_root/pages/CreatePlaylist';
import NewProfile from './_root/pages/NewProfile';

const App = () => {
  return (
  <main className="flex flex-col min-h-screen">
        <Helmet>
          <meta name="description" content="A place to review and share music!"></meta>
        </Helmet>
        <Routes>
            {/* public routes */}
            <Route element={<AuthLayout />}>
              <Route path="/auth-select" element={<SelectAuth />}/>
              <Route path="/sign-up" element={<SignupForm />}/>
              <Route path="/sign-in" element={<SigninForm />}/>
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
            </Route>

            <Route element={<RootLayout />}>
              <Route path="/trending" element={<Songs />}/>
              <Route path="/profile/:id/*" element={<NewProfile />}/>
              <Route path="/song/:id" element={<SongDetailsSection />}/>
              <Route path="/review/:id" element={<ReviewPage />}/>
              <Route path="/artist/:id" element={<Artist />}/>
              <Route path="/artist/:id/discography" element={<Discography />}/>
              <Route path="/album/:id" element={<Album />}/>
              <Route path="/search" element={<Search  />}/>
              <Route path="/playlist/:id" element={<PlaylistPage />}/>
            </Route>
            {/* private routes */}
            <Route element={<SignedInLayout />}>
              <Route index element={<Home />}/>
              <Route path="/library" element={<Library />}/>
              <Route path="/library/reviews" element={<LibraryReviews />}/>
              <Route path="/library/rated" element={<LibraryRatings />}/>
              <Route path="/library/listened" element={<LibraryListened />}/>
              <Route path="/update-profile/:id" element={<UpdateProfile />}/>
              <Route path="/song/:id/add-review" element={<AddReviewSong />}/>
              <Route path="/album/:id/add-review" element={<AddReviewAlbum />}/>
              <Route path="/create-playlist" element={<CreatePlaylist />}/>
            </Route>
        </Routes>
        <Toaster />
    </main>
  )
}

export default App