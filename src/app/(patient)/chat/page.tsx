"use client";

import { Fragment, useEffect, useState, useRef } from "react";
import { UserBubble, AgentBubble, TypingDots, type CitationItem } from "@/components/chat/ChatBubbles";
import { LivingContextSidebar } from "@/components/chat/LivingContextSidebar";
import { ContextualQuickChips } from "@/components/chat/ContextualQuickChips";
import { PsychologicalSoothingCard } from "@/components/chat/PsychologicalSoothingCard";
import { AgentObservabilityButton } from "@/components/chat/AgentObservabilityButton";
import { ChatInput } from "@/components/chat/ChatInput";
import { BookingCheckout } from "@/components/chat/BookingCheckout";
import { AppointmentQrCard } from "@/components/bookings/AppointmentQrCard";
import { DoctorSlotSelector } from "@/components/chat/DoctorSlotSelector";
import { Button } from "@/components/ui/Button";
import {
  createChatSession,
  listChatMessages,
  listChatSessions,
  sendChatAction,
  sendChatMessage,
} from "@/lib/api/chat";
import {
  getOrCreateLivingContext,
  updateLivingContextWithUserMessage,
  updateLivingContextWithUserMessageAsync,
  forceCompleteLivingContext,
} from "@/lib/ai/workingMemoryStore";
import { getActivePatientAppointment } from "@/lib/api/appointments";
import type { DetailedAppointment } from "@/lib/mockData";
import type { LivingClinicalContext, PsychologicalSoothingPayload } from "@/lib/ai/types";
import { ApiError } from "@/lib/api/client";
import { containsOfferSection, splitOfferSection } from "@/lib/chatContent";
import type { AppointmentOffer, ChatActionType, ChatMessage, CheckoutContext } from "@/lib/api/contracts";
import { RotateCcw, PanelRightOpen, X, Bot, CalendarCheck, AlertCircle } from "lucide-react";

interface UiMessage {
  id: string;
  sender: "PATIENT" | "AI";
  content: string;
  citations?: CitationItem[];
  confidenceScore?: number;
  soothingPayload?: PsychologicalSoothingPayload | null;
  appointmentQr?: { appointmentId: string; appointmentCode: string | null };
}

const CHAT_SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;

const INITIAL_WELCOME_MESSAGE: UiMessage = {
  id: "msg_welcome_init",
  sender: "AI",
  content:
    "Chào bạn! Tôi là **AI Agent Trợ Lý Đặt Lịch Khám & Điều Hướng Chuyên Khoa Thông Minh (VMEC)**. Hãy chia sẻ về triệu chứng hoặc nhu cầu khám bệnh bạn đang gặp phải. Tôi sẽ cùng bạn lắng nghe, làm rõ tình trạng, gợi ý chuyên khoa phù hợp và hỗ trợ giữ chỗ đặt lịch khám nhanh chóng.",
};

