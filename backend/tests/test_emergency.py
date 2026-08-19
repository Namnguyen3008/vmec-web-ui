from src.services.emergency import screen_emergency


def test_acute_emergency_detected():
    cases = [
        ("Tôi bị đau ngực dữ dội và vã mồ hôi", "CARDIO"),
        ("Người nhà tôi bị méo miệng, nói đớ, liệt nửa người", "STROKE"),
        ("Bệnh nhân nôn ra máu tươi nhiều lần", "GI"),
        ("Cháu bé bị sốc phản vệ sau khi ăn tôm", "ALLERGY"),
        ("Bệnh nhân bị hôn mê sâu sau tai nạn", "NEURO"),
        ("Vết thương chảy máu không cầm được", "TRAUMA"),
    ]
    for text, expected_category in cases:
        res = screen_emergency(text)
        assert res.emergency is True, f"Failed to detect emergency for: '{text}'"
        assert expected_category in res.categories
        assert "115" in res.action


def test_negated_emergency_not_flagged():
    cases = [
        "Tôi bị ho sốt nhẹ nhưng không bị đau ngực",
        "Tôi không có khó thở vã mồ hôi",
        "Bệnh nhân đã hết nôn ra máu từ hôm qua",
    ]
    for text in cases:
        res = screen_emergency(text)
        assert res.emergency is False, (
            f"False positive emergency for negated text: '{text}'"
        )


def test_historical_emergency_not_flagged():
    cases = [
        "Năm ngoái tôi từng bị đột quỵ nhẹ, nay muốn khám định kỳ",
        "Trước đây từng bị ngất xỉu một lần khi tập thể thao",
    ]
    for text in cases:
        res = screen_emergency(text)
        assert res.emergency is False, (
            f"False positive for historical mention: '{text}'"
        )
