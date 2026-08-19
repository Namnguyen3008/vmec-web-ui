import { Redirect, useRouter } from "expo-router";
import { Bell, Bot, Building2, Calendar, Clock, FileText, History, User, UserCog } from "lucide-react-native";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { type Appointment, listMyAppointments } from "@/lib/api/appointments";
import { listNotifications } from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatSlotLabel } from "@/lib/format/datetime";
import { colors } from "@/theme/colors";

const UPCOMING_STATUSES = new Set(["PENDING", "CONFIRMED"]);

function pickUpcoming(appointments: Appointment[]): Appointment | null {
  const now = Date.now();
  const candidates = appointments
    .filter((a) => UPCOMING_STATUSES.has(a.status) && a.slot_start && new Date(a.slot_start).getTime() >= now)
    .sort((a, b) => new Date(a.slot_start as string).getTime() - new Date(b.slot_start as string).getTime());
  return candidates[0] ?? null;
}

interface IconProps {
  size?: number;
  color?: string;
}

const QUICK_ACCESS: { label: string; Icon: ComponentType<IconProps>; route: "/departments" | "/records" | "/account" | "/appointments" }[] = [
  { label: "Hồ sơ Bệnh án", Icon: FileText, route: "/records" },
  { label: "Lịch sử Đặt khám", Icon: History, route: "/appointments" },
  { label: "Danh mục Khoa", Icon: Building2, route: "/departments" },
  { label: "Tài khoản", Icon: UserCog, route: "/account" },
];

export default function HomeScreen() {
  const { status, profile, accessToken } = useAuth();
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<Appointment | null>(null);
  const [loadingAppointment, setLoadingAppointment] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    let cancelled = false;
    setLoadingAppointment(true);
    listMyAppointments(accessToken)
      .then(({ items }) => {
        if (!cancelled) setUpcoming(pickUpcoming(items));
      })
      .catch(() => {
        if (!cancelled) setUpcoming(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingAppointment(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, accessToken]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    let cancelled = false;
    listNotifications(accessToken)
      .then(({ unread_count }) => {
        if (!cancelled) setUnreadCount(unread_count);
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [status, accessToken]);

  if (status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary700} />
      </View>
    );
  }

  if (status === "unauthenticated") {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <User size={20} color={colors.primary700} />
            )}
          </View>
          <Text style={styles.brand}>MedAgent AI</Text>
        </View>
        <Pressable style={styles.bellButton} hitSlop={8} onPress={() => router.push("/notifications")}>
          <Bell size={20} color={colors.textBody} />
          {unreadCount > 0 ? <View style={styles.bellBadge} /> : null}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.heading}>Xin chào, {profile?.full_name}</Text>
          <Text style={styles.heroSubtitle}>
            Trợ lý ảo y tế chỉ mang tính chất tham khảo, không thay thế chẩn đoán của bác sĩ.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Lịch hẹn sắp tới</Text>
          {loadingAppointment ? (
            <View style={[styles.appointmentCard, styles.appointmentEmpty]}>
              <ActivityIndicator color={colors.primary700} />
            </View>
          ) : upcoming ? (
            <View style={styles.appointmentCard}>
              <View style={styles.appointmentRow}>
                <View style={styles.appointmentIconWrap}>
                  <Calendar size={22} color={colors.primary700} />
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentDoctor}>{upcoming.doctor_name ?? "Bác sĩ"}</Text>
                  <Text style={styles.appointmentDept}>{upcoming.specialty_name ?? ""}</Text>
                </View>
              </View>
              <View style={styles.timeChip}>
                <Clock size={14} color={colors.textBody} />
                <Text style={styles.timeChipText}>
                  {upcoming.slot_start ? formatSlotLabel(upcoming.slot_start) : "Chưa có khung giờ"}
                </Text>
              </View>
              <Pressable style={styles.detailButton} onPress={() => router.push("/records")}>
                <Text style={styles.detailButtonText}>Chi tiết</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.appointmentCard, styles.appointmentEmpty]}>
              <Text style={styles.appointmentDept}>Bạn chưa có lịch hẹn sắp tới.</Text>
            </View>
          )}
        </View>

        <View style={styles.quickGrid}>
          {QUICK_ACCESS.map(({ label, Icon, route }) => (
            <Pressable key={label} style={styles.quickCard} onPress={() => router.push(route)}>
              <View style={styles.quickIconWrap}>
                <Icon size={24} color={colors.primary700} />
              </View>
              <Text style={styles.quickLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.fabWrap} pointerEvents="box-none">
        <View style={styles.fabBubble}>
          <Text style={styles.fabBubbleText}>Tôi có thể giúp gì được cho bạn?</Text>
        </View>
        <Pressable style={styles.fabButton} onPress={() => router.push("/assistant")}>
          <Bot size={24} color={colors.white} />
        </Pressable>
      </View>

      <BottomNavBar active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: 20,
    backgroundColor: colors.pageBg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: colors.photoBg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  brand: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: colors.primary700,
  },
  bellButton: {
    padding: 8,
    borderRadius: 9999,
  },
  bellBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 9999,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.pageBg,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
    gap: 24,
  },
  hero: {
    gap: 8,
  },
  heading: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.textLabel,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
    color: colors.textBody,
  },
  section: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
    color: colors.textLabel,
  },
  appointmentCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  appointmentEmpty: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 72,
  },
  appointmentRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  appointmentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  appointmentInfo: {
    flex: 1,
    gap: 2,
  },
  appointmentDoctor: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "600",
    color: colors.textLabel,
  },
  appointmentDept: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.chipBg,
    borderRadius: 8,
    padding: 12,
    alignSelf: "flex-start",
  },
  timeChipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.textBody,
  },
  detailButton: {
    borderWidth: 1,
    borderColor: colors.primary700,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  detailButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.primary700,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  quickCard: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.textLabel,
    textAlign: "center",
  },
  fabWrap: {
    position: "absolute",
    right: 20,
    bottom: 96,
    alignItems: "flex-end",
    gap: 8,
  },
  fabBubble: {
    maxWidth: 200,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 13,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  fabBubbleText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textLabel,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    backgroundColor: colors.primary700,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  },
});
