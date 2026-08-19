import { useRouter } from "expo-router";
import { ArrowLeft, Cake, Eye, RefreshCw, ScanLine, ShieldCheck, Sparkles, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { type Appointment, type AppointmentQr, getAppointmentQr, listMyAppointments } from "@/lib/api/appointments";
import { useAuth } from "@/lib/auth/AuthContext";
import { colors } from "@/theme/colors";

function birthYear(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "Chưa cập nhật";
  const year = new Date(dateOfBirth).getFullYear();
  return Number.isNaN(year) ? "Chưa cập nhật" : `${year}`;
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

export default function QrCheckinScreen() {
  const router = useRouter();
  const { profile, accessToken } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [qr, setQr] = useState<AppointmentQr | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeclaration, setShowDeclaration] = useState(false);

  async function loadQr(target: Appointment, token: string) {
    const result = await getAppointmentQr(token, target.id);
    setQr(result);
  }

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    listMyAppointments(accessToken)
      .then(async ({ items }) => {
        const eligible = items.find((a) => a.qr_available) ?? null;
        if (cancelled) return;
        setAppointment(eligible);
        if (eligible) await loadQr(eligible, accessToken);
      })
      .catch(() => {
        if (!cancelled) {
          setAppointment(null);
          setQr(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function handleRefresh() {
    if (!appointment || !accessToken || refreshing) return;
    setRefreshing(true);
    try {
      await loadQr(appointment, accessToken);
    } catch {
      // giữ QR hiện tại nếu làm mới thất bại
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.iconButton} hitSlop={8} onPress={() => router.back()}>
            <ArrowLeft size={20} color={colors.textLabel} />
          </Pressable>
          <Text style={styles.brand}>QR Check-in</Text>
        </View>
        {/* TODO: mở màn quét QR (dành cho lễ tân) khi có thiết kế/chức năng tương ứng */}
        <Pressable style={styles.iconButton} hitSlop={8} onPress={() => {}}>
          <ScanLine size={20} color={colors.textLabel} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.qrCard}>
            <ActivityIndicator color={colors.primary700} />
          </View>
        ) : !appointment || !qr ? (
          <View style={styles.qrCard}>
            <Text style={styles.instruction}>
              Bạn chưa có lịch hẹn nào đã được xác nhận để check-in bằng QR.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.instruction}>
              Vui lòng đưa mã này cho nhân viên lễ tân để thực hiện check-in nhanh.
            </Text>

            <View style={styles.qrCard}>
              <View style={styles.qrBorder}>
                <Image source={{ uri: qr.image_url }} style={styles.qrImage} resizeMode="contain" />
              </View>
              <View style={styles.secureRow}>
                <ShieldCheck size={17} color={colors.primary700} />
                <Text style={styles.secureText}>Thông tin đã được mã hóa an toàn</Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.avatar}>
                  <User size={20} color={colors.primary700} />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryName}>{profile?.full_name}</Text>
                  <View style={styles.birthRow}>
                    <Cake size={12} color={colors.textBody} />
                    <Text style={styles.birthText}>Năm sinh: {birthYear(profile?.date_of_birth ?? null)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.calloutCard}>
                <Sparkles size={14} color={colors.textBody} />
                <Text style={styles.calloutText}>
                  {appointment.doctor_name ?? "Bác sĩ"} • {appointment.specialty_name ?? ""}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.detailButton} onPress={() => setShowDeclaration((v) => !v)}>
                <Eye size={18} color={colors.primary700} />
                <Text style={styles.detailButtonText}>
                  {showDeclaration ? "Ẩn thông tin khai báo" : "Xem chi tiết thông tin khai báo"}
                </Text>
              </Pressable>

              {showDeclaration ? (
                <View style={styles.declarationCard}>
                  {appointment.patient_snapshot && Object.keys(appointment.patient_snapshot).length > 0 ? (
                    Object.entries(appointment.patient_snapshot).map(([key, value]) => (
                      <View key={key} style={styles.declarationRow}>
                        <Text style={styles.declarationLabel}>{SNAPSHOT_FIELD_LABELS[key] ?? key}</Text>
                        <Text style={styles.declarationValue}>{formatSnapshotValue(value)}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.declarationEmpty}>Không có thông tin khai báo cho lịch hẹn này.</Text>
                  )}
                </View>
              ) : null}

              <Pressable style={styles.refreshButton} onPress={handleRefresh} disabled={refreshing}>
                <RefreshCw size={16} color={colors.textBody} />
                <Text style={styles.refreshButtonText}>{refreshing ? "Đang làm mới..." : "Làm mới mã QR"}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.primary700,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  instruction: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textBody,
    textAlign: "center",
  },
  qrCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 16,
    shadowColor: "#4D616B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qrBorder: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(192,200,204,0.3)",
    borderRadius: 12,
    padding: 17,
    shadowColor: "#4D616B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 3,
  },
  qrImage: {
    width: 192,
    height: 192,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secureText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.primary700,
  },
  summaryCard: {
    backgroundColor: colors.photoBg,
    borderWidth: 1,
    borderColor: "rgba(192,200,204,0.2)",
    borderRadius: 12,
    padding: 21,
    gap: 16,
    shadowColor: "#4D616B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryInfo: {
    gap: 4,
  },
  summaryName: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "600",
    color: colors.textLabel,
  },
  birthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  birthText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textBody,
  },
  calloutCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(39,101,123,0.05)",
    borderLeftWidth: 4,
    borderLeftColor: colors.primary700,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  calloutText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
  },
  actions: {
    gap: 16,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary700,
    borderRadius: 8,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  detailButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.primary700,
  },
  declarationCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  declarationRow: {
    gap: 2,
  },
  declarationLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.textBody,
  },
  declarationValue: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textLabel,
  },
  declarationEmpty: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  refreshButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.textBody,
  },
});
