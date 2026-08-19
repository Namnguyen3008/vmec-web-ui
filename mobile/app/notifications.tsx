import { useRouter } from "expo-router";
import { ArrowLeft, Bell, BellRing, CheckCheck } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  type AppNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatRelative } from "@/lib/format/datetime";
import { colors } from "@/theme/colors";

export default function NotificationsScreen() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const { items: fetched } = await listNotifications(accessToken);
    setItems(fetched);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    load()
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, load]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch {
      // giữ danh sách hiện tại nếu làm mới thất bại
    } finally {
      setRefreshing(false);
    }
  }

  async function handlePressItem(item: AppNotification) {
    if (item.read_at || !accessToken) return;
    const now = new Date().toISOString();
    setItems((current) => current.map((n) => (n.id === item.id ? { ...n, read_at: now } : n)));
    try {
      await markNotificationRead(accessToken, item.id);
    } catch {
      setItems((current) => current.map((n) => (n.id === item.id ? { ...n, read_at: null } : n)));
    }
  }

  async function handleMarkAllRead() {
    if (!accessToken || markingAll) return;
    setMarkingAll(true);
    const now = new Date().toISOString();
    const previous = items;
    setItems((current) => current.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    try {
      await markAllNotificationsRead(accessToken);
    } catch {
      setItems(previous);
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = items.filter((n) => !n.read_at).length;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.iconButton} hitSlop={8} onPress={() => router.back()}>
            <ArrowLeft size={20} color={colors.textLabel} />
          </Pressable>
          <Text style={styles.brand}>Thông báo</Text>
        </View>
        <Pressable style={styles.iconButton} hitSlop={8} onPress={handleMarkAllRead} disabled={unreadCount === 0 || markingAll}>
          <CheckCheck size={20} color={unreadCount === 0 ? colors.textMuted : colors.primary700} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary700} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Bell size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>Bạn chưa có thông báo nào.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {items.map((item) => {
            const unread = !item.read_at;
            return (
              <Pressable
                key={item.id}
                style={[styles.card, unread && styles.cardUnread]}
                onPress={() => handlePressItem(item)}
              >
                <View style={styles.cardIconWrap}>
                  <BellRing size={18} color={unread ? colors.primary700 : colors.textMuted} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardContent}>{item.content}</Text>
                  <Text style={styles.cardTime}>{formatRelative(item.created_at)}</Text>
                </View>
                {unread ? <View style={styles.unreadDot} /> : null}
              </Pressable>
            );
          })}
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    padding: 16,
  },
  cardUnread: {
    backgroundColor: colors.primaryTint,
    borderColor: "rgba(39,101,123,0.2)",
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.textLabel,
  },
  cardContent: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
  },
  cardTime: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 9999,
    backgroundColor: colors.primary700,
    marginTop: 4,
  },
});
