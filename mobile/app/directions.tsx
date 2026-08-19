import {
  ArrowUpDown,
  CornerUpLeft,
  DoorOpen,
  Footprints,
  MapPin,
  Maximize2,
  Route,
  Stethoscope,
  User,
  UserRound,
} from "lucide-react-native";
import type { ComponentType } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth/AuthContext";
import { colors } from "@/theme/colors";

const floorMap = require("../assets/directions/floor-map.jpg");

// Dữ liệu tĩnh minh hoạ — chưa nối API lịch hẹn/sơ đồ tầng thật, sẽ thay khi có backend.
const DESTINATION = {
  room: "Phòng khám số 302",
  department: "Khoa Chấn thương Chỉnh hình",
  doctor: "BS. Nguyễn Văn B.",
  floorLabel: "Sơ đồ Tầng 3 - Khu C",
};

interface IconProps {
  size?: number;
  color?: string;
}

const STEPS: {
  id: number;
  title: string;
  description: string;
  Icon: ComponentType<IconProps>;
  isDestination?: boolean;
}[] = [
  { id: 1, title: "Bước 1", description: "Di chuyển từ Cổng chính đến Sảnh A.", Icon: Footprints },
  { id: 2, title: "Bước 2", description: "Đi thang máy lên Tầng 3.", Icon: ArrowUpDown },
  { id: 3, title: "Bước 3", description: "Rẽ trái tại hành lang khu C.", Icon: CornerUpLeft },
  {
    id: 4,
    title: "Bước 4",
    description: "Phòng khám 302 nằm ở cuối hành lang bên phải.",
    Icon: DoorOpen,
    isDestination: true,
  },
];

export default function DirectionsScreen() {
  const { profile } = useAuth();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Route size={20} color={colors.primary700} />
          <Text style={styles.brand}>MedAgent AI</Text>
        </View>
        <View style={styles.avatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <User size={16} color={colors.primary700} />
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.destinationCard}>
          <View style={styles.destinationRow}>
            <View style={styles.destinationIconWrap}>
              <MapPin size={22} color={colors.primary700} />
            </View>
            <View style={styles.destinationInfo}>
              <Text style={styles.destinationLabel}>THÔNG TIN ĐIỂM ĐẾN</Text>
              <Text style={styles.destinationRoom}>{DESTINATION.room}</Text>
            </View>
          </View>

          <View style={styles.destinationDetails}>
            <View style={styles.detailRow}>
              <Stethoscope size={17} color={colors.textBody} />
              <Text style={styles.detailText}>{DESTINATION.department}</Text>
            </View>
            <View style={styles.detailRow}>
              <UserRound size={17} color={colors.textBody} />
              <Text style={styles.detailText}>{DESTINATION.doctor}</Text>
            </View>
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapHeaderTitle}>{DESTINATION.floorLabel}</Text>
            {/* TODO: mở sơ đồ toàn màn hình khi có màn/chức năng tương ứng */}
            <Pressable hitSlop={8} onPress={() => {}}>
              <Maximize2 size={15} color={colors.textBody} />
            </Pressable>
          </View>
          <View style={styles.mapImageWrap}>
            <Image source={floorMap} style={styles.mapImage} resizeMode="cover" />
            <View style={styles.mapMarker}>
              <View style={styles.mapMarkerPin}>
                <MapPin size={16} color={colors.white} />
              </View>
              <View style={styles.mapMarkerLabel}>
                <Text style={styles.mapMarkerLabelText}>302</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Các bước di chuyển</Text>
          <View style={styles.stepsTimeline}>
            <View style={styles.stepsLine} />
            {STEPS.map(({ id, title, description, Icon, isDestination }) => (
              <View key={id} style={styles.step}>
                <View style={styles.stepIconOuter}>
                  <View style={[styles.stepIconInner, isDestination && styles.stepIconInnerDestination]}>
                    <Icon size={16} color={isDestination ? colors.white : colors.primary700} />
                  </View>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, isDestination && styles.stepTitleDestination]}>{title}</Text>
                  {isDestination ? (
                    <View style={styles.stepHighlightBox}>
                      <Text style={styles.stepHighlightText}>{description}</Text>
                    </View>
                  ) : (
                    <Text style={styles.stepDescription}>{description}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
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
    padding: 16,
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
  brand: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: colors.primary700,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: colors.photoBg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  destinationCard: {
    backgroundColor: colors.pageBg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    padding: 25,
    gap: 16,
    shadowColor: "#4D616B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  destinationRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  destinationIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: "rgba(39,101,123,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  destinationInfo: {
    gap: 4,
    flex: 1,
  },
  destinationLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.primary700,
  },
  destinationRoom: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "600",
    color: colors.textLabel,
  },
  destinationDetails: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 17,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textBody,
  },
  mapCard: {
    backgroundColor: colors.pageBg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#4D616B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 17,
  },
  mapHeaderTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.textLabel,
  },
  mapImageWrap: {
    height: 200,
    backgroundColor: colors.chipBg,
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  mapMarker: {
    position: "absolute",
    top: "22%",
    left: "56%",
    alignItems: "center",
    gap: 4,
  },
  mapMarkerPin: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.pageBg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  mapMarkerLabel: {
    backgroundColor: "rgba(249,249,251,0.9)",
    borderWidth: 1,
    borderColor: "rgba(225,226,228,0.5)",
    borderRadius: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  mapMarkerLabelText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.textLabel,
  },
  stepsCard: {
    backgroundColor: colors.pageBg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    padding: 25,
    gap: 32,
    shadowColor: "#4D616B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  stepsTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.textLabel,
  },
  stepsTimeline: {
    position: "relative",
    gap: 32,
  },
  stepsLine: {
    position: "absolute",
    left: 19,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: "rgba(225,226,228,0.5)",
  },
  step: {
    flexDirection: "row",
    gap: 16,
  },
  stepIconOuter: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: colors.pageBg,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconInner: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: colors.calloutBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconInnerDestination: {
    backgroundColor: colors.primary700,
  },
  stepContent: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.textLabel,
  },
  stepTitleDestination: {
    color: colors.primary700,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.textBody,
  },
  stepHighlightBox: {
    backgroundColor: "rgba(131,189,213,0.2)",
    borderWidth: 1,
    borderColor: "rgba(39,101,123,0.1)",
    borderRadius: 8,
    padding: 13,
    marginTop: 4,
  },
  stepHighlightText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: colors.textLabel,
  },
});
