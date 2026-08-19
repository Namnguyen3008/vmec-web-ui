import { useRouter } from "expo-router";
import { Calendar, FileText, Home, User } from "lucide-react-native";
import type { ComponentType } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

export type NavTabKey = "home" | "appointments" | "records" | "account";

interface IconProps {
  size?: number;
  color?: string;
}

const NAV_ITEMS: { key: NavTabKey; label: string; Icon: ComponentType<IconProps>; route: "/" | "/appointments" | "/records" | "/account" }[] = [
  { key: "home", label: "Trang chủ", Icon: Home, route: "/" },
  { key: "appointments", label: "Lịch hẹn", Icon: Calendar, route: "/appointments" },
  { key: "records", label: "Hồ sơ", Icon: FileText, route: "/records" },
  { key: "account", label: "Tài khoản", Icon: User, route: "/account" },
];

export function BottomNavBar({ active }: { active: NavTabKey }) {
  const router = useRouter();

  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS.map(({ key, label, Icon, route }) => {
        const isActive = key === active;

        function handlePress() {
          if (isActive) return;
          router.push(route);
        }

        return (
          <Pressable key={key} style={[styles.navItem, isActive && styles.navItemActive]} onPress={handlePress}>
            <Icon size={20} color={isActive ? colors.navActiveText : colors.textBody} />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.chipBg,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: "#4D616B",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  navItemActive: {
    backgroundColor: colors.calloutBorder,
  },
  navLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: colors.textBody,
  },
  navLabelActive: {
    color: colors.navActiveText,
  },
});
