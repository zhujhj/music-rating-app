import { supabase } from "@/lib/supabase";
import { Comment } from "@/types/models";

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(display_name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    body: row.body,
    created_at: row.created_at,
    author_name: row.profiles?.display_name,
  }));
}

export async function createComment(postId: string, body: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Not signed in");

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: userData.user.id,
    body,
  });

  if (error) throw error;
}
