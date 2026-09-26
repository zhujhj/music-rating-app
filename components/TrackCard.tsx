import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image, Linking, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native";

import { Text, View } from "@/components/Themed";

export function TrackCard({
  trackName,
  artistName,
  albumArtUrl,
  spotifyUrl,
  style,
  children,
}: {
  trackName: string;
  artistName: string;
  albumArtUrl?: string | null;
  spotifyUrl?: string | null;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.row, style]}>
      {albumArtUrl ? (
        <Image source={{ uri: albumArtUrl }} style={styles.art} />
      ) : (
        <View style={[styles.art, styles.artPlaceholder]} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {trackName}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {artistName}
        </Text>
        {children}
      </View>
      {spotifyUrl && (
        <Pressable
          style={styles.spotifyButton}
          onPress={() => Linking.openURL(spotifyUrl)}
          hitSlop={8}
        >
          <FontAwesome name="spotify" size={26} color="#1DB954" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  art: {
    width: 56,
    height: 56,
    borderRadius: 6,
  },
  artPlaceholder: {
    backgroundColor: "#8884",
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  spotifyButton: {
    flexShrink: 0,
  },
});
