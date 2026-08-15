"use client";

import { Fragment, useEffect, useState, useRef } from "react";
import { MedicalDisclaimer } from "@/components/layout/MedicalDisclaimer";
import { ProgressTracker } from "@/components/chat/ProgressTracker";
import { UserBubble, AgentBubble, TypingDots, type CitationItem } from "@/components/chat/ChatBubbles";
import { PatientInfoSidebar } from "@/components/chat/PatientInfoSidebar";
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
import { getCheckoutContext } from "@/lib/api/appointments";
import { ApiError } from "@/lib/api/client";
import { containsOfferSection, splitOfferSection } from "@/lib/chatContent";
import type { AppointmentOffer, ChatActionType, ChatMessage, CheckoutContext } from "@/lib/api/contracts";
import { HeartPulse, Stethoscope, Baby, Activity, Sparkles, RotateCcw } from "lucide-react";

interface UiMessage {
  id: string;
  sender: "PATIENT" | "AI";
  content: string;
  citations?: CitationItem[];
  confidenceScore?: number;
  quickReplies?: string[];
  appointmentQr?: { appointmentId: string; appointmentCode: string | null };
}

const QUICK_PROMPTS = [
  {
    icon: <HeartPulse className="text-danger" size={16} />,
    title: "Đau ngực trái",
    text: "Tôi bị tức ngực",
  },
  {
    icon: <Activity className="text-warning-800" size={16} />,
    title: "Đau dạ dày / ợ chua",
    text: "Tôi bị đau dạ dày",
  },
  {
    icon: <Baby className="text-primary-700" size={16} />,
    title: "Khám Nhi khoa",
    text: "Con tôi bị sốt",
  },
  {
    icon: <Stethoscope className="text-primary-600" size={16} />,
    title: "Chóng mặt / Hoa mắt",
    text: "Tôi bị chóng mặt đau đầu",
  },
];

const CHAT_SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;

