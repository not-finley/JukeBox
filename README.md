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
   npm run dev
   ```

---

## Usage

1. **Sign Up/Login:** Create an account or log in securely using the Appwrite authentication system.
2. **Discover Music:** Search for tracks and albums directly via the Spotify API.
3. **Write Reviews:** Post your thoughts, rate music, and engage with other users.
---

## Screenshots
![Home_Phone](https://github.com/user-attachments/assets/efffe66b-0db8-4f01-9efa-0443d9558e7c)
![Home_Desktop](https://github.com/user-attachments/assets/b60e1fcb-27b1-42c3-8a90-8726d7fad46e)

![search](https://github.com/user-attachments/assets/24a8b76e-086e-45fc-9e2f-8688abebba00)

![library](https://github.com/user-attachments/assets/5e8de02b-c956-4064-9686-5ebb11520875)
![song_details](https://github.com/user-attachments/assets/ad1d7151-66ca-424b-8cd9-db2817e76e97)



![Log-in](https://github.com/user-attachments/assets/e7bf31eb-76f9-4692-b851-cdcbd92b47c1)


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