function toUiMessage(message: ChatMessage): UiMessage {
  return {
    id: message.id,
    sender: message.senderType,
    content:
      message.senderType === "AI"
        ? splitOfferSection(message.content).advice
        : message.content,
    citations: message.citations,
    confidenceScore: message.senderType === "AI" ? 96 : undefined,
    appointmentQr:
      message.messageType === "APPOINTMENT_QR" &&
      typeof message.metadata.appointment_id === "string"
        ? {
            appointmentId: message.metadata.appointment_id,
            appointmentCode:
              typeof message.metadata.appointment_code === "string"
                ? message.metadata.appointment_code
                : null,
          }
        : undefined,
  };
}

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emergency, setEmergency] = useState<string | null>(null);
  const [actions, setActions] = useState<ChatActionType[]>([]);
  const [offers, setOffers] = useState<AppointmentOffer[]>([]);
  const [checkout, setCheckout] = useState<CheckoutContext | null>(null);
  const [lastRawOfferText, setLastRawOfferText] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Active booked appointment and session booking status
  const [activeAppointment, setActiveAppointment] = useState<DetailedAppointment | null>(() =>
    getActivePatientAppointment()
  );
  const [hasBookedInSession, setHasBookedInSession] = useState(false);

  // Living Clinical Context State
  const [livingContext, setLivingContext] = useState<LivingClinicalContext>(() =>
    getOrCreateLivingContext("default_session")
  );

  const localMessageIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function restoreActiveSession() {
      try {
        const [latestSession] = await listChatSessions(1);
        if (
          !latestSession ||
          latestSession.status !== "ACTIVE" ||
          Date.now() - Date.parse(latestSession.startedAt) >= CHAT_SESSION_LIFETIME_MS
        ) {
          const freshContext = getOrCreateLivingContext("default_session");
          setLivingContext(freshContext);
          return;
        }

        const history = await listChatMessages(latestSession.id);
        if (cancelled) return;

        setSessionId(latestSession.id);
        setMessages(history.length > 0 ? history.map(toUiMessage) : [INITIAL_WELCOME_MESSAGE]);

        const lastAssistantMessage = [...history]
          .reverse()
          .find((message) => message.senderType === "AI");
        setLastRawOfferText(lastAssistantMessage?.content || "");

        const context = getOrCreateLivingContext(latestSession.id);
        setLivingContext(context);

        if (latestSession.emergencyFlag) {
          setEmergency(
            "Phiên này đã ghi nhận dấu hiệu khẩn cấp. Hãy gọi 115 hoặc bắt đầu cuộc trò chuyện mới."
          );
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể khôi phục cuộc trò chuyện gần nhất."
          );
        }
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    }

    void restoreActiveSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const checkActive = () => {
      setActiveAppointment(getActivePatientAppointment());
    };
    checkActive();
    window.addEventListener("vmec:appointments-change", checkActive);
    window.addEventListener("p208:schedule-change", checkActive);
    window.addEventListener("p208:appointment-confirmed", checkActive);
    return () => {
      window.removeEventListener("vmec:appointments-change", checkActive);
      window.removeEventListener("p208:schedule-change", checkActive);
      window.removeEventListener("p208:appointment-confirmed", checkActive);
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const refreshConfirmedAppointment = () => {
      void listChatMessages(sessionId)
        .then((history) => setMessages(history.map(toUiMessage)))
        .catch(() => undefined);
    };
    window.addEventListener("p208:appointment-confirmed", refreshConfirmedAppointment);
    return () =>
      window.removeEventListener("p208:appointment-confirmed", refreshConfirmedAppointment);
  }, [sessionId]);

  const currentStep = checkout
    ? 4
    : offers.length > 0 || containsOfferSection(lastRawOfferText)
    ? 3
    : messages.some((m) => m.sender === "PATIENT")
    ? 2
    : 1;

  async function handleSend(textToSend?: string) {
    const raw = textToSend ?? input;
    const trimmed = raw.trim();
    if (!trimmed || isSending) return;

    if (!textToSend) setInput("");
    setError(null);
    setIsSending(true);

    const userMessageId = `user-${Date.now()}-${localMessageIdRef.current++}`;
    setMessages((current) => [
      ...current,
      { id: userMessageId, sender: "PATIENT", content: trimmed },
    ]);

    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const session = await createChatSession(
          trimmed.length > 30 ? `${trimmed.slice(0, 30)}...` : trimmed
        );
        activeSessionId = session.id;
        setSessionId(session.id);
      }

      // Cập nhật Living Context & Thẩm định 4 trường lâm sàng (100% Live 2-Stage Gemini API)
      const { context: updatedContext, replyText } = await updateLivingContextWithUserMessageAsync(
        activeSessionId,
        trimmed
      );
      setLivingContext({ ...updatedContext });

      const result = await sendChatMessage(activeSessionId, trimmed);

      // Luôn ưu tiên phản hồi từ Multi-turn Clinical Evaluator
      const aiReply = replyText;

      setMessages((current) => [
        ...current,
        {
          id: `msg_ai_${Date.now()}`,
          sender: "AI",
          content: aiReply,
          citations: updatedContext.activeCitations,
          confidenceScore: 96,
          soothingPayload: updatedContext.soothingPayload,
        },
      ]);

      if (updatedContext.isCompleted && updatedContext.appointmentOffers.length > 0) {
        setOffers(updatedContext.appointmentOffers);
        setLastRawOfferText(aiReply);
        setActions(["ACCEPT_APPOINTMENT", "CHANGE_APPOINTMENT", "DECLINE_APPOINTMENT"]);
      } else {
        setOffers([]);
        setLastRawOfferText("");
        setActions([]);
      }

      if (result.emergency?.detected || updatedContext.isEmergency) {
        setEmergency(
          result.emergency?.actionMessage ??
            "Triệu chứng có dấu hiệu khẩn cấp theo phác đồ BYT. Vui lòng gọi 115 hoặc đến bệnh viện ngay lập tức!"
        );
      }
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Không thể gửi tin nhắn. Vui lòng thử lại."
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleForceComplete() {
    const activeSessionId = sessionId || "default_session";
    const completed = forceCompleteLivingContext(activeSessionId);
    setLivingContext({ ...completed });
    if (completed.appointmentOffers.length > 0) {
      setOffers(completed.appointmentOffers);
      setActions(["ACCEPT_APPOINTMENT", "CHANGE_APPOINTMENT", "DECLINE_APPOINTMENT"]);
    }
  }

  async function handleAction(actionType: ChatActionType, payload?: Record<string, unknown>) {
    if (!sessionId || isSending) return;
    setError(null);
    setIsSending(true);

    try {
      const result = await sendChatAction(sessionId, actionType, payload);
      setMessages((current) => [
        ...current,
        {
          id: `action-${Date.now()}`,
          sender: "AI",
          content: result.replyText,
        },
      ]);
      setActions(result.availableActions);

      if (result.workflowState === "CHECKOUT_READY" && result.checkout) {
        setCheckout(result.checkout);
      } else if (actionType === "DECLINE_APPOINTMENT" || actionType === "CHANGE_APPOINTMENT") {
        setOffers([]);
        setCheckout(null);
        setLastRawOfferText("");
      }
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Không thể xử lý yêu cầu. Vui lòng thử lại."
      );
    } finally {
      setIsSending(false);
    }
  }

  async function resetChat() {
    setSessionId(null);
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setInput("");
    setError(null);
    setEmergency(null);
    setActions([]);
    setOffers([]);
    setCheckout(null);
    setLastRawOfferText("");
    setHasBookedInSession(false);
    setActiveAppointment(getActivePatientAppointment());
    const fresh = getOrCreateLivingContext(`session_${Date.now()}`);
    setLivingContext(fresh);
  }

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, offers, isSending, emergency, livingContext.suggestedChips, hasBookedInSession, activeAppointment]);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-bg-soft/20">
      {/* Ultra-compact Header Bar */}
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
            <Bot size={16} />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-ink-900 leading-none">
              AI Agent Trợ Lý Đặt Lịch Khám & Điều Hướng Chuyên Khoa
            </h1>
            <p className="text-[10px] text-ink-500 mt-0.5">
              Tiếp nhận triệu chứng, gợi ý chuyên khoa & giữ chỗ khám theo chuẩn Bộ Y Tế
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<RotateCcw size={14} />}
            disabled={isSending || isRestoring}
            onClick={() => void resetChat()}
          >
            Chat mới
          </Button>
        </div>
      </div>

      {/* Global Active Appointment Notification Banner */}
      {activeAppointment && (
        <div className="mx-4 mt-3 rounded-xl border border-primary-300 bg-primary-50/90 px-4 py-2.5 text-xs sm:text-sm text-primary-950 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-primary-600 animate-pulse" />
            <div className="truncate">
              <span className="font-semibold text-primary-900">Bạn đã có 1 lịch hẹn đang xử lý: </span>
              <strong className="text-primary-800">{activeAppointment.appointmentCode || activeAppointment.id}</strong>
              <span className="text-primary-700 font-normal"> ({activeAppointment.specialtyName} — {activeAppointment.doctorName})</span>
            </div>
          </div>
          <a
            href="/bookings"
            className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary-700 px-3 py-1 text-xs font-bold text-white shadow-2xs hover:bg-primary-800 transition-colors"
          >
            Xem lịch hẹn →
          </a>
        </div>
      )}

      {/* 2-Column Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Conversational Stream */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">

            {/* Message Feed */}
            {messages.map((message) =>
              message.sender === "PATIENT" ? (
                <UserBubble key={message.id}>{message.content}</UserBubble>
              ) : (
                <Fragment key={message.id}>
                  <AgentBubble
                    citations={message.citations}
                    confidenceScore={message.confidenceScore}
                    soothingPayload={message.soothingPayload}
                  >
                    {message.content}
                  </AgentBubble>
                  {message.appointmentQr && (
                    <div className="ml-0 sm:ml-12 max-w-sm">
                      <AppointmentQrCard
                        appointmentId={message.appointmentQr.appointmentId}
                        appointmentCode={message.appointmentQr.appointmentCode}
                      />
                    </div>
                  )}
                </Fragment>
              )
            )}

            {/* Dynamic Contextual Quick-Chips for Active Clarification */}
            {!livingContext.isCompleted &&
              !livingContext.isEmergency &&
              livingContext.suggestedChips &&
              livingContext.suggestedChips.length > 0 &&
              !isSending && (
                <ContextualQuickChips
                  chips={livingContext.suggestedChips}
                  onSelect={(fullText) => handleSend(fullText)}
                  disabled={isSending}
                />
              )}

            {isSending && (
              <AgentBubble>
                <TypingDots />
              </AgentBubble>
            )}

            {/* Interactive Doctor & Slot Selector (Hidden if already booked in session OR active appointment exists) */}
            {!hasBookedInSession && !activeAppointment && (offers.length > 0 || containsOfferSection(lastRawOfferText)) && !checkout && (
              <DoctorSlotSelector
                offers={offers}
                rawTextMessage={lastRawOfferText}
                isSubmitting={isSending}
                onSelectOffer={(offer) =>
                  handleAction("ACCEPT_APPOINTMENT", { slot_id: offer.slotId })
                }
                onChangeAppointment={() => handleAction("CHANGE_APPOINTMENT")}
                onDeclineAppointment={() => handleAction("DECLINE_APPOINTMENT")}
              />
            )}

            {/* Booked Appointment Confirmation / Restriction Card */}
            {(hasBookedInSession || (activeAppointment && (offers.length > 0 || livingContext.isCompleted))) && !checkout && (
              <div className="ml-0 sm:ml-12 rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 sm:p-5 text-ink-900 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-2xs">
                    <CalendarCheck size={18} />
                  </div>
                  <div className="flex-1 text-xs sm:text-sm">
                    <h4 className="font-bold text-ink-900 text-sm sm:text-base">
                      {hasBookedInSession ? "Yêu Cầu Đặt Lịch Đã Được Gửi Tới Lễ Tân Thành Công" : "Bạn Đã Có Lịch Hẹn Đang Được Xử Lý"}
                    </h4>
                    <p className="mt-1 text-ink-700 leading-relaxed">
                      {hasBookedInSession
                        ? "Hệ thống đã chuyển thông tin tới Quầy Lễ tân để rà soát và cấp số thứ tự ưu tiên cho bạn. Hộp chọn khung giờ đã được đóng lại để bảo đảm tính chính xác."
                        : `Hệ thống ghi nhận bạn đã có lịch hẹn ${activeAppointment?.appointmentCode ? `(${activeAppointment.appointmentCode})` : ""} cho chuyên khoa ${activeAppointment?.specialtyName || "đã đăng ký"}. Để tránh trùng lặp khung giờ và đảm bảo chất lượng phục vụ, bạn không thể đặt thêm lịch mới lúc này.`}
                    </p>
                    <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                      <a
                        href="/bookings"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
                      >
                        Quản lý và xem tiến độ lịch hẹn →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Checkout Component */}
            {checkout && (
              <BookingCheckout
                context={checkout}
                sessionId={sessionId || "mock-session-ui"}
                onCancel={() => {
                  setCheckout(null);
                  void handleAction("CHANGE_APPOINTMENT");
                }}
                onCompleted={(appointment) => {
                  setCheckout(null);
                  setOffers([]);
                  setLastRawOfferText("");
                  setHasBookedInSession(true);
                  setActiveAppointment(getActivePatientAppointment());
                  setMessages((current) => [
                    ...current,
                    {
                      id: `appointment-${appointment.id}`,
                      sender: "AI",
                      content: `🎉 **Yêu cầu đặt lịch ${
                        appointment.appointmentCode || "APT-2026-CONFIRMED"
                      } đã được gửi tới Lễ tân thành công!**\n\nLễ tân sẽ duyệt lịch và gửi thông báo xác nhận cho bạn qua tin nhắn / ứng dụng trong thời gian sớm nhất. Bạn có thể theo dõi tiến độ duyệt lịch tại trang Quản lý Lịch hẹn.`,
                      appointmentQr: {
                        appointmentId: appointment.id,
                        appointmentCode: appointment.appointmentCode || null,
                      },
                    },
                  ]);
                }}
              />
            )}

            {/* Emergency Warning */}
            {emergency && (
              <div
                role="alert"
                className="ml-0 sm:ml-12 rounded-card border-2 border-danger bg-danger-soft p-4 sm:p-5 text-danger shadow-md"
              >
                <p className="font-bold text-body-lg">⚠️ CẢNH BÁO KHẨN CẤP Y TẾ</p>
                <p className="mt-1 text-body">{emergency}</p>
                <a
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-danger px-5 py-2.5 font-bold text-white shadow-xs hover:bg-danger/90 transition-colors"
                  href="tel:115"
                >
                  Gọi Cấp cứu 115 ngay lập tức
                </a>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="ml-0 sm:ml-12 rounded-xl bg-danger-soft px-4 py-3 text-body text-danger"
              >
                {error}
              </p>
            )}

            <div ref={chatEndRef} />
          </div>

          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => handleSend()}
            disabled={isSending || isRestoring || Boolean(emergency)}
          />
        </div>
      </div>
    </div>
  );
}
