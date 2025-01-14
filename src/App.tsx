import { Routes, Route } from 'react-router-dom';


import './globals.css';
import AuthLayout from './_auth/AuthLayout';
import RootLayout from './_root/RootLayout';
import SigninForm from './_auth/forms/SigninForm';
import SignupForm from './_auth/forms/SignupForm';
import { Home, Songs, Library, AllUsers, Profile, UpdateProfile, AddReview } from './_root/pages';
import { Toaster } from "@/components/ui/toaster"
import Search from './_root/pages/Search';
import { Helmet } from 'react-helmet';
import SongDetailsSection from './_root/pages/SongDetails';
import TopTracks from './_root/pages/TopTracks';
import LibraryReviews from './_root/pages/LibraryReviews';
import LibraryRatings from './_root/pages/LibraryRatings';
import LibraryListened from './_root/pages/LibraryListened';

const App = () => {
  return (
    <main className="flex h-screen">
        <Helmet>
          <meta name="description" content="A place to review and share your music!"></meta>
        </Helmet>
        <Routes>
            {/* public routes */}
            <Route element={<AuthLayout />}>
                <Route path="/sign-up" element={<SignupForm />}/>
                <Route path="/sign-in" element={<SigninForm />}/>
            </Route>
            {/* private routes */}
            <Route element={<RootLayout />}>
                <Route index element={<Home />}/>
                <Route path="/songs" element={<Songs />}/>
                <Route path="/library" element={<Library />}/>
                <Route path="/library/reviews" element={<LibraryReviews />}/>
                <Route path="/library/rated" element={<LibraryRatings />}/>
                <Route path="/library/listened" element={<LibraryListened />}/>
                <Route path="/all-users" element={<AllUsers />}/>
                <Route path="/profile/:id/*" element={<Profile />}/>
                <Route path="/update-profile/:id" element={<UpdateProfile />}/>
                <Route path="/song/:id" element={<SongDetailsSection />}/>
                <Route path="/song/:id/add-review" element={<AddReview />}/>
                <Route path="/search" element={<Search  />}/>
                <Route path="/toptracks" element={<TopTracks />}/>
            </Route>
        </Routes>
        <Toaster />
    </main>
  )
}

export default App