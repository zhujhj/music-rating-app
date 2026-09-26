import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";

import { CommentItem } from "@/components/CommentItem";
import { RatingBadge } from "@/components/RatingBadge";
import { RatingInput } from "@/components/RatingInput";
import { Text, TextInput, View } from "@/components/Themed";
import { TrackCard } from "@/components/TrackCard";
import { createComment, fetchComments } from "@/lib/comments";
import { fetchPostById } from "@/lib/posts";
import { fetchMyRating, fetchRatingsForPost, upsertRating } from "@/lib/ratings";
import { Comment, FeedPost } from "@/types/models";
import dayjs from "dayjs";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [postData, commentsData, myRating, ratings] = await Promise.all([
        fetchPostById(id),
        fetchComments(id),
        fetchMyRating(id),
        fetchRatingsForPost(id),
      ]);
      const scoreByUser = new Map(ratings.map((r) => [r.user_id, r.score]));
      setPost(postData);
      setComments(
        commentsData.map((c) => ({
          ...c,
          rating: scoreByUser.get(c.user_id) ?? null,
        }))
      );
      setMyScore(myRating?.score ?? null);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? "Failed to load post");
    }
  }, [id]);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  async function onRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  async function handleRate(score: number) {
    if (!id) return;
    setIsRating(true);
    setMyScore(score);
    try {
      await upsertRating(id, score);
      await load();
    } catch (e: any) {
      setError(e.message ?? "Failed to rate");
    } finally {
      setIsRating(false);
    }
  }

  async function handleComment() {
    if (!id || !commentBody.trim()) return;
    setIsCommenting(true);
    try {
      await createComment(id, commentBody.trim());
      setCommentBody("");
      await load();
    } catch (e: any) {
      setError(e.message ?? "Failed to comment");
    } finally {
      setIsCommenting(false);
    }
  }

  if (isLoading || !post) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommentItem comment={item} />}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <TrackCard
              trackName={post.track_name}
              artistName={post.artist_name}
              albumArtUrl={post.album_art_url}
              spotifyUrl={post.spotify_url}
            />
            <RatingBadge avgRating={post.avg_rating} ratingCount={post.rating_count} />
            {post.caption && <Text style={styles.caption}>{post.caption}</Text>}
            <Text style={styles.author}>posted by {post.author_name}</Text>
            <Text style={styles.date}>{dayjs(post.created_at).fromNow()}</Text>

            <Text style={styles.sectionTitle}>Your rating</Text>
            <RatingInput value={myScore} onChange={handleRate} disabled={isRating} />

            <Text style={styles.sectionTitle}>
              Comments ({comments.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No comments yet</Text>
        }
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.commentBar}>
        <TextInput
          style={styles.commentInput}
          value={commentBody}
          onChangeText={setCommentBody}
          placeholder="Add a comment..."
          editable={!isCommenting}
        />
        <Pressable
          style={[styles.sendButton, isCommenting && styles.sendButtonDisabled]}
          onPress={handleComment}
          disabled={isCommenting || !commentBody.trim()}
        >
          {isCommenting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: {
    gap: 8,
    paddingVertical: 16,
  },
  caption: {
    fontSize: 15,
  },
  author: {
    fontSize: 12,
    opacity: 0.5,
  },
  date: {
    fontSize: 12,
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
  },
  empty: {
    textAlign: "center",
    opacity: 0.6,
    marginTop: 8,
  },
  error: {
    color: "#e0245e",
    textAlign: "center",
    paddingVertical: 4,
  },
  commentBar: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#8884",
  },
  commentInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#8888",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: "#2f95dc",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
