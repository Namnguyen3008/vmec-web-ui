import { Redirect } from "expo-router";
import { LogOut, MapPin, Phone, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { colors } from "@/theme/colors";

type GenderOption = "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";

const GENDER_OPTIONS: { value: GenderOption; label: string }[] = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
  { value: "UNKNOWN", label: "Chưa xác định" },
];

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export default function AccountScreen() {
  const { status, profile, logout, updateProfile } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState<GenderOption>("UNKNOWN");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone_number ?? "");
    setDateOfBirth(profile.date_of_birth ?? "");
    setAddress(profile.address ?? "");
    setGender((profile.gender as GenderOption) || "UNKNOWN");
  }, [profile]);

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

  async function handleSave() {
    setError(null);
    setSuccess(false);
    if (!fullName.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }
    if (dateOfBirth && !isValidIsoDate(dateOfBirth)) {
      setError("Ngày sinh phải theo định dạng YYYY-MM-DD.");
      return;
    }
    setSubmitting(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone_number: phone.trim() || null,
        date_of_birth: dateOfBirth || null,
        gender,
        address: address.trim() || null,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thể cập nhật hồ sơ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tài khoản</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>Đã lưu thay đổi.</Text> : null}

        <TextField
          label="Họ và tên"
          icon={<User size={20} color={colors.textMuted} />}
          placeholder="Nhập họ và tên"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            setSuccess(false);
          }}
          autoCapitalize="words"
          textContentType="name"
        />

        <TextField
          label="Số điện thoại"
          icon={<Phone size={20} color={colors.textMuted} />}
          placeholder="Nhập số điện thoại"
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            setSuccess(false);
          }}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
        />

        <TextField
          label="Ngày sinh (YYYY-MM-DD)"
          icon={<User size={20} color={colors.textMuted} />}
          placeholder="1990-01-01"
          value={dateOfBirth}
          onChangeText={(text) => {
            setDateOfBirth(text);
            setSuccess(false);
          }}
          keyboardType="numbers-and-punctuation"
        />

        <TextField
          label="Địa chỉ"
          icon={<MapPin size={20} color={colors.textMuted} />}
          placeholder="Nhập địa chỉ"
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            setSuccess(false);
          }}
          autoCapitalize="sentences"
        />

        <View style={styles.genderSection}>
          <Text style={styles.genderLabel}>Giới tính</Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((option) => {
              const active = option.value === gender;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.genderChip, active && styles.genderChipActive]}
                  onPress={() => {
                    setGender(option.value);
                    setSuccess(false);
                  }}
                >
                  <Text style={[styles.genderChipText, active && styles.genderChipTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button title={submitting ? "Đang lưu..." : "Lưu thay đổi"} onPress={handleSave} loading={submitting} />

        <Pressable style={styles.logoutRow} onPress={() => void logout()}>
          <LogOut size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>

      <BottomNavBar active="account" />
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
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.primary700,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  errorText: {
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  successText: {
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
    color: colors.primary700,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  genderSection: {
    gap: 8,
  },
  genderLabel: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textLabel,
  },
  genderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genderChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.white,
  },
  genderChipActive: {
    backgroundColor: colors.primary700,
    borderColor: colors.primary700,
  },
  genderChipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.textLabel,
  },
  genderChipTextActive: {
    color: colors.white,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.danger,
  },
});
