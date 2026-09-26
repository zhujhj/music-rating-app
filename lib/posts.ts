import { supabase } from "@/lib/supabase";
import { FeedPost, Post, SpotifyTrack } from "@/types/models";

export async function fetchFeed(): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as FeedPost[];
}

export async function fetchPostById(id: string): Promise<FeedPost> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as FeedPost;
}

export async function fetchPostsRatedByUser(userId: string, score = 10): Promise<Post[]> {
  const { data, error } = await supabase
    .from("ratings")
    .select("posts(*)")
    .eq("user_id", userId)
    .eq("score", score)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row: any) => row.posts).filter(Boolean) as Post[];
}

export async function createPost(track: SpotifyTrack, caption?: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Not signed in");

  const { error } = await supabase.from("posts").insert({
    user_id: userData.user.id,
    spotify_track_id: track.id,
    track_name: track.name,
    artist_name: track.artists.map((a) => a.name).join(", "),
    album_name: track.album.name,
    album_art_url: track.album.images[0]?.url ?? null,
    spotify_url: track.external_urls?.spotify ?? null,
    caption: caption?.trim() || null,
  });

  if (error) throw error;
}
