"""
PEARLS Framework Medical Psychology & Empathy Specialist Service.
Generates empathetic psychological reassurance, anxiety de-escalation,
immediate comfort self-care tips, and doctor care promises.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

AnxietyLevel = Literal["LOW", "MODERATE", "HIGH"]


@dataclass(frozen=True)
class PsychologicalSoothingPayload:
    anxiety_level: AnxietyLevel
    comforting_message: str
    immediate_self_care_tips: list[str]
    doctor_care_promise: str


def generate_psychological_soothing(
    specialty_code: str,
    specialty_name: str,
    doctor_name: str,
    patient_name: str = "Bạn",
) -> PsychologicalSoothingPayload:
    """
    Generates tailored psychological soothing response based on the diagnosed specialty.
    """
    code = (specialty_code or "").upper()

    if "TIM" in code or code == "TIM_MACH":
        return PsychologicalSoothingPayload(
            anxiety_level="MODERATE",
            comforting_message=(
                f"{patient_name} hãy hít thở thật sâu và giữ tâm lý thật thoải mái nhé! "
                "Triệu chứng đau tức ngực hoặc hồi hộp khi làm việc gắng sức rất thường gặp do căng thẳng, "
                "áp lực sinh hoạt hoặc nhịp tim sinh lý. Việc khám Khoa Tim Mạch là bước kiểm tra điện tim ECG nhẹ nhàng "
                "để bạn hoàn toàn yên tâm về sức khỏe của mình."
            ),
            immediate_self_care_tips=[
                "Uống một ngụm nước ấm, ngồi tựa lưng thả lỏng cơ vai và lồng ngực.",
                "Thực hiện bài tập hít sâu 4 giây - thở chậm 6 giây để điều hòa nhịp tim.",
                "Tránh làm việc gắng sức, không thức khuya và hạn chế sử dụng cà phê/chất kích thích.",
            ],
            doctor_care_promise=f"Bác sĩ {doctor_name} là chuyên gia đầu ngành rất tâm lý và chu đáo, sẽ trực tiếp lắng nghe và giải thích tận tình cho bạn.",
        )

    if "TIEU_HOA" in code:
        return PsychologicalSoothingPayload(
            anxiety_level="MODERATE",
            comforting_message=(
                f"{patient_name} đừng quá lo lắng về cảm giác đau rát hay ợ chua ở vùng thượng vị nhé. "
                "Đây là phản ứng rất phổ biến của niêm mạc dạ dày khi căng thẳng hoặc thay đổi chế độ ăn. "
                "Với các phương pháp thăm khám êm ái hiện đại, hệ tiêu hóa của bạn sẽ sớm êm dịu trở lại."
            ),
            immediate_self_care_tips=[
                "Uống một cốc nước ấm nhỏ từng ngụm, tránh nằm ngay sau khi uống.",
                "Tạm thời hạn chế các món chua cay, dầu mỡ hoặc đồ uống có gas tối nay.",
                "Ăn đúng bữa với các món thanh đạm, mềm ấm như cháo hoặc súp.",
            ],
            doctor_care_promise=f"Bác sĩ {doctor_name} rất nhẹ nhàng và giàu kinh nghiệm, sẽ thăm khám êm ái và tư vấn thực đơn khoa học cho bạn.",
        )

    if "NHI" in code or code == "NHI_KHOA":
        return PsychologicalSoothingPayload(
            anxiety_level="HIGH",
            comforting_message=(
                "Ba mẹ hãy bình tĩnh và yên tâm nhé. Cơ thể của bé đang kích hoạt hệ miễn dịch tự nhiên "
                "để chống lại tác nhân viêm nhiễm thông thường. Việc đưa bé đến Khoa Nhi thăm khám là cách tốt nhất "
                "để bác sĩ theo dõi nhịp thở và chỉ định giải pháp an toàn nhất cho lứa tuổi của con."
            ),
            immediate_self_care_tips=[
                "Cho bé uống nhiều nước ấm hoặc bù dung dịch oresol theo nhu cầu.",
                "Mặc quần áo thoáng mát, thấm hút mồ hôi, lau người bằng nước ấm nếu bé sốt.",
                "Theo dõi sát nhịp thở và cho bé bú/ăn từng lượng nhỏ chia làm nhiều lần.",
            ],
            doctor_care_promise=f"Bác sĩ {doctor_name} rất yêu trẻ và ân cần, sẽ dỗ dành bé để con không sợ hãi trong suốt quá trình thăm khám.",
        )

    if "THAN_KINH" in code:
        return PsychologicalSoothingPayload(
            anxiety_level="MODERATE",
            comforting_message=(
                "Cơn đau đầu hay chóng mặt thường xuất phát từ sự căng cứng cơ cổ vai gáy hoặc thiếu ngủ kéo dài. "
                f"{patient_name} hãy cho phép bản thân được nghỉ ngơi một chút. Bác sĩ chuyên khoa sẽ giúp tìm ra nguyên nhân chính xác "
                "và giúp bạn lấy lại giấc ngủ ngon."
            ),
            immediate_self_care_tips=[
                "Nghỉ ngơi trong không gian yên tĩnh, ánh sáng dịu nhẹ.",
                "Massage nhẹ nhàng vùng thái dương và sau gáy với khăn ấm.",
                "Tắt màn hình điện thoại và máy tính sớm tối nay để mắt và não bộ thư giãn.",
            ],
            doctor_care_promise=f"Bác sĩ {doctor_name} sẽ trực tiếp kiểm tra phản xạ thần kinh và tư vấn giải pháp phục hồi nhẹ nhàng nhất.",
        )

    # Default fallback
    return PsychologicalSoothingPayload(
        anxiety_level="LOW",
        comforting_message=(
            f"{patient_name} hãy giữ tinh thần thật thoải mái nhé. Triệu chứng khó chịu này hoàn toàn có thể cải thiện nhanh chóng "
            f"khi được bác sĩ chuyên khoa {specialty_name} thăm khám và định hướng đúng cách."
        ),
        immediate_self_care_tips=[
            "Uống đủ nước ấm và nghỉ ngơi điều độ.",
            "Ghi lại các mốc thời gian xuất hiện triệu chứng để trao đổi với bác sĩ.",
            "Không cần lo lắng hay tự ý tìm kiếm các thông tin tiêu cực trên mạng.",
        ],
        doctor_care_promise=f"Bác sĩ {doctor_name} sẽ đồng hành và chăm sóc chu đáo, giải đáp mọi thắc mắc của bạn.",
    )
