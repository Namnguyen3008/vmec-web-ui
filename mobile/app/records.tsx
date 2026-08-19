import { Redirect, useRouter } from "expo-router";
import { Bell, Calendar, ChevronRight, Hourglass, IdCard, ShieldCheck, Stethoscope, User, XCircle } from "lucide-react-native";
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

// Chưa có trường nhóm máu/chiều cao/cân nặng trong Profile backend — để trống
// thay vì bịa số liệu y tế của người dùng thật.
const NOT_UPDATED = "Chưa cập nhật";

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

function mapGender(gender: string | undefined): string {
  const value = (gender ?? "").trim().toUpperCase();
  if (value === "MALE" || value === "NAM") return "Nam";
  if (value === "FEMALE" || value === "NỮ" || value === "NU") return "Nữ";
  if (!value) return NOT_UPDATED;
  return gender as string;
}

function patientCode(id: string | undefined): string {
  if (!id) return "—";
  return `BN-${id.replace(/-/g, "").slice(0, 7).toUpperCase()}`;
}

export default function RecordsScreen() {
  const router = useRouter();
  const { status, profile, accessToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    let cancelled = false;
    setLoadingAppointments(true);
    listMyAppointments(accessToken)
      .then(({ items }) => {
        if (!cancelled) setAppointments(items);
      })
      .catch(() => {
        if (!cancelled) setAppointments([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAppointments(false);
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

  const currentVisit = appointments.find((a) => a.status === "PENDING") ?? null;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.headerIconButton}>
          <IdCard size={20} color={colors.primary700} />
        </View>
        <Text style={styles.brand}>MedAgent AI</Text>
        <Pressable style={styles.headerIconButton} hitSlop={8} onPress={() => router.push("/notifications")}>
          <Bell size={20} color={colors.textBody} />
          {unreadCount > 0 ? <View style={styles.badgeDot} /> : null}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Hồ sơ bệnh án</Text>
          <Text style={styles.subtitle}>Thông tin sức khỏe cá nhân & Lịch sử khám</Text>
        </View>

        <View style={styles.personalCard}>
          <View style={styles.personalRow}>
            <View style={styles.personalAvatar}>
              <User size={24} color={colors.primary700} />
            </View>
            <View style={styles.personalInfo}>
              <Text style={styles.personalName}>{profile?.full_name}</Text>
              <Text style={styles.personalCode}>{patientCode(profile?.id)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>GIỚI TÍNH</Text>
              <Text style={styles.infoValue}>{mapGender(profile?.gender)}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>NHÓM MÁU</Text>
              <Text style={styles.infoValue}>{NOT_UPDATED}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>CHIỀU CAO</Text>
              <Text style={styles.infoValue}>{NOT_UPDATED}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>CÂN NẶNG</Text>
              <Text style={styles.infoValue}>{NOT_UPDATED}</Text>
            </View>
          </View>
        </View>

        {currentVisit ? (
          <View style={styles.visitCard}>
            <View style={styles.visitIconWrap}>
              <Stethoscope size={20} color={colors.white} />
            </View>
            <View style={styles.visitBody}>
              <Text style={styles.visitLabel}>MỤC ĐÍCH KHÁM HIỆN TẠI</Text>
              <Text style={styles.visitText}>
                {currentVisit.booking_reason ?? `Chờ duyệt lịch khám ${currentVisit.specialty_name ?? ""}`.trim()}
              </Text>
              <View style={styles.visitUpdatedRow}>
                <Calendar size={12} color={colors.primary700} />
                <Text style={styles.visitUpdatedText}>Cập nhật {formatShortDate(currentVisit.updated_at)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Lịch sử khám bệnh</Text>
          </View>

          {loadingAppointments ? (
            <ActivityIndicator color={colors.primary700} />
          ) : appointments.length === 0 ? (
            <Text style={styles.historyEmptyText}>Bạn chưa có lịch sử khám bệnh.</Text>
          ) : (
            <View style={styles.historyList}>
              {appointments.map((appointment) => {
                const meta = statusMeta(appointment.status);
                const Icon = meta.Icon;
                return (
                  <Pressable
                    key={appointment.id}
                    style={styles.historyCard}
                    onPress={() => router.push({ pathname: "/appointment/[id]", params: { id: appointment.id } })}
                  >
                    <View style={[styles.historyIconWrap, { backgroundColor: meta.iconBg }]}>
                      <Icon size={20} color={meta.iconColor} />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyCardTitle}>{appointment.specialty_name ?? "Lịch khám"}</Text>
                      <View style={styles.historyDateRow}>
                        <Calendar size={12} color={colors.textBody} />
                        <Text style={styles.historyDate}>
                          {appointment.slot_start ? formatShortDate(appointment.slot_start) : meta.label}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyMeta}>
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
        </View>
      </ScrollView>

      <BottomNavBar active="records" />
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
  personalCard: {
    backgroundColor: colors.pageBg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    padding: 21,
    gap: 20,
    shadowColor: "#4D616B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  personalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  personalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 9999,
    backgroundColor: colors.calloutBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  personalInfo: {
    gap: 2,
  },
  personalName: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
    color: colors.textLabel,
  },
  personalCode: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.primary700,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSoft,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  infoCell: {
    flexBasis: "47%",
    flexGrow: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textBody,
  },
  infoValue: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: colors.textLabel,
  },
  visitCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.primaryTint,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#4D616B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  visitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: colors.primary700,
    alignItems: "center",
    justifyContent: "center",
  },
  visitBody: {
    flex: 1,
    gap: 4,
  },
  visitLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.calloutHeading,
  },
  visitText: {
    fontSize: 18,
    lineHeight: 22.5,
    fontWeight: "500",
    color: colors.calloutHeading,
  },
  visitUpdatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  visitUpdatedText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: colors.primary700,
  },
  historySection: {
    gap: 16,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  historyTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
    color: colors.textLabel,
  },
  historySeeAll: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.primary700,
  },
  historyList: {
    gap: 12,
  },
  historyEmptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
  },
  historyCard: {
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
  historyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: {
    flex: 1,
    gap: 4,
  },
  historyCardTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.textLabel,
  },
  historyDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyDate: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: colors.textBody,
  },
  historyMeta: {
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
