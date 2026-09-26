import { supabase } from "@/lib/supabase";
import { SpotifyTrack } from "@/types/models";

export async function searchTracks(query: string): Promise<SpotifyTrack[]> {
  const { data, error } = await supabase.functions.invoke("spotify-search", {
    body: { q: query },
  });

  if (error) throw error;
  return data.tracks as SpotifyTrack[];
}
