import { useURL } from "expo-linking";
import { useRouter } from "expo-router";
import { AlertTriangle, CheckCircle2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { colors } from "@/theme/colors";

type ScreenState =
  | { status: "verifying" }
  | { status: "success"; autoLoggedIn: boolean }
  | { status: "error"; message: string };

// Supabase trả token/lỗi qua cả query string lẫn URL fragment tùy flow
// (implicit vs PKCE) — gộp cả hai để không phụ thuộc vào flow nào.
function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryIndex = url.indexOf("?");
  const hashIndex = url.indexOf("#");

  function collect(segment: string) {
    new URLSearchParams(segment).forEach((value, key) => {
      params[key] = value;
    });
  }

  if (queryIndex !== -1) {
    const end = hashIndex > queryIndex ? hashIndex : url.length;
    collect(url.slice(queryIndex + 1, end));
  }
  if (hashIndex !== -1) {
    collect(url.slice(hashIndex + 1));
  }
  return params;
}

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const { loginWithTokens } = useAuth();
  const url = useURL();
  const [state, setState] = useState<ScreenState>({ status: "verifying" });
  const handledRef = useRef(false);

  useEffect(() => {
    if (!url || handledRef.current) return;
    handledRef.current = true;

    const params = parseUrlParams(url);

    if (params.error) {
      setState({
        status: "error",
        message:
          params.error_code === "otp_expired"
            ? "Liên kết xác nhận đã hết hạn. Vui lòng đăng ký lại hoặc yêu cầu gửi email mới."
            : params.error_description || "Xác nhận email thất bại.",
      });
      return;
    }

    if (!params.access_token || !params.refresh_token) {
      // Không có token trong URL (vd. mở thẳng màn hình) — vẫn coi như link đã
      // xác nhận xong phía Supabase, chỉ là không tự đăng nhập được ở đây.
      setState({ status: "success", autoLoggedIn: false });
      return;
    }

    loginWithTokens({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
      expires_in: Number(params.expires_in ?? 3600),
      token_type: params.token_type ?? "bearer",
    })
      .then(() => setState({ status: "success", autoLoggedIn: true }))
      .catch((err) => {
        setState({
          status: "error",
          message:
            err instanceof ApiError
              ? err.message
              : "Không thể hoàn tất đăng nhập tự động. Vui lòng đăng nhập thủ công.",
        });
      });
  }, [url, loginWithTokens]);

  if (state.status === "verifying") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary700} />
        <Text style={styles.subtitle}>Đang xác nhận email...</Text>
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <View style={styles.container}>
        <AlertTriangle size={64} color={colors.danger} />
        <Text style={styles.heading}>Xác nhận email thất bại</Text>
        <Text style={styles.subtitle}>{state.message}</Text>
        <View style={styles.action}>
          <Button title="Về trang đăng nhập" onPress={() => router.replace("/login")} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CheckCircle2 size={64} color={colors.primary700} />
      <Text style={styles.heading}>Xác nhận email thành công</Text>
      <Text style={styles.subtitle}>
        {state.autoLoggedIn
          ? "Tài khoản của bạn đã được kích hoạt và đăng nhập tự động."
          : "Tài khoản của bạn đã được kích hoạt. Vui lòng đăng nhập để tiếp tục."}
      </Text>
      <View style={styles.action}>
        <Button
          title={state.autoLoggedIn ? "Vào ứng dụng" : "Đăng nhập ngay"}
          onPress={() => router.replace(state.autoLoggedIn ? "/" : "/login")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: colors.white,
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary700,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
    textAlign: "center",
  },
  action: {
    width: "100%",
    marginTop: 12,
  },
});
