export type INavLink = {
    imgURL: string;
    route: string;
    label: string;
  };
  
  export type IUpdateUser = {
    userId: string;
    name: string;
    bio: string;
    imageId: string;
    imageUrl: URL | string;
    file: File[];
  };
  
  export type INewPost = {
    userId: string;
    caption: string;
    file: File[];
    location?: string;
    tags?: string;
  };
  
  export type IUpdatePost = {
    postId: string;
    caption: string;
    imageId: string;
    imageUrl: URL;
    file: File[];
    location?: string;
    tags?: string;
  };
  
  export type IUser = {
    accountId: string;
    name: string;
    username: string;
    email: string;
    imageUrl: string;
    bio: string;
  };
  
  export type INewUser = {
    name: string;
    email: string;
    username: string;
    password: string;
  };

  export type IContextType = {
    user: IUser;
    isLoading: boolean;
    setUser: React.Dispatch<React.SetStateAction<IUser>>;
    isAuthenticated: boolean;
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
    checkAuthUser: () => Promise<boolean>;
    logout: () => Promise<void>;
  };

  export type Song = {
    songId: string;
    title: string;
    album: string;
    spotify_url: string;
    album_cover_url: string;
    release_date: string,
    popularity: number
  }

  export type Album = {
    albumId: string; 
    title: string; 
    spotify_url: string; 
    album_cover_url: string; 
    release_date: string
  }

  export type AlbumDetails = {
    albumId: string; 
    title: string; 
    spotify_url: string; 
    album_cover_url: string; 
    release_date: string; 
    tracks: Song[]; 
    artists: any[];
    reviews: AlbumReview[];

  }

  export interface SpotifyArtist {
    id: string;
    name: string;
    href: string;
    external_urls: {
      spotify: string;
    };
    type: string;
    uri: string;
  }

  export interface SpotifyArtistDetailed {
    id: string;
    name: string;
    followers: {total: number};
    genres: string[];
    external_urls: {
      spotify: string;
    };
    images: {url:string, height: number, width: number}[]
    albums: SpotifyAlbum[];
  }

  export interface SpotifyAlbum {
    id: string;
    name: string;
    album_type: string;
    href: string;
    external_urls: {
      spotify: string;
    };
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    release_date: string;
    release_date_precision: string;
    total_tracks: number;
    type: string;
    uri: string;
    available_markets?: string[];
  }

  export interface SpotifyAlbumWithTracks {
    id: string;
    name: string;
    album_type: string;
    href: string;
    external_urls: {
      spotify: string;
    };
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    release_date: string;
    release_date_precision: string;
    total_tracks: number;
    type: string;
    uri: string;
    available_markets?: string[];
    tracks: SpotifySong[]; 
    artists: SpotifyArtist[];
  }

  export interface SpotifySong {
    songId: string;
    title: string;
    spotify_url: string;
    album_name: string;
    album_cover_url: string;
    album: SpotifyAlbum;
    artists: SpotifyArtist[];
    release_date: string;
    popularity: number;
  }

  export type Rating = {
    user: IUser,
    rating: number,
    song: Song,
    ratingId: string,
    createdAt: number
  }

  export type SongDetails = {
    songId: string;
    title: string;
    album: string;
    album_id: string;
    spotify_url: string;
    album_cover_url: string;
    release_date: string;
    popularity: number;
    reviews: SongReview[];
    ratings: Rating[];
    artists: any[];
  }

  export type ArtistDetails = {
    artistId: string;
    name: string;
    spotify_url: string;
    image_url: string;
    followers: number;
    genres: string[]; 
    albums: Album[];
  }

  export type SongReview = {
    reviewId: string;
    text : string;
    creator : IUser;
    song: Song;
    likes: string[];
    createdAt: number;
    updatedAt: number;
  }

  export type AlbumReview = {
    reviewId: string;
    text : string;
    creator : IUser;
    album: Album;
    likes: string[];
    createdAt: number;
    updatedAt: number;
  }

  export interface Listened {
    type: "song" | "album";
    id: string;
    name: string;
    album_cover_url: string | null;
    listen_date: string;
  }