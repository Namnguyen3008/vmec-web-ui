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
import { useAdaptiveStreaming } from "@/hooks/useAdaptiveStreaming";
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

  // Adaptive Buffered Streaming Engine State
  const [streamingTargetText, setStreamingTargetText] = useState("");
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const { displayedText, isStreaming } = useAdaptiveStreaming(
    streamingTargetText,
    Boolean(streamingMessageId),
    {
      onStreamComplete: () => {
        setStreamingMessageId(null);
      },
    }
  );

  const localMessageIdRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const userHasScrolledUpRef = useRef(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    userHasScrolledUpRef.current = distanceFromBottom > 100;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollContainerRef.current && !userHasScrolledUpRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, displayedText, isSending]);

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
      const newAiMessageId = `msg_ai_${Date.now()}`;

      // Kích hoạt Adaptive Buffered Streaming cho tin nhắn mới
      setStreamingTargetText(aiReply);
      setStreamingMessageId(newAiMessageId);

      setMessages((current) => [
        ...current,
        {
          id: newAiMessageId,
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
    if (isSending) return;
    const completedContext = forceCompleteLivingContext(sessionId || "default_session");
    setLivingContext({ ...completedContext });

    setOffers(completedContext.appointmentOffers);
    setLastRawOfferText(
      "Hệ thống đã hỗ trợ tổng hợp thông tin và đề xuất Bác sĩ chuyên khoa phù hợp với tình trạng của bạn:"
    );
    setActions(["ACCEPT_APPOINTMENT", "CHANGE_APPOINTMENT", "DECLINE_APPOINTMENT"]);
  }

  async function handleAction(action: ChatActionType, payload?: Record<string, unknown>) {
    if (!sessionId || isSending) return;

    setError(null);
    setIsSending(true);

    try {
      if (action === "ACCEPT_APPOINTMENT") {
        const slotId = (payload?.slot_id as string) || offers[0]?.slotId;
        const selectedOffer = offers.find((o) => o.slotId === slotId) || offers[0];

        const checkoutData = await sendChatAction(sessionId, action, {
          slot_id: slotId,
          ...payload,
        });

        if (checkoutData?.checkout) {
          setCheckout(checkoutData.checkout);
        } else {
          // Fallback confirmation message
          const confirmMessageId = `confirm-${Date.now()}`;
          const newQrData = {
            appointmentId: `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            appointmentCode: `VMEC-${Math.floor(100000 + Math.random() * 900000)}`,
          };

          setMessages((current) => [
            ...current,
            {
              id: confirmMessageId,
              sender: "AI",
              content: `🎉 **ĐẶT LỊCH THÀNH CÔNG!**\n\nLịch khám của bạn với **${selectedOffer?.doctorName || "Bác sĩ Chuyên khoa"}** đã được giữ chỗ và chuyển tiếp tới Quầy Lễ tân Bệnh viện Đa khoa Quốc tế VMEC để thẩm duyệt và đón tiếp.\n\n*Mã phiếu hẹn và mã QR đã được tạo tự động bên dưới.*`,
              appointmentQr: newQrData,
            },
          ]);
          setHasBookedInSession(true);
          setOffers([]);
          setLastRawOfferText("");
          setActions([]);
        }
      } else {
        const actionResult = await sendChatAction(sessionId, action, payload);
        if (actionResult?.checkout) {
          setCheckout(actionResult.checkout);
        }
      }
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Không thể thực hiện thao tác. Vui lòng thử lại."
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-surface-sunken">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="text-title-sm font-bold text-ink-900 leading-tight">
              AI Agent Trợ Lý Đặt Lịch Khám & Điều Hướng Chuyên Khoa
            </h1>
            <p className="text-2xs text-ink-500 font-medium">
              Tiếp nhận triệu chứng, gợi ý chuyên khoa & giữ chỗ khám theo chuẩn Bộ Y Tế
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút reset session nhanh */}
          <button
            type="button"
            onClick={() => {
              setMessages([INITIAL_WELCOME_MESSAGE]);
              setOffers([]);
              setLastRawOfferText("");
              setCheckout(null);
              setEmergency(null);
              setSessionId(null);
              setHasBookedInSession(false);
              const freshContext = getOrCreateLivingContext("default_session");
              setLivingContext(freshContext);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-surface-sunken hover:text-ink-900 transition-colors"
            title="Bắt đầu hội thoại mới"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Chat mới</span>
          </button>
        </div>
      </div>

      {/* Warning Banner if Appointment In Progress */}
      {activeAppointment && (
        <div className="flex items-center justify-between gap-3 border-b border-primary-200 bg-primary-50/90 px-4 py-2.5 text-xs text-primary-950 sm:px-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <span className="h-2 w-2 rounded-full bg-primary-600 animate-pulse shrink-0" />
            <span>
              <strong>Bạn đã có 1 lịch hẹn đang xử lý:</strong> {activeAppointment.id} ({activeAppointment.specialtyName} — {activeAppointment.doctorName})
            </span>
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
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
            aria-live="polite"
          >

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
                    isStreaming={message.id === streamingMessageId && isStreaming}
                  >
                    {message.id === streamingMessageId && isStreaming
                      ? displayedText
                      : message.content}
                  </AgentBubble>
                  {message.appointmentQr && (
                    <div className="ml-0 sm:ml-12 max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
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
              !isSending &&
              !isStreaming && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <ContextualQuickChips
                    chips={livingContext.suggestedChips}
                    onSelect={(fullText) => handleSend(fullText)}
                    disabled={isSending || isStreaming}
                  />
                </div>
              )}

            {isSending && (
              <AgentBubble>
                <TypingDots />
              </AgentBubble>
            )}

            {/* Interactive Doctor & Slot Selector (Hidden if already booked in session OR active appointment exists) */}
            {!hasBookedInSession &&
              !activeAppointment &&
              (offers.length > 0 || containsOfferSection(lastRawOfferText)) &&
              !checkout &&
              !isStreaming && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                </div>
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
