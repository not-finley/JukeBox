# JukeBox

JukeBox is a social media platform designed for music lovers to share, rate, and discover music. Built using modern web development frameworks, JukeBox integrates the Spotify API to enhance music discovery and provides a seamless, user-friendly experience.

---

## Features

- **Dynamic Music Reviews:** Users can post reviews, rate albums, and interact with others' opinions.
- **Spotify Integration:** Search and explore music directly from Spotify's extensive library.
- **User Authentication:** Secure login and account management through Appwrite.
- **Personalized Recommendations:** Algorithms suggest music based on user preferences and interactions.
- **Responsive Design:** Optimized for desktop and mobile for an enhanced user experience.

---

## Tech Stack

### Frontend:
- **React**: A JavaScript library for building user interfaces.
- **TailWind CSS**: Ensures responsive and visually appealing design.

### Backend:
- **Appwrite**: Manages database and user authentication.
- **Spotify API**: Powers music search and discovery features.

---

## Installation

### Prerequisites:
1. Node.js and npm installed.
2. An Appwrite instance set up.
3. Spotify API credentials (client ID and secret).

### Steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/not-finley/jukebox.git
   cd jukebox
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
   npm start
   ```

   The application will run on `http://localhost:3000` by default.

---

## Usage

1. **Sign Up/Login:** Create an account or log in securely using the Appwrite authentication system.
2. **Discover Music:** Search for tracks and albums directly via the Spotify API.
3. **Write Reviews:** Post your thoughts, rate music, and engage with other users.
4. **Personalized Recommendations:** Explore music tailored to your preferences.

---

## Screenshots

![Songs Desktop](https://github.com/user-attachments/assets/e2b7f21a-fd38-4f65-ad19-bf13472269be)
![Soongs Mobile](https://github.com/user-attachments/assets/aea59b90-0795-4932-bac4-8bbb110bcf53)

![Log-in](https://github.com/user-attachments/assets/e7bf31eb-76f9-4692-b851-cdcbd92b47c1)


## Roadmap

- **Playlist Sharing:** Allow users to create and share playlists.
- **Advanced Analytics:** Provide insights into user listening trends.
- **Social Features:** Add the ability to follow other users and see their reviews.
- **Dark Mode:** Enhance the UI with a dark theme option.

---

## Contributing

We welcome contributions! Please follow these steps:

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
