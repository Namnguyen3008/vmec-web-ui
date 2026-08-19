import * as Linking from "expo-linking";
import { Link, useRouter } from "expo-router";
import { ArrowRight, Eye, EyeOff, History, Lock, Mail, Phone, User } from "lucide-react-native";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { TextField } from "@/components/ui/TextField";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { colors } from "@/theme/colors";

const mascotPhoto = require("../assets/auth/mascot-photo.png");

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  async function handleSubmit() {
    setError(null);
    setNotice(null);
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!agreed) {
      setError("Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await register({
        full_name: fullName,
        email,
        password,
        phone_number: phone || undefined,
        redirect_to: Linking.createURL("confirm-email"),
      });
      if (result.requiresEmailConfirmation) {
        setNotice("Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.");
        return;
      }
      router.replace("/");
    } catch (err) {
      if (!(err instanceof ApiError)) console.error("[register] lỗi không xác định:", err);
      setError(err instanceof ApiError ? err.message : "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Image source={mascotPhoto} style={styles.avatarImage} resizeMode="cover" />
          </View>
          <Text style={styles.heading}>Đăng ký tài khoản</Text>
          <Text style={styles.subtitle}>
            Tham gia cùng MedAgent để quản lý sức khỏe thông minh hơn.
          </Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

          <TextField
            label="Họ và tên"
            icon={<User size={20} color={colors.textMuted} />}
            placeholder="Nhập họ và tên"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            textContentType="name"
          />

          <TextField
            label="Email"
            icon={<Mail size={20} color={colors.textMuted} />}
            placeholder="Nhập địa chỉ email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <TextField
            label="Số điện thoại"
            icon={<Phone size={20} color={colors.textMuted} />}
            placeholder="Nhập số điện thoại"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
          />

          <TextField
            label="Mật khẩu"
            icon={<Lock size={20} color={colors.textMuted} />}
            placeholder="Tạo mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType="newPassword"
            rightElement={
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                {showPassword ? (
                  <EyeOff size={18} color={colors.textMuted} />
                ) : (
                  <Eye size={18} color={colors.textMuted} />
                )}
              </Pressable>
            }
          />

          <TextField
            label="Xác nhận mật khẩu"
            icon={<History size={20} color={colors.textMuted} />}
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            textContentType="newPassword"
            rightElement={
              <Pressable onPress={() => setShowConfirmPassword((v) => !v)} hitSlop={8}>
                {showConfirmPassword ? (
                  <EyeOff size={18} color={colors.textMuted} />
                ) : (
                  <Eye size={18} color={colors.textMuted} />
                )}
              </Pressable>
            }
          />

          <View style={styles.termsRow}>
            <Checkbox checked={agreed} onToggle={() => setAgreed((v) => !v)} />
            <Text style={styles.termsText}>
              Tôi đồng ý với <Text style={styles.link}>Điều khoản dịch vụ</Text> và{" "}
              <Text style={styles.link}>Chính sách bảo mật</Text> của MedAgent.
            </Text>
          </View>

          <Button
            title={submitting ? "Đang tạo tài khoản..." : "Đăng ký ngay"}
            onPress={handleSubmit}
            disabled={submitting || !fullName || !email || !password || !confirmPassword}
            loading={submitting}
            icon={<ArrowRight size={16} color={colors.white} />}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Hoặc đăng ký bằng</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          title="Tiếp tục với Google"
          variant="outline"
          onPress={() => {}}
          icon={<GoogleIcon size={20} />}
        />

        <Text style={styles.loginRow}>
          Đã có tài khoản?{" "}
          <Link href="/login" asChild>
            <Text style={styles.link}>Đăng nhập ngay</Text>
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: {
    padding: 24,
    gap: 16,
    backgroundColor: colors.white,
  },
  header: {
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    backgroundColor: colors.photoBg,
    overflow: "hidden",
    marginBottom: 8,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  heading: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.primary700,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textBody,
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  errorText: {
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  noticeText: {
    borderRadius: 12,
    backgroundColor: colors.calloutBg,
    borderWidth: 1,
    borderColor: colors.calloutBorder,
    color: colors.calloutHeading,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  termsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 17.5,
    color: colors.textBody,
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary700,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSoft,
  },
  dividerText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
  },
  loginRow: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    color: colors.textBody,
  },
});
