from datetime import UTC, datetime

import pytest

from tax_audit_ph.domain import (
    DomainValidationError,
    validate_case_stage,
    validate_deadline_confirmation,
    validate_notice_type,
)


def test_supported_notice_and_stage() -> None:
    validate_notice_type("eLA")
    validate_case_stage("Authority Review")


def test_unknown_notice_is_rejected() -> None:
    with pytest.raises(DomainValidationError, match="Unsupported notice type"):
        validate_notice_type("Friendly reminder")


def test_preliminary_deadline_can_be_incomplete() -> None:
    validate_deadline_confirmation(
        verification_status="Preliminary",
        due_at=None,
        basis_reference=None,
        verified_by=None,
        verified_at=None,
    )


def test_confirmed_deadline_requires_accountability() -> None:
    with pytest.raises(DomainValidationError, match="verified_by"):
        validate_deadline_confirmation(
            verification_status="Confirmed",
            due_at=datetime(2026, 11, 10, tzinfo=UTC),
            basis_reference="RMO example",
            verified_by=None,
            verified_at=datetime(2026, 11, 8, tzinfo=UTC),
        )


def test_complete_confirmed_deadline_is_accepted() -> None:
    validate_deadline_confirmation(
        verification_status="Confirmed",
        due_at=datetime(2026, 11, 10, tzinfo=UTC),
        basis_reference="RMO example",
        verified_by="reviewer@example.test",
        verified_at=datetime(2026, 11, 8, tzinfo=UTC),
    )

