import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { Comment } from "@/types/models";

dayjs.extend(relativeTime);

export function CommentItem({ comment }: { comment: Comment }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.author}>{comment.author_name ?? "Someone"}</Text>
        {comment.rating != null && (
          <View style={styles.ratingPill} lightColor="#2f95dc" darkColor="#2f95dc">
            <Text style={styles.ratingPillText}>{comment.rating}/10</Text>
          </View>
        )}
        <Text style={styles.time}>{dayjs(comment.created_at).fromNow()}</Text>
      </View>
      <Text>{comment.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
    paddingVertical: 8,
  },
  header: {
    flexDirection: "row",
    gap: 8,
    alignItems: "baseline",
  },
  author: {
    fontWeight: "600",
    fontSize: 14,
  },
  ratingPill: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  ratingPillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  time: {
    fontSize: 12,
    opacity: 0.5,
  },
});
