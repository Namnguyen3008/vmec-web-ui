from src.services.psychology import generate_psychological_soothing


def test_cardio_psychology_soothing():
    res = generate_psychological_soothing(
        specialty_code="TIM_MACH",
        specialty_name="Khoa Tim Mạch",
        doctor_name="GS.TS Nguyễn Văn A",
        patient_name="Anh Nam",
    )
    assert res.anxiety_level == "MODERATE"
    assert "Anh Nam hãy hít thở thật sâu" in res.comforting_message
    assert len(res.immediate_self_care_tips) == 3
    assert "GS.TS Nguyễn Văn A" in res.doctor_care_promise


def test_pediatric_psychology_soothing():
    res = generate_psychological_soothing(
        specialty_code="NHI_KHOA",
        specialty_name="Khoa Nhi",
        doctor_name="BS.CKII Trần Thị B",
    )
    assert res.anxiety_level == "HIGH"
    assert "Ba mẹ hãy bình tĩnh và yên tâm" in res.comforting_message
    assert any("oresol" in tip for tip in res.immediate_self_care_tips)
    assert "yêu trẻ và ân cần" in res.doctor_care_promise


def test_fallback_psychology_soothing():
    res = generate_psychological_soothing(
        specialty_code="MAT",
        specialty_name="Khoa Mắt",
        doctor_name="BS Lê Văn C",
    )
    assert res.anxiety_level == "LOW"
    assert "Khoa Mắt" in res.comforting_message
