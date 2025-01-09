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
    spotify_url: string;
    album_cover_url: string;
    release_date: string,
    popularity: number,
    review: Review[],
    ratings: Rating[],
  }

  export type Review = {
    reviewId: string;
    text : string;
    creator : IUser;
    song: Song;
    likes: string[];
    createdAt: number;
    updatedAt: number;
  }

  export type Listened = {
    createdAt: number;
    listenedId: string;
    song: Song;
    user: IUser
  }
 