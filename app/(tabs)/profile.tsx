import { useFocusEffect } from "@react-navigation/native";
import { Link } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from "react-native";

import { Text, TextInput, View } from "@/components/Themed";
import { TrackCard } from "@/components/TrackCard";
import { fetchPostsRatedByUser } from "@/lib/posts";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/models";

export default function ProfileScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [topRated, setTopRated] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    setUserId(userData.user.id);
    setEmail(userData.user.email ?? null);

    const [{ data: profile }, tens] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", userData.user.id).single(),
      fetchPostsRatedByUser(userData.user.id, 10),
    ]);

    if (profile) setDisplayName(profile.display_name);
    setTopRated(tens);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setIsLoading(false));
    }, [load])
  );

  async function saveDisplayName() {
    if (!userId) return;
    setIsSaving(true);
    setError(null);
    setSaved(false);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", userId);

    setIsSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={topRated}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Link href={`/post/${item.id}`} asChild>
          <Pressable style={({ pressed }) => [styles.trackRow, pressed && styles.pressed]}>
            <TrackCard
              trackName={item.track_name}
              artistName={item.artist_name}
              albumArtUrl={item.album_art_url}
            />
          </Pressable>
        </Link>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>You haven't rated anything a 10 yet.</Text>
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email}</Text>

          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              setSaved(false);
            }}
            editable={!isSaving}
          />

          <Pressable
            style={[styles.button, isSaving && styles.buttonDisabled]}
            onPress={saveDisplayName}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save</Text>
            )}
          </Pressable>

          {saved && <Text style={styles.success}>Saved</Text>}
          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>My 10/10s</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 16,
  },
  value: {
    fontSize: 16,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#8888",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2f95dc",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  success: {
    color: "#17bf63",
    textAlign: "center",
  },
  error: {
    color: "#e0245e",
    textAlign: "center",
  },
  signOutButton: {
    marginTop: 32,
    alignItems: "center",
  },
  signOutText: {
    color: "#e0245e",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 32,
  },
  trackRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#8884",
  },
  pressed: {
    opacity: 0.6,
  },
  empty: {
    textAlign: "center",
    opacity: 0.6,
    marginTop: 12,
  },
});
