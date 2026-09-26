import { Link } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { RatingBadge } from "@/components/RatingBadge";
import { Text, View } from "@/components/Themed";
import { TrackCard } from "@/components/TrackCard";
import { FeedPost } from "@/types/models";
import dayjs from "dayjs";

export function PostListItem({ post }: { post: FeedPost }) {
  return (
    <Link href={`/post/${post.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
        <TrackCard
          trackName={post.track_name}
          artistName={post.artist_name}
          albumArtUrl={post.album_art_url}
          spotifyUrl={post.spotify_url}
        >
          <View style={styles.meta} lightColor="#0000" darkColor="#0000">
            <RatingBadge avgRating={post.avg_rating} ratingCount={post.rating_count} />
            <Text style={styles.dot}>·</Text>
            <Text style={styles.commentCount}>
              {post.comment_count} comment{post.comment_count === 1 ? "" : "s"}
            </Text>
          </View>
        </TrackCard>
        {post.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {post.caption}
          </Text>
        )}
        <Text style={styles.author}>posted by {post.author_name}</Text>
        <Text style={styles.date}>{dayjs(post.created_at).fromNow()}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    opacity: 0.4,
  },
  commentCount: {
    fontSize: 13,
    opacity: 0.6,
  },
  caption: {
    fontSize: 14,
    marginTop: 6,
  },
  author: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
});
