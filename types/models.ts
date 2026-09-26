export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  spotify_track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  album_art_url: string | null;
  spotify_url: string | null;
  caption: string | null;
  created_at: string;
};

export type FeedPost = Post & {
  author_name: string;
  avg_rating: number;
  rating_count: number;
  comment_count: number;
};

export type Rating = {
  id: string;
  post_id: string;
  user_id: string;
  score: number;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_name?: string;
  rating?: number | null;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  external_urls: { spotify: string };
};
