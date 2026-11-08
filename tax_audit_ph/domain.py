"""Domain constants and framework-independent safety validation."""

from __future__ import annotations

from collections.abc import Iterable

NOTICE_TYPES = (
    "eLA",
    "Mission Order",
    "Tax Verification Notice",
    "Notice of Discrepancy",
    "Preliminary Assessment Notice",
    "FLD/FAN",
    "FDDA",
    "Subpoena Duces Tecum",
    "Collection Notice",
    "Other",
)

CASE_STAGES = (
    "Intake",
    "Authority Review",
    "Document Production",
    "NOD",
    "PAN",
    "FLD/FAN",
    "FDDA",
    "Collection",
    "Closed",
)

DEADLINE_VERIFICATION_STATES = ("Preliminary", "Confirmed", "Escalated")


class DomainValidationError(ValueError):
    """Raised when a case would cross a safety boundary."""


def require_member(value: str, allowed: Iterable[str], field: str) -> None:
    if value not in allowed:
        raise DomainValidationError(f"Unsupported {field}: {value!r}")


def validate_notice_type(notice_type: str) -> None:
    require_member(notice_type, NOTICE_TYPES, "notice type")


def validate_case_stage(stage: str) -> None:
    require_member(stage, CASE_STAGES, "case stage")


def validate_deadline_confirmation(
    *,
    verification_status: str,
    due_at: object | None,
    basis_reference: str | None,
    verified_by: str | None,
    verified_at: object | None,
) -> None:
    """Require an accountable reviewer before a deadline is called confirmed."""

    require_member(verification_status, DEADLINE_VERIFICATION_STATES, "verification status")
    if verification_status != "Confirmed":
        return

    missing = [
        name
        for name, value in (
            ("due_at", due_at),
            ("basis_reference", basis_reference),
            ("verified_by", verified_by),
            ("verified_at", verified_at),
        )
        if not value
    ]
    if missing:
        raise DomainValidationError(
            "A confirmed deadline requires: " + ", ".join(missing)
        )

