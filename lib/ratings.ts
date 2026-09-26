import { supabase } from "@/lib/supabase";
import { Rating } from "@/types/models";

export async function fetchMyRating(postId: string): Promise<Rating | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Rating | null;
}

export async function fetchRatingsForPost(postId: string): Promise<Rating[]> {
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("post_id", postId);

  if (error) throw error;
  return data as Rating[];
}

export async function upsertRating(postId: string, score: number): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Not signed in");

  const { error } = await supabase.from("ratings").upsert(
    {
      post_id: postId,
      user_id: userData.user.id,
      score,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "post_id,user_id" }
  );

  if (error) throw error;
}
