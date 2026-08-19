import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MapPin, Stethoscope, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type CatalogDoctor, listDoctors } from "@/lib/api/catalog";
import { useAuth } from "@/lib/auth/AuthContext";
import { colors } from "@/theme/colors";

export default function DoctorsScreen() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { specialtyId, specialtyName } = useLocalSearchParams<{ specialtyId: string; specialtyName: string }>();
  const [doctors, setDoctors] = useState<CatalogDoctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !specialtyId) return;
    let cancelled = false;
    setLoading(true);
    listDoctors(accessToken, specialtyId)
      .then(({ items }) => {
        if (!cancelled) setDoctors(items);
      })
      .catch(() => {
        if (!cancelled) setDoctors([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, specialtyId]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} hitSlop={8} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.textLabel} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {specialtyName ?? "Bác sĩ"}
        </Text>
        <View style={styles.iconButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary700} />
        </View>
      ) : doctors.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Hiện chưa có bác sĩ nào nhận khám chuyên khoa này.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {doctors.map((doctor) => (
            <View key={doctor.id} style={styles.card}>
              <View style={styles.avatar}>
                {doctor.avatar_url ? (
                  <Image source={{ uri: doctor.avatar_url }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <User size={22} color={colors.primary700} />
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.doctorName}>{doctor.full_name}</Text>
                {doctor.bio ? <Text style={styles.doctorBio}>{doctor.bio}</Text> : null}
                <View style={styles.metaRow}>
                  <Stethoscope size={14} color={colors.textBody} />
                  <Text style={styles.metaText}>{doctor.specialty_name}</Text>
                </View>
                {doctor.facility_name ? (
                  <View style={styles.metaRow}>
                    <MapPin size={14} color={colors.textBody} />
                    <Text style={styles.metaText}>
                      {doctor.facility_name}
                      {doctor.room ? ` • ${doctor.room}` : ""}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
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
    flexDirection: "row",
    gap: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    padding: 17,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  doctorName: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.textLabel,
  },
  doctorBio: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textBody,
  },
});
