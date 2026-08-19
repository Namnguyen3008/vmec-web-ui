import { Redirect, useRouter } from "expo-router";
import { Bell, Calendar, ChevronRight, Hourglass, ShieldCheck, Stethoscope, XCircle } from "lucide-react-native";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { type Appointment, listMyAppointments } from "@/lib/api/appointments";
import { listNotifications } from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatShortDate } from "@/lib/format/datetime";
import { colors } from "@/theme/colors";

interface IconProps {
  size?: number;
  color?: string;
}

const STATUS_META: Record<string, { label: string; iconBg: string; iconColor: string; Icon: ComponentType<IconProps> }> = {
  CONFIRMED: { label: "Đã xác nhận", iconBg: "rgba(205,227,238,0.5)", iconColor: colors.primary700, Icon: ShieldCheck },
  COMPLETED: { label: "Đã hoàn thành", iconBg: "rgba(205,227,238,0.5)", iconColor: colors.primary700, Icon: ShieldCheck },
  PENDING: { label: "Chờ duyệt", iconBg: "rgba(231,167,117,0.3)", iconColor: "#C17A3D", Icon: Hourglass },
  REJECTED: { label: "Bị từ chối", iconBg: "rgba(220,38,38,0.1)", iconColor: colors.danger, Icon: XCircle },
  CANCELLED: { label: "Đã hủy", iconBg: "rgba(220,38,38,0.1)", iconColor: colors.danger, Icon: XCircle },
  PATIENT_DECLINED: { label: "Đã từ chối", iconBg: "rgba(220,38,38,0.1)", iconColor: colors.danger, Icon: XCircle },
};

function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, iconBg: "rgba(192,200,204,0.3)", iconColor: colors.textBody, Icon: Stethoscope };
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const { status, accessToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    let cancelled = false;
    setLoading(true);
    listMyAppointments(accessToken)
      .then(({ items }) => {
        if (!cancelled) setAppointments(items);
      })
      .catch(() => {
        if (!cancelled) setAppointments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
        <View style={styles.headerIconButton}>
          <Calendar size={20} color={colors.primary700} />
        </View>
        <Text style={styles.brand}>Lịch hẹn</Text>
        <Pressable style={styles.headerIconButton} hitSlop={8} onPress={() => router.push("/notifications")}>
          <Bell size={20} color={colors.textBody} />
          {unreadCount > 0 ? <View style={styles.badgeDot} /> : null}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Lịch hẹn của tôi</Text>
          <Text style={styles.subtitle}>Toàn bộ lịch hẹn khám bệnh, từ chờ duyệt đến đã hoàn thành</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary700} />
        ) : appointments.length === 0 ? (
          <Text style={styles.emptyText}>Bạn chưa có lịch hẹn nào.</Text>
        ) : (
          <View style={styles.list}>
            {appointments.map((appointment) => {
              const meta = statusMeta(appointment.status);
              const Icon = meta.Icon;
              return (
                <Pressable
                  key={appointment.id}
                  style={styles.card}
                  onPress={() => router.push({ pathname: "/appointment/[id]", params: { id: appointment.id } })}
                >
                  <View style={[styles.iconWrap, { backgroundColor: meta.iconBg }]}>
                    <Icon size={20} color={meta.iconColor} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.cardTitle}>{appointment.specialty_name ?? "Lịch khám"}</Text>
                    <View style={styles.dateRow}>
                      <Calendar size={12} color={colors.textBody} />
                      <Text style={styles.dateText}>
                        {appointment.slot_start ? formatShortDate(appointment.slot_start) : meta.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.meta}>
                    <View style={styles.doctorPill}>
                      <Text style={styles.doctorPillText}>{appointment.doctor_name ?? meta.label}</Text>
                    </View>
                    <ChevronRight size={14} color={colors.textMuted} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomNavBar active="appointments" />
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
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDot: {
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
  brand: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: colors.primary700,
  },
  content: {
    padding: 20,
    paddingTop: 24,
    gap: 24,
  },
  titleBlock: {
    gap: 4,
  },
  title: {
    fontSize: 32,
    lineHeight: 38.4,
    fontWeight: "700",
    color: colors.textLabel,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textBody,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.pageBg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    padding: 17,
    shadowColor: "#4D616B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.textLabel,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: colors.textBody,
  },
  meta: {
    alignItems: "flex-end",
    gap: 4,
  },
  doctorPill: {
    backgroundColor: colors.borderSoft,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  doctorPillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: colors.textLabel,
  },
});
