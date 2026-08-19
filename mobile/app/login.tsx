import { Link, useRouter } from "expo-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { MascotIcon } from "@/components/icons/MascotIcon";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { colors } from "@/theme/colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      if (!(err instanceof ApiError)) console.error("[login] lỗi không xác định:", err);
      setError(err instanceof ApiError ? err.message : "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.avatar}>
            <MascotIcon size={33} />
          </View>
          <Text style={styles.heading}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Chào mừng bạn trở lại! Vui lòng đăng nhập để tiếp tục.</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextField
            icon={<Mail size={20} color={colors.textMuted} />}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <TextField
            icon={<Lock size={20} color={colors.textMuted} />}
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType="password"
            rightElement={
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                {showPassword ? (
                  <EyeOff size={20} color={colors.textMuted} />
                ) : (
                  <Eye size={20} color={colors.textMuted} />
                )}
              </Pressable>
            }
          />

          <View style={styles.forgotRow}>
            <Text style={styles.link}>Quên mật khẩu?</Text>
          </View>

          <Button
            title={submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            onPress={handleSubmit}
            disabled={submitting || !email || !password}
            loading={submitting}
            icon={<ArrowRight size={16} color={colors.white} />}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Hoặc</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          title="Đăng nhập với Google"
          variant="outline"
          onPress={() => {}}
          icon={<GoogleIcon size={20} />}
        />

        <Text style={styles.signUpRow}>
          Chưa có tài khoản?{" "}
          <Link href="/register" asChild>
            <Text style={styles.link}>Tạo tài khoản</Text>
          </Link>
        </Text>

        <Text style={styles.disclaimer}>
          Hồ sơ Google cần bổ sung thông tin y tế bắt buộc trước khi sử dụng.
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
    gap: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
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
  forgotRow: {
    alignItems: "flex-end",
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.primary700,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    letterSpacing: 0.6,
    fontWeight: "600",
    color: colors.textMuted,
  },
  signUpRow: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    color: colors.textBody,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    fontStyle: "italic",
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
});
