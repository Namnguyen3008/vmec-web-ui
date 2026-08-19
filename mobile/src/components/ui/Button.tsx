import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline";
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ title, onPress, variant = "primary", icon, disabled, loading }: ButtonProps) {
  const isOutline = variant === "outline";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isOutline ? styles.outline : styles.primary,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.textLabel : colors.white} />
      ) : (
        <View style={styles.content}>
          <Text style={isOutline ? styles.outlineText : styles.primaryText}>{title}</Text>
          {icon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  primary: {
    backgroundColor: colors.primary700,
  },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  outlineText: {
    color: colors.textLabel,
    fontSize: 14,
    fontWeight: "500",
  },
});
