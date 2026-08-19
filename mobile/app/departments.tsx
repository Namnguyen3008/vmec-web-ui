import { useRouter } from "expo-router";
import { ArrowLeft, Baby, Bone, Brain, HeartPulse, Stethoscope, User } from "lucide-react-native";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DentalIcon } from "@/components/icons/DentalIcon";
import { GastroHepatologyIcon } from "@/components/icons/GastroHepatologyIcon";
import { TraditionalMedicineIcon } from "@/components/icons/TraditionalMedicineIcon";
import { type CatalogDoctor, listDoctors } from "@/lib/api/catalog";
import { useAuth } from "@/lib/auth/AuthContext";
import { colors } from "@/theme/colors";

interface IconProps {
  size?: number;
  color?: string;
}

const ICON_RULES: { match: RegExp; Icon: ComponentType<IconProps> }[] = [
  { match: /nha khoa|răng/i, Icon: DentalIcon },
  { match: /thần kinh/i, Icon: Brain },
  { match: /cổ truyền|đông y/i, Icon: TraditionalMedicineIcon },
  { match: /tiêu hóa|gan mật/i, Icon: GastroHepatologyIcon },
  { match: /nhi\b/i, Icon: Baby },
  { match: /chấn thương|chỉnh hình|xương khớp/i, Icon: Bone },
  { match: /tim mạch/i, Icon: HeartPulse },
];

function iconForSpecialty(name: string): ComponentType<IconProps> {
  const rule = ICON_RULES.find((r) => r.match.test(name));
  return rule?.Icon ?? Stethoscope;
}

interface SpecialtyGroup {
  specialtyId: string;
  specialtyName: string;
  doctorCount: number;
}

function groupBySpecialty(doctors: CatalogDoctor[]): SpecialtyGroup[] {
  const map = new Map<string, SpecialtyGroup>();
  for (const doctor of doctors) {
    const existing = map.get(doctor.specialty_id);
    if (existing) {
      existing.doctorCount += 1;
    } else {
      map.set(doctor.specialty_id, {
        specialtyId: doctor.specialty_id,
        specialtyName: doctor.specialty_name,
        doctorCount: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.specialtyName.localeCompare(b.specialtyName));
}

export default function DepartmentsScreen() {
  const router = useRouter();
  const { profile, accessToken } = useAuth();
  const [specialties, setSpecialties] = useState<SpecialtyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    listDoctors(accessToken)
      .then(({ items }) => {
        if (!cancelled) setSpecialties(groupBySpecialty(items));
      })
      .catch(() => {
        if (!cancelled) setSpecialties([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} hitSlop={8} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.textLabel} />
        </Pressable>
        <Text style={styles.title}>Danh mục Khoa</Text>
        <View style={styles.avatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <User size={16} color={colors.primary700} />
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Khám phá các chuyên khoa đang nhận khám. Chọn một khoa để xem danh sách bác sĩ.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary700} />
        ) : specialties.length === 0 ? (
          <Text style={styles.emptyText}>Hiện chưa có chuyên khoa nào đang nhận khám.</Text>
        ) : (
          <View style={styles.list}>
            {specialties.map(({ specialtyId, specialtyName, doctorCount }) => {
              const Icon = iconForSpecialty(specialtyName);
              return (
                <Pressable
                  key={specialtyId}
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: "/doctors",
                      params: { specialtyId, specialtyName },
                    })
                  }
                >
                  <View style={styles.iconWrap}>
                    <Icon size={24} color={colors.primary700} />
                  </View>
                  <Text style={styles.cardTitle}>{specialtyName}</Text>
                  <Text style={styles.cardDescription}>
                    {doctorCount} bác sĩ đang nhận khám
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    backgroundColor: colors.chipBg,
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
    letterSpacing: -0.4,
    color: colors.primary700,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: colors.calloutBorder,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    padding: 20,
    gap: 32,
  },
  intro: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textBody,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
    textAlign: "center",
  },
  list: {
    gap: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    gap: 8,
    shadowColor: "#51666F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 9999,
    backgroundColor: "rgba(39,101,123,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
    color: colors.textLabel,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textBody,
    textAlign: "center",
  },
});
