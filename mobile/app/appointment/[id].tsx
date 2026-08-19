import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Hourglass, MapPin, QrCode, ShieldCheck, Stethoscope, XCircle } from "lucide-react-native";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type Appointment, getAppointment } from "@/lib/api/appointments";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatSlotRange } from "@/lib/format/datetime";
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

const SNAPSHOT_FIELD_LABELS: Record<string, string> = {
  full_name: "Họ và tên",
  patient_name: "Họ và tên",
  phone_number: "Số điện thoại",
  date_of_birth: "Ngày sinh",
  gender: "Giới tính",
  address: "Địa chỉ",
  patient_subject: "Đối tượng khám",
  relationship: "Quan hệ với bệnh nhân",
  age: "Tuổi",
  main_symptoms: "Triệu chứng chính",
  symptom_onset: "Thời điểm khởi phát",
  symptom_progression: "Diễn biến",
  severity: "Mức độ",
  temperature: "Nhiệt độ",
  medical_history: "Tiền sử bệnh",
  medications: "Thuốc đang dùng",
  allergies: "Dị ứng",
};

function formatSnapshotValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Chưa cập nhật";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Chưa cập nhật";
  return String(value);
}

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!accessToken || !id) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    getAppointment(accessToken, id)
      .then((result) => {
        if (!cancelled) setAppointment(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, id]);

  const meta = appointment ? statusMeta(appointment.status) : null;
  const StatusIcon = meta?.Icon;
  const snapshotEntries = appointment?.patient_snapshot ? Object.entries(appointment.patient_snapshot) : [];

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} hitSlop={8} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.textLabel} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          Chi tiết lịch hẹn
        </Text>
        <View style={styles.iconButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary700} />
        </View>
      ) : error || !appointment ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Không thể tải thông tin lịch hẹn. Vui lòng thử lại.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.specialty}>{appointment.specialty_name ?? "Lịch khám"}</Text>
                <Text style={styles.doctor}>{appointment.doctor_name ?? "Chưa phân công bác sĩ"}</Text>
              </View>
              {meta && StatusIcon ? (
                <View style={[styles.statusPill, { backgroundColor: meta.iconBg }]}>
                  <StatusIcon size={14} color={meta.iconColor} />
                  <Text style={[styles.statusText, { color: meta.iconColor }]}>{meta.label}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.divider} />

            {appointment.slot_start && appointment.slot_end ? (
              <View style={styles.infoRow}>
                <Calendar size={16} color={colors.textBody} />
                <Text style={styles.infoText}>{formatSlotRange(appointment.slot_start, appointment.slot_end)}</Text>
              </View>
            ) : null}

            {appointment.facility_name ? (
              <View style={styles.infoRow}>
                <MapPin size={16} color={colors.textBody} />
                <Text style={styles.infoText}>
                  {appointment.facility_name}
                  {appointment.room ? ` • ${appointment.room}` : ""}
                </Text>
              </View>
            ) : null}
          </View>

          {appointment.booking_reason || appointment.patient_notes || appointment.cancellation_reason ? (
            <View style={styles.card}>
              {appointment.booking_reason ? (
                <View style={styles.textBlock}>
                  <Text style={styles.textBlockLabel}>LÝ DO KHÁM</Text>
                  <Text style={styles.textBlockValue}>{appointment.booking_reason}</Text>
                </View>
              ) : null}
              {appointment.patient_notes ? (
                <View style={styles.textBlock}>
                  <Text style={styles.textBlockLabel}>GHI CHÚ CỦA BẠN</Text>
                  <Text style={styles.textBlockValue}>{appointment.patient_notes}</Text>
                </View>
              ) : null}
              {appointment.cancellation_reason ? (
                <View style={styles.textBlock}>
                  <Text style={styles.textBlockLabel}>LÝ DO HỦY/TỪ CHỐI</Text>
                  <Text style={styles.textBlockValue}>{appointment.cancellation_reason}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {snapshotEntries.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Thông tin khai báo</Text>
              {snapshotEntries.map(([key, value]) => (
                <View key={key} style={styles.textBlock}>
                  <Text style={styles.textBlockLabel}>{SNAPSHOT_FIELD_LABELS[key] ?? key}</Text>
                  <Text style={styles.textBlockValue}>{formatSnapshotValue(value)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {appointment.qr_available ? (
            <Pressable style={styles.qrButton} onPress={() => router.push("/qr-checkin")}>
              <QrCode size={18} color={colors.white} />
              <Text style={styles.qrButtonText}>Xem mã QR check-in</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: 12,
    backgroundColor: colors.pageBg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.primary700,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
    textAlign: "center",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    padding: 17,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  specialty: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.textBody,
  },
  doctor: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.textLabel,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSoft,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textLabel,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.textLabel,
  },
  textBlock: {
    gap: 2,
  },
  textBlockLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.textBody,
  },
  textBlockValue: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textLabel,
  },
  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary700,
    borderRadius: 9999,
    paddingVertical: 14,
  },
  qrButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.white,
  },
});
