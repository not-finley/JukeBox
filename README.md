# 🎵 JukeBoxd

A modern social music discovery platform where users can share reviews, rate albums and songs, create playlists, and connect with other music lovers. Powered by Spotify's vast music library and built with cutting-edge web technologies.

**Live Demo:** [jukeboxd.ca]((https://www.jukeboxd.ca/)

---

## ✨ Features

- **Music Reviews & Ratings** – Post detailed reviews and rate tracks and albums
- **Spotify Integration** – Access millions of songs and albums directly through Spotify
- **Playlist Management** – Create custom playlists 
- **User Profiles & Discovery** – Follow other users and discover their music taste
- **Drag-and-Drop Playlist Editing** – Seamless playlist organization with Hello Pangea DnD
- **Secure Authentication** – Supabase auth with session management
- **Cross-Platform** – Web app with mobile support via Capacitor (iOS & Android)
- **Real-Time Interactions** – React Query for optimized data fetching and caching
- **Responsive Design** – TailwindCSS ensures beautiful UI across all devices

---

## 🚀 Quick Start

1. **Sign Up/Login** – Create an account with Supabase authentication
2. **Discover Music** – Search Spotify's library or browse recommendations
3. **Write Reviews** – Rate songs and albums, share your thoughts
4. **Create Playlists** – Build custom playlists with drag-and-drop ease
5. **Connect & Share** – Follow users and explore their music collections
---
## Screenshots
<img width="1879" height="1208" alt="Album" src="https://github.com/user-attachments/assets/f8a2b689-7a0d-43c4-bfa3-295c613b3a8e" />
<img width="446" height="1012" alt="HomePhone" src="https://github.com/user-attachments/assets/96f72740-97fa-4776-a1a0-da54c9cc5d28" />
<img width="1897" height="1011" alt="Trending" src="https://github.com/user-attachments/assets/026f9a4c-d9a5-4471-b7d5-c4a28bb56899" />
<img width="1900" height="1005" alt="Profile" src="https://github.com/user-attachments/assets/7d106882-8def-4fca-a3fd-a8ce2c555637" />
<img width="1894" height="1011" alt="Library" src="https://github.com/user-attachments/assets/41b674d4-73fc-438b-b439-ad6cf32f47ce" />
<img width="1894" height="1011" alt="Playlists" src="https://github.com/user-attachments/assets/21732719-47a7-4d65-9431-98fe9ddec998" />

---

## 🛠️ Tech Stack

### Frontend
- **React 18** – Modern UI library with hooks and concurrent rendering
- **TypeScript** – Type-safe development experience
- **Vite** – Lightning-fast build tool and dev server
- **TailwindCSS** – Utility-first styling with PostCSS
- **Shadcn/ui** – Component library built on Radix UI
- **React Router v7** – Client-side routing
📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Spotify Developer Account ([create here](https://developer.spotify.com/dashboard))
- Supabase Project ([create here](https://supabase.com))

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/not-finley/jukebox.git
   cd jukebox
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APPWRITE_ENDPOINT=your_appwrite_endpoint
   VITE_APPWRITE_PROJECT_ID=your_appwrite_project_id
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser
🗺️ Roadmap

- [x] User authentication and profiles
- [x] Music reviews and ratings
- [x] Spotify integration
- [x] Playlist creation and management
- [x] Enhanced social features (follow, activity feed)
- [ ] Personalized recommendations engine
- [ ] Advanced user analytics (Wrapped-style insights)
- [ ] Collaborative playlists
- [ ] Music statistics and listening trends
- [ ] Mobile app optimization (iOS/Android)
   ```

### Mobile Development

To build iOS/Android apps:
```bash
npx cap add ios
npx cap add android
npx cap build ios
npx cap build android
```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory with the following:
   ```env
   REACT_APP_SPOTIFY_CLIENT_ID=your_spotify_client_id
   REACT_APP_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   REACT_APP_APPWRITE_ENDPOINT=your_appwrite_endpoint
   REACT_APP_APPWRITE_PROJECT_ID=your_appwrite_project_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

---


## Roadmap
- **Social Features:** Follow your friends or other accounts and get updated on their activity.
- **Personalized Recommendations:** Explore music tailored to your preferences.
- **Playlist Sharing:** Allow users to create and share playlists, and import exsiting ones from spotify.
- **Advanced Analytics:** Provide insights into user listening trends. (Like Spotify wrapped but year round)

---

## Contributing

I welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`feature/your-feature-name`).
3. Commit your changes and push to your branch.
4. Open a pull request.

---

## Acknowledgments

- [Spotify API](https://developer.spotify.com/documentation/web-api/)
- [Appwrite](https://appwrite.io/)
- [React](https://reactjs.org/)

---

## Contact

For questions or feedback, feel free to reach out:
- **Email:** [fharriso@uwaterloo.ca](mailto:fharriso@uwaterloo.ca)
- **GitHub:** [not-finley](https://github.com/not-finley)
- **LinkedIn:** [Finley Harrison](https://www.linkedin.com/in/finley-harrison-163b16291/)
