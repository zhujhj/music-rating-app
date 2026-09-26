import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";

import { Text, TextInput, View } from "@/components/Themed";
import { TrackCard } from "@/components/TrackCard";
import { createPost } from "@/lib/posts";
import { searchTracks } from "@/lib/spotify";
import { SpotifyTrack } from "@/types/models";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postedIds, setPostedIds] = useState<Set<string>>(new Set());
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [caption, setCaption] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const tracks = await searchTracks(trimmed);
        setResults(tracks);
      } catch (e: any) {
        setError(e.message ?? "Search failed");
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function openComposer(track: SpotifyTrack) {
    setSelectedTrack(track);
    setCaption("");
    setError(null);
  }

  function closeComposer() {
    if (isPosting) return;
    setSelectedTrack(null);
  }

  async function handlePost() {
    if (!selectedTrack) return;
    setIsPosting(true);
    try {
      await createPost(selectedTrack, caption);
      setPostedIds((prev) => new Set(prev).add(selectedTrack.id));
      setSelectedTrack(null);
    } catch (e: any) {
      setError(e.message ?? "Failed to post");
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search for a song..."
        autoCapitalize="none"
        autoCorrect={false}
      />

      {isSearching && <ActivityIndicator style={styles.spinner} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isPosted = postedIds.has(item.id);
          return (
            <View style={styles.row}>
              <TrackCard
                style={styles.trackCardFlex}
                trackName={item.name}
                artistName={item.artists.map((a) => a.name).join(", ")}
                albumArtUrl={item.album.images[0]?.url}
              />
              <Pressable
                style={[styles.postButton, isPosted && styles.postButtonDone]}
                onPress={() => openComposer(item)}
                disabled={isPosted}
              >
                <Text style={styles.postButtonText}>
                  {isPosted ? "Posted" : "Post"}
                </Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          !query.trim() ? (
            <View style={styles.hero} lightColor="#0000" darkColor="#0000">
              <FontAwesome name="music" size={44} color="#8888" />
              <Text style={styles.heroTitle}>Put your friends on!</Text>
              <Text style={styles.heroSubtitle}>
                Search for a song above and share it with the group.
              </Text>
            </View>
          ) : !isSearching ? (
            <Text style={styles.empty}>No results</Text>
          ) : null
        }
      />

      <Modal
        visible={!!selectedTrack}
        animationType="slide"
        transparent
        onRequestClose={closeComposer}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
        <View style={styles.overlayTint} lightColor="#0006" darkColor="#000a">
          <View style={styles.modalCard}>
            {selectedTrack && (
              <TrackCard
                trackName={selectedTrack.name}
                artistName={selectedTrack.artists.map((a) => a.name).join(", ")}
                albumArtUrl={selectedTrack.album.images[0]?.url}
              />
            )}

            <Text style={styles.label}>Caption (optional)</Text>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Say something about this song..."
              multiline
              editable={!isPosting}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.modalActions} lightColor="#0000" darkColor="#0000">
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeComposer}
                disabled={isPosting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.postButton]}
                onPress={handlePost}
                disabled={isPosting}
              >
                {isPosting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.postButtonText}>Post</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#8888",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  spinner: {
    marginTop: 8,
  },
  error: {
    color: "#e0245e",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#8884",
  },
  trackCardFlex: {
    flex: 1,
    minWidth: 0,
  },
  postButton: {
    backgroundColor: "#2f95dc",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 64,
    flexShrink: 0,
    alignItems: "center",
  },
  postButtonDone: {
    backgroundColor: "#8888",
  },
  postButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    opacity: 0.6,
    marginTop: 24,
  },
  listContent: {
    flexGrow: 1,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
  },
  overlayTint: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 10,
  },
  label: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 8,
  },
  captionInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#8888",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#8888",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});
