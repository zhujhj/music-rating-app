import { Pressable, StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";

const ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
];

export function RatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (score: number) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.container}>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((score) => (
            <Pressable
              key={score}
              onPress={() => onChange(score)}
              disabled={disabled}
              style={[styles.cell, value === score && styles.cellActive]}
            >
              <Text
                style={[
                  styles.cellText,
                  value === score && styles.cellTextActive,
                ]}
              >
                {score}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#8888",
  },
  cellActive: {
    backgroundColor: "#2f95dc",
    borderColor: "#2f95dc",
  },
  cellText: {
    fontSize: 15,
    fontWeight: "600",
  },
  cellTextActive: {
    color: "#fff",
  },
});
