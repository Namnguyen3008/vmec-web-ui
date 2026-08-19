/**
 * LLM 3: Medical Psychology & Empathy Specialist Module
 * Generates personalized psychological reassurance, anxiety de-escalation,
 * and immediate comfort self-care tips according to the PEARLS framework.
 */

import type { PsychologicalSoothingPayload } from "./types";

interface GenerateSoothingInput {
  specialtyCode: string;
  specialtyName: string;
  doctorName: string;
  primarySymptom?: string;
  patientName?: string;
}

export function generatePsychologicalSoothing(
  input: GenerateSoothingInput
): PsychologicalSoothingPayload {
  const { specialtyCode, specialtyName, doctorName, primarySymptom } = input;

  if (specialtyCode === "TIM_MACH") {
    return {
      anxietyLevel: "MODERATE",
      comfortingMessage:
        "Bạn hãy hít thở thật sâu và giữ tâm lý thật thoải mái nhé! Triệu chứng đau tức ngực hoặc hồi hộp khi làm việc gắng sức rất thường gặp do căng thẳng, áp lực sinh hoạt hoặc nhịp tim sinh lý. Việc khám Khoa Tim Mạch là bước kiểm tra điện tim ECG nhẹ nhàng để bạn hoàn toàn yên tâm về sức khỏe của mình.",
      immediateSelfCareTips: [
        "Uống một ngụm nước ấm, ngồi tựa lưng thả lỏng cơ vai và lồng ngực.",
        "Thực hiện bài tập hít sâu 4 giây - thở chậm 6 giây để điều hòa nhịp tim.",
        "Tránh làm việc gắng sức, không thức khuya và hạn chế sử dụng cà phê/chất kích thích.",
      ],
      doctorCarePromise: `${doctorName} là chuyên gia đầu ngành rất tâm lý và chu đáo, sẽ trực tiếp lắng nghe và giải thích tận tình cho bạn.`,
    };
  }

  if (specialtyCode === "TIEU_HOA") {
    return {
      anxietyLevel: "MODERATE",
      comfortingMessage:
        "Bạn đừng quá lo lắng về cảm giác đau rát hay ợ chua ở vùng thượng vị nhé. Đây là phản ứng rất phổ biến của niêm mạc dạ dày khi căng thẳng hoặc thay đổi chế độ ăn. Với phác đồ điều trị nhẹ nhàng hiện đại, hệ tiêu hóa của bạn sẽ sớm êm dịu trở lại.",
      immediateSelfCareTips: [
        "Uống một cốc nước ấm nhỏ từng ngụm, tránh nằm ngay sau khi uống.",
        "Tạm thời hạn chế các món chua cay, dầu mỡ hoặc đồ uống có gas tối nay.",
        "Ăn đúng bữa với các món thanh đạm, mềm ấm như cháo hoặc súp.",
      ],
      doctorCarePromise: `${doctorName} rất nhẹ nhàng và giàu kinh nghiệm, sẽ thăm khám êm ái và tư vấn thực đơn khoa học cho bạn.`,
    };
  }

  if (specialtyCode === "NHI_KHOA") {
    return {
      anxietyLevel: "HIGH",
      comfortingMessage:
        "Ba mẹ hãy bình tĩnh và yên tâm nhé. Cơ thể của bé đang kích hoạt hệ miễn dịch tự nhiên để chống lại tác nhân viêm hô hấp thông thường. Việc đưa bé đến Khoa Nhi thăm khám là cách tốt nhất để bác sĩ theo dõi nhịp thở và kê đơn an toàn nhất cho lứa tuổi của con.",
      immediateSelfCareTips: [
        "Cho bé uống nhiều nước ấm hoặc bù dung dịch oresol theo nhu cầu.",
        "Mặc quần áo thoáng mát, thấm hút mồ hôi, lau người bằng nước ấm nếu bé sốt.",
        "Theo dõi sát nhịp thở và cho bé bú/ăn từng lượng nhỏ chia làm nhiều lần.",
      ],
      doctorCarePromise: `${doctorName} rất yêu trẻ và ân cần, sẽ dỗ dành bé để con không sợ hãi trong suốt quá trình thăm khám.`,
    };
  }

  if (specialtyCode === "THAN_KINH") {
    return {
      anxietyLevel: "MODERATE",
      comfortingMessage:
        "Cơn đau đầu hay chóng mặt thường xuất phát từ sự căng cứng cơ cổ vai gáy hoặc thiếu ngủ kéo dài. Bạn hãy cho phép bản thân được nghỉ ngơi một chút. Bác sĩ chuyên khoa sẽ giúp tìm ra nguyên nhân chính xác và giúp bạn lấy lại giấc ngủ ngon.",
      immediateSelfCareTips: [
        "Nghỉ ngơi trong không gian yên tĩnh, ánh sáng dịu nhẹ.",
        "Massage nhẹ nhàng vùng thái dương và sau gáy với khăn ấm.",
        "Tắt màn hình điện thoại và máy tính sớm tối nay để mắt và não bộ thư giãn.",
      ],
      doctorCarePromise: `${doctorName} sẽ trực tiếp kiểm tra phản xạ thần kinh và tư vấn giải pháp phục hồi nhẹ nhàng nhất.`,
    };
  }

  // Mặc định cho các chuyên khoa khác
  return {
    anxietyLevel: "LOW",
    comfortingMessage: `Bạn hãy giữ tinh thần thật thoải mái nhé. Triệu chứng khó chịu này hoàn toàn có thể cải thiện nhanh chóng khi được bác sĩ ${specialtyName} thăm khám và định hướng đúng cách.`,
    immediateSelfCareTips: [
      "Uống đủ nước ấm và nghỉ ngơi điều độ.",
      "Ghi lại các mốc thời gian xuất hiện triệu chứng để trao đổi với bác sĩ.",
      "Không cần lo lắng hay tự ý tìm kiếm các thông tin tiêu cực trên mạng.",
    ],
    doctorCarePromise: `${doctorName} sẽ đồng hành và chăm sóc chu đáo, giải đáp mọi thắc mắc của bạn.`,
  };
}
