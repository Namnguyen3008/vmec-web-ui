import { useRouter } from "expo-router";
import { ArrowLeft, Mic, MoreVertical, Send } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MascotIcon } from "@/components/icons/MascotIcon";
import { type CreateAppointmentPayload, createAppointment } from "@/lib/api/appointments";
import {
  type AppointmentOffer,
  type ChatActionType,
  type ChatMessageDoc,
  chatAction,
  closeSession,
  createSession,
  listMessages,
  listSessions,
  sendMessage,
} from "@/lib/api/chat";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatSlotRange } from "@/lib/format/datetime";
import { colors } from "@/theme/colors";

type ChatMessage =
  | { id: string; role: "user"; kind: "text"; text: string }
  | { id: string; role: "ai"; kind: "text"; text: string }
  | { id: string; role: "ai"; kind: "booking"; offer: AppointmentOffer; actions: ChatActionType[] };

function toUiMessage(doc: ChatMessageDoc): ChatMessage {
  return {
    id: doc.id,
    role: doc.sender_type === "PATIENT" ? "user" : "ai",
    kind: "text",
    text: doc.content,
  };
}

export default function AssistantScreen() {
  const router = useRouter();
  const { accessToken, profile } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const { items } = await listSessions(accessToken);
        const active = items.find((s) => s.status === "ACTIVE");
        const session = active ?? (await createSession(accessToken));
        if (cancelled) return;
        setSessionId(session.id);
        const { items: msgs } = await listMessages(accessToken, session.id);
        if (cancelled) return;
        setMessages(msgs.map(toUiMessage));
      } catch {
        if (!cancelled) {
          setMessages([
            { id: "init-error", role: "ai", kind: "text", text: "Không thể tải cuộc trò chuyện. Vui lòng thử lại." },
          ]);
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  function appendMessage(message: ChatMessage) {
    setMessages((current) => [...current, message]);
  }

  function dropBookingCards() {
    setMessages((current) => current.filter((m) => m.kind !== "booking"));
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || !accessToken || !sessionId || sending) return;

    const optimisticId = `local-${Date.now()}`;
    appendMessage({ id: optimisticId, role: "user", kind: "text", text });
    setInput("");
    setSending(true);

    try {
      const result = await sendMessage(accessToken, sessionId, text);
      setMessages((current) => {
        const next = current.filter((m) => m.id !== optimisticId);
        next.push({ id: result.user_message.id, role: "user", kind: "text", text: result.user_message.content });
        next.push({ id: result.assistant_message.id, role: "ai", kind: "text", text: result.assistant_message.content });
        if (result.appointment_offer) {
          next.push({
            id: `${result.assistant_message.id}-offer`,
            role: "ai",
            kind: "booking",
            offer: result.appointment_offer,
            actions: result.available_actions ?? [],
          });
        }
        return next;
      });
    } catch (err) {
      appendMessage({
        id: `error-${Date.now()}`,
        role: "ai",
        kind: "text",
        text: err instanceof ApiError ? err.message : "Đã có lỗi xảy ra. Vui lòng thử lại.",
      });
    } finally {
      setSending(false);
    }
  }

  function buildPatientSnapshot(): CreateAppointmentPayload["patient_snapshot"] | null {
    if (!profile || !profile.phone_number) return null;
    return {
      full_name: profile.full_name,
      phone_number: profile.phone_number,
      date_of_birth: profile.date_of_birth,
      gender: (profile.gender as CreateAppointmentPayload["patient_snapshot"]["gender"]) || "UNKNOWN",
      address: profile.address,
      patient_subject: "SELF",
    };
  }

  async function handleAccept(offer: AppointmentOffer) {
    if (!accessToken || !sessionId || actionBusy) return;
    const snapshot = buildPatientSnapshot();
    if (!snapshot) {
      appendMessage({
        id: `error-${Date.now()}`,
        role: "ai",
        kind: "text",
        text: "Hồ sơ của bạn chưa có số điện thoại. Vui lòng cập nhật hồ sơ trước khi đặt lịch.",
      });
      return;
    }
    setActionBusy(true);
    try {
      const result = await chatAction(accessToken, sessionId, "ACCEPT_APPOINTMENT", { slot_id: offer.slot_id });
      dropBookingCards();
      appendMessage({ id: `reply-${Date.now()}`, role: "ai", kind: "text", text: result.reply_text });
      if (result.checkout) {
        const appointment = await createAppointment(accessToken, {
          slot_id: result.checkout.slot_id,
          hold_token: result.checkout.hold_token,
          patient_snapshot: snapshot,
          chat_session_id: sessionId,
        });
        appendMessage({
          id: `confirmed-${Date.now()}`,
          role: "ai",
          kind: "text",
          text: `🎉 Đặt lịch thành công! Mã lịch hẹn: ${appointment.appointment_code ?? appointment.id}. Bạn có thể xem chi tiết trong mục Hồ sơ bệnh án.`,
        });
      }
    } catch (err) {
      appendMessage({
        id: `error-${Date.now()}`,
        role: "ai",
        kind: "text",
        text: err instanceof ApiError ? err.message : "Không thể xác nhận đặt lịch. Vui lòng thử lại.",
      });
    } finally {
      setActionBusy(false);
    }
  }

  async function handleChange() {
    if (!accessToken || !sessionId || actionBusy) return;
    setActionBusy(true);
    try {
      const result = await chatAction(accessToken, sessionId, "CHANGE_APPOINTMENT");
      dropBookingCards();
      appendMessage({ id: `reply-${Date.now()}`, role: "ai", kind: "text", text: result.reply_text });
      if (result.appointment_offer) {
        appendMessage({
          id: `offer-${Date.now()}`,
          role: "ai",
          kind: "booking",
          offer: result.appointment_offer,
          actions: result.available_actions ?? [],
        });
      }
    } catch (err) {
      appendMessage({
        id: `error-${Date.now()}`,
        role: "ai",
        kind: "text",
        text: err instanceof ApiError ? err.message : "Không thể đổi lịch. Vui lòng thử lại.",
      });
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDecline() {
    if (!accessToken || !sessionId || actionBusy) return;
    setActionBusy(true);
    try {
      const result = await chatAction(accessToken, sessionId, "DECLINE_APPOINTMENT");
      dropBookingCards();
      appendMessage({ id: `reply-${Date.now()}`, role: "ai", kind: "text", text: result.reply_text });
    } catch (err) {
      appendMessage({
        id: `error-${Date.now()}`,
        role: "ai",
        kind: "text",
        text: err instanceof ApiError ? err.message : "Không thể huỷ yêu cầu. Vui lòng thử lại.",
      });
    } finally {
      setActionBusy(false);
    }
  }

  async function handleNewConversation() {
    if (!accessToken || !sessionId || initializing) return;
    setInitializing(true);
    try {
      await closeSession(accessToken, sessionId).catch(() => {});
      const session = await createSession(accessToken);
      setSessionId(session.id);
      setMessages([]);
    } catch {
      appendMessage({
        id: `error-${Date.now()}`,
        role: "ai",
        kind: "text",
        text: "Không thể bắt đầu hội thoại mới. Vui lòng thử lại.",
      });
    } finally {
      setInitializing(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.iconButton} hitSlop={8} onPress={() => router.back()}>
            <ArrowLeft size={20} color={colors.textLabel} />
          </Pressable>
          <View style={styles.headerAvatar}>
            <MascotIcon size={18} color={colors.primary700} />
          </View>
          <Text style={styles.brand}>MedAgent AI</Text>
        </View>
        <Pressable style={styles.iconButton} hitSlop={8} onPress={handleNewConversation} disabled={initializing}>
          <MoreVertical size={20} color={colors.textLabel} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {initializing ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary700} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((message) => {
              if (message.role === "user") {
                return (
                  <View key={message.id} style={styles.userRow}>
                    <View style={styles.userBubble}>
                      <Text style={styles.userText}>{message.text}</Text>
                    </View>
                  </View>
                );
              }
              if (message.kind === "booking") {
                return (
                  <BookingCard
                    key={message.id}
                    offer={message.offer}
                    actions={message.actions}
                    busy={actionBusy}
                    onAccept={() => handleAccept(message.offer)}
                    onChange={handleChange}
                    onDecline={handleDecline}
                  />
                );
              }
              return (
                <View key={message.id} style={styles.aiRow}>
                  <View style={styles.aiAvatar}>
                    <MascotIcon size={15} color={colors.primary700} />
                  </View>
                  <View style={styles.aiBubble}>
                    <Text style={styles.aiText}>{message.text}</Text>
                  </View>
                </View>
              );
            })}
            {sending ? (
              <View style={styles.aiRow}>
                <View style={styles.aiAvatar}>
                  <MascotIcon size={15} color={colors.primary700} />
                </View>
                <View style={styles.aiBubble}>
                  <ActivityIndicator color={colors.primary700} size="small" />
                </View>
              </View>
            ) : null}
          </ScrollView>
        )}

        <View style={styles.bottomBar}>
          <View style={styles.inputRow}>
            {/* TODO: nhập liệu bằng giọng nói khi có tích hợp speech-to-text */}
            <Pressable style={styles.micButton} onPress={() => {}}>
              <Mic size={16} color={colors.primary700} />
            </Pressable>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!initializing}
            />
            <Pressable style={styles.sendButton} onPress={handleSend} hitSlop={8} disabled={sending || initializing}>
              <Send size={18} color={colors.primary700} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function BookingCard({
  offer,
  actions,
  busy,
  onAccept,
  onChange,
  onDecline,
}: {
  offer: AppointmentOffer;
  actions: ChatActionType[];
  busy: boolean;
  onAccept: () => void;
  onChange: () => void;
  onDecline: () => void;
}) {
  return (
    <View style={styles.bookingRow}>
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingTitle}>Đề xuất lịch khám</Text>
          <Text style={styles.bookingSubtitle}>{offer.specialty_name}</Text>
        </View>

        <View style={styles.bookingSection}>
          <Text style={styles.bookingLabel}>{offer.doctor_name}</Text>
          <Text style={styles.bookingDetailText}>{formatSlotRange(offer.slot_start, offer.slot_end)}</Text>
          <Text style={styles.bookingDetailText}>
            {offer.facility_name}
            {offer.room ? ` • ${offer.room}` : ""}
          </Text>
        </View>

        <View style={styles.bookingActions}>
          {actions.includes("ACCEPT_APPOINTMENT") ? (
            <Pressable style={styles.confirmButton} onPress={onAccept} disabled={busy}>
              <Text style={styles.confirmButtonText}>{busy ? "Đang xử lý..." : "Xác nhận đặt lịch"}</Text>
            </Pressable>
          ) : null}
          <View style={styles.bookingSecondaryRow}>
            {actions.includes("CHANGE_APPOINTMENT") ? (
              <Pressable style={styles.secondaryButton} onPress={onChange} disabled={busy}>
                <Text style={styles.secondaryButtonText}>Xem lịch khác</Text>
              </Pressable>
            ) : null}
            {actions.includes("DECLINE_APPOINTMENT") ? (
              <Pressable style={styles.secondaryButton} onPress={onDecline} disabled={busy}>
                <Text style={styles.declineButtonText}>Huỷ</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.pageBg,
    paddingTop: Platform.OS === "android" ? 24 : 0,
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
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: colors.primary700,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chatContent: {
    padding: 16,
    gap: 16,
  },
  userRow: {
    alignItems: "flex-end",
  },
  userBubble: {
    maxWidth: "80%",
    backgroundColor: colors.primary700,
    borderRadius: 16,
    borderTopRightRadius: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#4D616B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  },
  aiRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-end",
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  aiBubble: {
    flexShrink: 1,
    maxWidth: "78%",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    borderTopLeftRadius: 2,
    paddingHorizontal: 17,
    paddingVertical: 13,
    shadowColor: "#4D616B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  aiText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textLabel,
  },
  bookingRow: {
    paddingLeft: 44,
  },
  bookingCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    padding: 17,
    gap: 16,
    shadowColor: "#4D616B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 9,
  },
  bookingTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.primary700,
  },
  bookingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.textBody,
  },
  bookingSection: {
    gap: 4,
  },
  bookingLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.textLabel,
  },
  bookingDetailText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
  },
  bookingActions: {
    gap: 8,
  },
  bookingSecondaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  confirmButton: {
    backgroundColor: colors.primary700,
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.white,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9999,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.textLabel,
  },
  declineButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.danger,
  },
  bottomBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 12,
    gap: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: "rgba(131,189,213,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 9999,
    paddingHorizontal: 17,
    fontSize: 16,
    color: colors.textLabel,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
});
