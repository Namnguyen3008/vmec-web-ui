import { Check } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";
import { colors } from "@/theme/colors";

export function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.box, checked && styles.boxChecked]}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      {checked ? <Check size={12} color={colors.white} strokeWidth={3} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  boxChecked: {
    backgroundColor: colors.primary700,
    borderColor: colors.primary700,
  },
});
