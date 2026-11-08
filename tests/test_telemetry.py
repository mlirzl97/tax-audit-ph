from datetime import UTC, datetime

import pytest

from tax_audit_ph.telemetry import TelemetryContractError, build_event


def test_allowlisted_event_is_built() -> None:
    event = build_event(
        "notice_classified",
        {"notice_type": "ela", "result": "automatic"},
        occurred_at=datetime(2026, 11, 8, 1, 2, 3, tzinfo=UTC),
    )

    assert event == {
        "schema_version": 1,
        "event": "notice_classified",
        "occurred_at": "2026-11-08T01:02:03+00:00",
        "properties": {"notice_type": "ela", "result": "automatic"},
    }


@pytest.mark.parametrize("key", ["tin", "taxpayer_name", "amount", "filename", "case_id"])
def test_sensitive_or_linkable_properties_are_rejected(key: str) -> None:
    with pytest.raises(TelemetryContractError, match="extra"):
        build_event(
            "case_created",
            {"entry_point": "self_service", key: "secret"},
        )


def test_arbitrary_categorical_value_is_rejected() -> None:
    with pytest.raises(TelemetryContractError, match="Invalid categorical value"):
        build_event("case_exported", {"format": "customer-name.zip"})


def test_naive_timestamp_is_rejected() -> None:
    with pytest.raises(TelemetryContractError, match="timezone-aware"):
        build_event(
            "case_created",
            {"entry_point": "firm"},
            occurred_at=datetime(2026, 11, 8),
        )

