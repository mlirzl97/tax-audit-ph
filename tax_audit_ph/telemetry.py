"""Privacy-safe product telemetry.

Only categorical values from this file can be emitted. The event contract has
no identity, case, document, money, filename, or free-text property.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Final

SCHEMA_VERSION: Final = 1

_EVENT_SCHEMAS: Final = {
    "case_created": {
        "entry_point": {"self_service", "firm", "import"},
    },
    "notice_classified": {
        "notice_type": {
            "ela",
            "mission_order",
            "tvn",
            "nod",
            "pan",
            "fld_fan",
            "fdda",
            "sdt",
            "collection",
            "other",
        },
        "result": {"automatic", "corrected", "unsupported"},
    },
    "deadline_reviewed": {
        "result": {"confirmed", "corrected", "escalated"},
        "elapsed_bucket": {"under_10m", "10m_to_1h", "1h_to_1d", "over_1d"},
    },
    "case_stage_changed": {
        "stage": {
            "intake",
            "authority_review",
            "document_production",
            "nod",
            "pan",
            "fld_fan",
            "fdda",
            "collection",
            "closed",
        },
    },
    "professional_invited": {
        "channel": {"existing_adviser", "firm_workspace", "marketplace"},
    },
    "case_exported": {
        "format": {"zip", "pdf", "json"},
    },
    "workflow_error": {
        "error_code": {
            "unsupported_file",
            "extraction_failed",
            "import_failed",
            "permission_denied",
            "rule_unavailable",
        },
    },
}


class TelemetryContractError(ValueError):
    """Raised when an event could expose data or corrupt usage statistics."""


def build_event(
    name: str,
    properties: dict[str, str],
    *,
    occurred_at: datetime | None = None,
) -> dict[str, object]:
    """Build an allow-listed event without accepting arbitrary properties."""

    schema = _EVENT_SCHEMAS.get(name)
    if schema is None:
        raise TelemetryContractError(f"Unknown event: {name!r}")

    missing = set(schema) - set(properties)
    extra = set(properties) - set(schema)
    if missing or extra:
        raise TelemetryContractError(
            f"Invalid properties for {name!r}; missing={sorted(missing)}, extra={sorted(extra)}"
        )

    for key, value in properties.items():
        if value not in schema[key]:
            raise TelemetryContractError(
                f"Invalid categorical value for {name}.{key}: {value!r}"
            )

    timestamp = occurred_at or datetime.now(UTC)
    if timestamp.tzinfo is None:
        raise TelemetryContractError("occurred_at must be timezone-aware")

    return {
        "schema_version": SCHEMA_VERSION,
        "event": name,
        "occurred_at": timestamp.astimezone(UTC).isoformat(),
        "properties": dict(properties),
    }


def event_names() -> tuple[str, ...]:
    return tuple(_EVENT_SCHEMAS)

