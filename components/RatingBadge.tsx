import { StyleSheet } from "react-native";

import { Text } from "@/components/Themed";

export function RatingBadge({
  avgRating,
  ratingCount,
}: {
  avgRating: number;
  ratingCount: number;
}) {
  if (ratingCount === 0) {
    return <Text style={styles.text}>No ratings yet</Text>;
  }

  return (
    <Text style={styles.text}>
      {avgRating.toFixed(1)} · {ratingCount} rating{ratingCount === 1 ? "" : "s"}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    opacity: 0.6,
  },
});