function toUiMessage(message: ChatMessage): UiMessage {
  return {
    id: message.id,
    sender: message.senderType,
    content: message.senderType === "AI"
      ? splitOfferSection(message.content).advice
      : message.content,
    citations: message.citations,
    confidenceScore: message.senderType === "AI" ? 95 : undefined,
    quickReplies: Array.isArray(message.metadata?.quickReplies)
      ? (message.metadata.quickReplies as string[])
      : undefined,
    appointmentQr: message.messageType === "APPOINTMENT_QR" && typeof message.metadata.appointment_id === "string"
      ? {
          appointmentId: message.metadata.appointment_id,
          appointmentCode: typeof message.metadata.appointment_code === "string"
            ? message.metadata.appointment_code
            : null,
        }
      : undefined,
  };
}

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emergency, setEmergency] = useState<string | null>(null);
  const [actions, setActions] = useState<ChatActionType[]>([]);
  const [offers, setOffers] = useState<AppointmentOffer[]>([]);
  const [checkout, setCheckout] = useState<CheckoutContext | null>(null);
  // Nội dung AI thô gần nhất (chưa tách phần khung giờ), dùng để render
  // DoctorSlotSelector và làm nguồn fallback khi API không trả offers.
  const [lastRawOfferText, setLastRawOfferText] = useState("");

  // Dynamic state for sidebar & progress
  const [recordedSymptoms, setRecordedSymptoms] = useState<string[]>([]);
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
          return;
        }

        const history = await listChatMessages(latestSession.id);
        if (cancelled) return;

        setSessionId(latestSession.id);
        setMessages(history.map(toUiMessage));
        const lastAssistantMessage = [...history].reverse().find((message) => message.senderType === "AI");
        setLastRawOfferText(lastAssistantMessage?.content || "");
        if (latestSession.emergencyFlag) {
          setEmergency("Phiên này đã ghi nhận dấu hiệu khẩn cấp. Hãy gọi 115 hoặc bắt đầu cuộc trò chuyện mới.");
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Không thể khôi phục cuộc trò chuyện gần nhất.");
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
    if (!sessionId) return;
    const refreshConfirmedAppointment = () => {
      void listChatMessages(sessionId)
        .then((history) => setMessages(history.map(toUiMessage)))
        .catch(() => undefined);
    };
    window.addEventListener("p208:appointment-confirmed", refreshConfirmedAppointment);
    return () => window.removeEventListener("p208:appointment-confirmed", refreshConfirmedAppointment);
  }, [sessionId]);

  const currentStep = checkout
    ? 4
    : offers.length > 0
      ? 3
      : actions.includes("CONFIRM_TRIAGE") || recordedSymptoms.length > 0
        ? 2
        : 1;

  function nextLocalMessageId(prefix: string) {
    localMessageIdRef.current += 1;
    return `${prefix}-${localMessageIdRef.current}`;
  }

  async function resetChat() {
    if (isSending || isRestoring) return;
    setIsSending(true);
    setError(null);
    try {
      const session = await createChatSession();
      setSessionId(session.id);
      setMessages([]);
      setOffers([]);
      setActions([]);
      setRecordedSymptoms([]);
      setCheckout(null);
      setEmergency(null);
      setLastRawOfferText("");
      setInput("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tạo cuộc trò chuyện mới.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleSend(textToSend?: string) {
    const content = (textToSend || input).trim();
    if (!content || isSending || isRestoring || emergency) return;

    setInput("");
    setError(null);
    setIsSending(true);
    const optimisticId = nextLocalMessageId("pending");
    setMessages((current) => [...current, { id: optimisticId, sender: "PATIENT", content }]);

    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const session = await createChatSession(content.slice(0, 60));
        activeSessionId = session.id;
        setSessionId(session.id);
      }

      let result;
      try {
        result = await sendChatMessage(activeSessionId, content);
      } catch (cause) {
        if (!(cause instanceof ApiError) || cause.code !== "CHAT_SESSION_EXPIRED") throw cause;

        const session = await createChatSession(content.slice(0, 60));
        activeSessionId = session.id;
        setSessionId(session.id);
        setMessages([{ id: optimisticId, sender: "PATIENT", content }]);
        result = await sendChatMessage(activeSessionId, content);
      }

      // Tách phần danh sách khung giờ ra khỏi bubble chat: phần khung giờ
      // được hiển thị bằng component DoctorSlotSelector bên dưới.
      const assistantContent = result.assistantMessage.content;
      const { advice: assistantAdvice } = splitOfferSection(assistantContent);
      setLastRawOfferText(assistantContent);

      setMessages((current) => [
        ...current.filter((item) => item.id !== optimisticId),
        { id: result.userMessage.id, sender: "PATIENT", content: result.userMessage.content },
        {
          id: result.assistantMessage.id,
          sender: "AI",
          content: assistantAdvice,
          citations: result.assistantMessage.citations || [],
          confidenceScore: 90,
        },
      ]);

      if (result.emergency?.detected) {
        setEmergency(
          result.emergency.actionMessage ||
          "Có dấu hiệu khẩn cấp. Hãy gọi 115 hoặc đến cơ sở y tế gần nhất ngay.",
        );
      }
      setActions(result.availableActions || []);
      setOffers(
        result.appointmentOffers?.length
          ? result.appointmentOffers
          : result.appointmentOffer
            ? [result.appointmentOffer]
            : [],
      );
    } catch (cause) {
      setMessages((current) => current.filter((item) => item.id !== optimisticId));
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể kết nối với dịch vụ backend. Vui lòng kiểm tra lại dịch vụ Flask.",
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleAction(action: ChatActionType, payload: Record<string, unknown> = {}) {
    if (isSending) return;
    setIsSending(true);
    setError(null);

    try {
      if (sessionId) {
        const result = await sendChatAction(sessionId, action, payload);
        // Áp dụng tách phần khung giờ cho cả replyText từ action.
        const { advice: replyAdvice } = splitOfferSection(result.replyText);
        setLastRawOfferText(result.replyText);
        setMessages((current) => [
          ...current,
          { id: nextLocalMessageId("action"), sender: "AI", content: replyAdvice },
        ]);
        setActions(result.availableActions || []);
        setOffers(
          result.appointmentOffers?.length
            ? result.appointmentOffers
            : result.appointmentOffer
              ? [result.appointmentOffer]
              : [],
        );
        if (result.checkout?.holdToken) {
          const context = await getCheckoutContext(result.checkout.selection.slotId);
          setCheckout({ ...context, holdToken: result.checkout.holdToken });
          setOffers([]);
          setActions([]);
        }
        return;
      }
      throw new Error("Phiên hội thoại chưa được khởi tạo.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể thực hiện thao tác với máy chủ backend.",
      );
    } finally {
      setIsSending(false);
    }
  }

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, offers, isSending, emergency]);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-bg-soft/30">
      <MedicalDisclaimer />

      <div className="flex items-center border-b border-line bg-surface">
        <div className="min-w-0 flex-1">
          <ProgressTracker currentStep={currentStep} />
        </div>
        <div className="px-3 sm:px-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<RotateCcw size={15} />}
            disabled={isSending || isRestoring}
            onClick={() => void resetChat()}
          >
            Chat mới
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <div className="flex flex-1 flex-col justify-between overflow-hidden">
          {/* Main scrollable chat area */}
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite">
            {messages.length === 0 && (
              <div className="space-y-5">
                <AgentBubble
                  confidenceScore={98}
                  citations={[
                    {
                      sourceId: "BYT_STANDARDS_2026",
                      documentId: "VMEC-RAG-2026",
                      label: "Hệ thống Tri thức Y tế & Định tuyến Triage Thông minh (Bộ Y Tế)",
                      url: "https://kcb.vn",
                      sectionTitle: "Quy chuẩn Định tuyến chuyên khoa & An toàn người bệnh VMEC 2026",
                      confidence: 98,
                      snippet: "Hệ thống AI được đối chiếu và kiểm chuẩn tự động dựa trên 2.670 vector nhúng y khoa và 1.536 quy tắc phân tầng cấp cứu.",
                    },
                  ]}
                >
                  Chào bạn! Tôi là **AI Trợ lý Đặt lịch Khám thông minh**. Hãy mô tả nhu cầu khám hoặc triệu chứng ban đầu.
                  Tôi sẽ phân tích theo chuẩn y khoa Bộ Y Tế, gợi ý chuyên khoa, bác sĩ phù hợp và hỗ trợ giữ chỗ để gửi lễ tân duyệt.
                </AgentBubble>

                {/* Quick Prompts Section */}
                <div className="ml-0 sm:ml-12 rounded-card border border-line bg-surface p-4 sm:p-5 shadow-2xs">
                  <p className="font-bold text-ink-900 text-body flex items-center gap-1.5 mb-3">
                    <Sparkles size={16} className="text-primary-600 shrink-0" /> Chọn nhanh triệu chứng phổ biến để tư vấn:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(prompt.text)}
                        className="flex items-center gap-3 rounded-xl border border-line p-3 text-left hover:border-primary-400 hover:bg-primary-50 transition-all group"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-muted group-hover:bg-surface">
                          {prompt.icon}
                        </span>
                        <div>
                          <p className="font-bold text-ink-900 text-body-sm group-hover:text-primary-900">
                            {prompt.title}
                          </p>
                          <p className="text-caption text-ink-500 line-clamp-1">
                            {prompt.text}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) =>
              message.sender === "PATIENT" ? (
                <UserBubble key={message.id}>{message.content}</UserBubble>
              ) : (
                <Fragment key={message.id}>
                  <AgentBubble
                    citations={message.citations}
                    confidenceScore={message.confidenceScore}
                    quickReplies={message.quickReplies}
                    onSelectQuickReply={(replyText) => void handleSend(replyText)}
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
              ),
            )}

            {isSending && (
              <AgentBubble>
                <TypingDots />
              </AgentBubble>
            )}

            {/* Interactive Doctor & Slot Selector */}
            {(offers.length > 0 || containsOfferSection(lastRawOfferText)) && !checkout && (
              <DoctorSlotSelector
                offers={offers}
                rawTextMessage={lastRawOfferText}
                isSubmitting={isSending}
                onSelectOffer={(offer) => handleAction("ACCEPT_APPOINTMENT", { slot_id: offer.slotId })}
                onChangeAppointment={() => handleAction("CHANGE_APPOINTMENT")}
                onDeclineAppointment={() => handleAction("DECLINE_APPOINTMENT")}
              />
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
                  setMessages((current) => [
                    ...current,
                    {
                      id: `appointment-${appointment.id}`,
                      sender: "AI",
                      content: `🎉 **Yêu cầu đặt lịch ${appointment.appointmentCode || "APT-2026-CONFIRMED"} đã được gửi tới Lễ tân thành công!**\n\nLễ tân sẽ duyệt lịch và gửi thông báo xác nhận cho bạn qua tin nhắn / ứng dụng trong thời gian sớm nhất.`,
                    },
                  ]);
                }}
              />
            )}

            {/* Emergency Warning */}
            {emergency && (
              <div role="alert" className="ml-0 sm:ml-12 rounded-card border-2 border-danger bg-danger-soft p-4 sm:p-5 text-danger shadow-md">
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
              <p role="alert" className="ml-0 sm:ml-12 rounded-xl bg-danger-soft px-4 py-3 text-body text-danger">
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

        <PatientInfoSidebar
          name="Nguyễn Văn An"
          meta="Hồ sơ bệnh nhân trực tuyến"
          recordedSymptoms={recordedSymptoms}
          onSelectQuestion={(q) => handleSend(q)}
        />
      </div>
    </div>
  );
}
